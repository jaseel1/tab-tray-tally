CREATE OR REPLACE FUNCTION public.generate_table_bill(p_account_id uuid, p_session_id uuid, p_payment_method text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sess RECORD;
  tbl RECORD;
  order_id UUID;
  order_num TEXT;
  item JSONB;
  is_pending boolean;
  effective_method text;
  effective_status text;
  effective_paid numeric;
  existing_order RECORD;
BEGIN
  SELECT * INTO sess FROM public.pos_table_sessions WHERE id = p_session_id AND pos_account_id = p_account_id;
  IF sess IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Session not found');
  END IF;

  -- Allow re-billing if session is already billed but no payment has been recorded yet
  IF sess.status = 'billed' THEN
    SELECT * INTO existing_order
      FROM public.pos_orders
     WHERE session_id = sess.id AND pos_account_id = p_account_id
     ORDER BY created_at DESC
     LIMIT 1;

    IF existing_order IS NULL THEN
      -- No order found, treat session as open again
      NULL;
    ELSIF COALESCE(existing_order.amount_paid, 0) > 0 OR existing_order.payment_status = 'paid' THEN
      RETURN json_build_object('success', false, 'message', 'Bill already has payments and cannot be edited');
    ELSE
      -- Void the prior unpaid bill so we can regenerate
      DELETE FROM public.pos_order_payments WHERE order_id = existing_order.id;
      DELETE FROM public.pos_order_items WHERE order_id = existing_order.id;
      DELETE FROM public.pos_orders WHERE id = existing_order.id;

      UPDATE public.pos_table_sessions
         SET status = 'open', bill_number = NULL, billed_at = NULL, updated_at = now()
       WHERE id = sess.id;

      sess.status := 'open';
    END IF;
  END IF;

  IF sess.status <> 'open' THEN
    RETURN json_build_object('success', false, 'message', 'Session already billed');
  END IF;

  SELECT * INTO tbl FROM public.pos_tables WHERE id = sess.table_id;

  order_num := 'ORD-' || EXTRACT(EPOCH FROM now())::bigint;

  is_pending := (p_payment_method IS NULL OR p_payment_method = '' OR p_payment_method = 'pending');
  effective_method := CASE WHEN is_pending THEN NULL ELSE p_payment_method END;
  effective_status := CASE WHEN is_pending THEN 'pending' ELSE 'paid' END;
  effective_paid := CASE WHEN is_pending THEN 0 ELSE sess.total END;

  INSERT INTO public.pos_orders (
    pos_account_id, order_number, total_amount, payment_method,
    order_type, table_number, session_id, payment_status, amount_paid
  )
  VALUES (
    p_account_id, order_num, sess.total, effective_method,
    'dine_in', tbl.table_number, sess.id, effective_status, effective_paid
  )
  RETURNING id INTO order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(sess.items)
  LOOP
    INSERT INTO public.pos_order_items (order_id, item_name, quantity, unit_price, total_price)
    VALUES (
      order_id,
      item->>'name',
      (item->>'quantity')::int,
      (item->>'price')::numeric,
      (item->>'total')::numeric
    );
  END LOOP;

  UPDATE public.pos_table_sessions
     SET status = 'billed', bill_number = order_num, billed_at = now(), updated_at = now()
   WHERE id = sess.id;

  UPDATE public.pos_tables SET status = 'billed', updated_at = now() WHERE id = sess.table_id;

  IF NOT is_pending THEN
    INSERT INTO public.pos_order_payments (order_id, pos_account_id, method, amount)
    VALUES (order_id, p_account_id, p_payment_method, sess.total);
    PERFORM public.update_pos_telemetry(p_account_id, sess.total);
    UPDATE public.pos_table_sessions SET status = 'closed', updated_at = now() WHERE id = sess.id;
    UPDATE public.pos_tables SET status = 'free', current_session_id = NULL, updated_at = now() WHERE id = sess.table_id;
  END IF;

  RETURN json_build_object('success', true, 'order_id', order_id, 'order_number', order_num, 'payment_status', effective_status);
END;
$function$;