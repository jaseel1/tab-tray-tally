
-- 1. Schema additions
ALTER TABLE public.pos_orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

ALTER TABLE public.pos_orders ALTER COLUMN payment_method DROP NOT NULL;

-- Backfill legacy orders as paid
UPDATE public.pos_orders
   SET payment_status = 'paid',
       amount_paid = total_amount
 WHERE payment_method IS NOT NULL
   AND payment_status = 'pending';

-- 2. Payments breakdown table
CREATE TABLE IF NOT EXISTS public.pos_order_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  pos_account_id uuid NOT NULL,
  method text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_order_payments_order ON public.pos_order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_payments_account ON public.pos_order_payments(pos_account_id);

ALTER TABLE public.pos_order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all order payments" ON public.pos_order_payments;
CREATE POLICY "Admins can view all order payments" ON public.pos_order_payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "POS accounts can manage their order payments" ON public.pos_order_payments;
CREATE POLICY "POS accounts can manage their order payments" ON public.pos_order_payments FOR ALL USING (true) WITH CHECK (true);

-- Backfill: one payment row per legacy paid order
INSERT INTO public.pos_order_payments (order_id, pos_account_id, method, amount, created_at)
SELECT o.id, o.pos_account_id, o.payment_method, o.total_amount, o.created_at
FROM public.pos_orders o
LEFT JOIN public.pos_order_payments p ON p.order_id = o.id
WHERE o.payment_method IS NOT NULL
  AND o.payment_status = 'paid'
  AND p.id IS NULL;

-- 3. Update create_order: when no payment_method passed, create as pending
CREATE OR REPLACE FUNCTION public.create_order(
  p_account_id uuid,
  p_order_number text,
  p_total_amount numeric,
  p_payment_method text,
  p_items json,
  p_order_type text DEFAULT 'takeaway',
  p_table_number integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_id UUID;
  item_record JSON;
  is_pending boolean;
  effective_method text;
  effective_status text;
  effective_paid numeric;
BEGIN
  is_pending := (p_payment_method IS NULL OR p_payment_method = '' OR p_payment_method = 'pending');
  effective_method := CASE WHEN is_pending THEN NULL ELSE p_payment_method END;
  effective_status := CASE WHEN is_pending THEN 'pending' ELSE 'paid' END;
  effective_paid := CASE WHEN is_pending THEN 0 ELSE p_total_amount END;

  INSERT INTO public.pos_orders (
    pos_account_id, order_number, total_amount, payment_method,
    order_type, table_number, payment_status, amount_paid
  )
  VALUES (
    p_account_id, p_order_number, p_total_amount, effective_method,
    p_order_type, p_table_number, effective_status, effective_paid
  )
  RETURNING id INTO order_id;

  FOR item_record IN SELECT * FROM json_array_elements(p_items)
  LOOP
    INSERT INTO public.pos_order_items (order_id, item_name, quantity, unit_price, total_price)
    VALUES (order_id, item_record->>'name', (item_record->>'quantity')::integer, (item_record->>'price')::numeric, (item_record->>'total')::numeric);
  END LOOP;

  IF NOT is_pending THEN
    INSERT INTO public.pos_order_payments (order_id, pos_account_id, method, amount)
    VALUES (order_id, p_account_id, p_payment_method, p_total_amount);
    PERFORM public.update_pos_telemetry(p_account_id, p_total_amount);
  END IF;

  RETURN json_build_object('success', true, 'order_id', order_id, 'payment_status', effective_status);
END;
$function$;

-- 4. Update generate_table_bill: bill but stay pending until payment recorded
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
BEGIN
  SELECT * INTO sess FROM public.pos_table_sessions WHERE id = p_session_id AND pos_account_id = p_account_id;
  IF sess IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Session not found');
  END IF;
  // IF sess.status <> 'open' THEN
  //   RETURN json_build_object('success', false, 'message', 'Session already billed');
  // END IF;

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
    -- If paid immediately (legacy path), free the table
    UPDATE public.pos_table_sessions SET status = 'closed', updated_at = now() WHERE id = sess.id;
    UPDATE public.pos_tables SET status = 'free', current_session_id = NULL, updated_at = now() WHERE id = sess.table_id;
  END IF;

  RETURN json_build_object('success', true, 'order_id', order_id, 'order_number', order_num, 'payment_status', effective_status);
END;
$function$;

-- 5. New record_order_payment RPC
CREATE OR REPLACE FUNCTION public.record_order_payment(
  p_account_id uuid,
  p_order_id uuid,
  p_payments jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ord RECORD;
  pmt jsonb;
  add_amount numeric := 0;
  new_paid numeric;
  new_status text;
  method_summary text;
  distinct_methods int;
  prior_status text;
BEGIN
  SELECT * INTO ord FROM public.pos_orders WHERE id = p_order_id AND pos_account_id = p_account_id FOR UPDATE;
  IF ord IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;
  IF ord.payment_status = 'paid' THEN
    RETURN json_build_object('success', false, 'message', 'Order already fully paid');
  END IF;

  prior_status := ord.payment_status;

  -- Insert payments
  FOR pmt IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    IF (pmt->>'amount')::numeric > 0 THEN
      INSERT INTO public.pos_order_payments (order_id, pos_account_id, method, amount)
      VALUES (p_order_id, p_account_id, pmt->>'method', (pmt->>'amount')::numeric);
      add_amount := add_amount + (pmt->>'amount')::numeric;
    END IF;
  END LOOP;

  IF add_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'No payment amount provided');
  END IF;

  new_paid := ord.amount_paid + add_amount;
  IF new_paid >= ord.total_amount THEN
    new_status := 'paid';
  ELSE
    new_status := 'partial';
  END IF;

  -- Compute method summary from all payments
  SELECT COUNT(DISTINCT method) INTO distinct_methods FROM public.pos_order_payments WHERE order_id = p_order_id;
  IF distinct_methods = 1 THEN
    SELECT method INTO method_summary FROM public.pos_order_payments WHERE order_id = p_order_id LIMIT 1;
  ELSE
    method_summary := 'split';
  END IF;

  UPDATE public.pos_orders
     SET amount_paid = new_paid,
         payment_status = new_status,
         payment_method = method_summary,
         updated_at = now()
   WHERE id = p_order_id;

  -- On transition to paid: telemetry + free table for dine-in
  IF new_status = 'paid' AND prior_status <> 'paid' THEN
    PERFORM public.update_pos_telemetry(p_account_id, ord.total_amount);

    IF ord.order_type = 'dine_in' AND ord.session_id IS NOT NULL THEN
      UPDATE public.pos_table_sessions SET status = 'closed', updated_at = now() WHERE id = ord.session_id;
      UPDATE public.pos_tables SET status = 'free', current_session_id = NULL, updated_at = now()
       WHERE current_session_id = ord.session_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'payment_status', new_status,
    'amount_paid', new_paid,
    'remaining', GREATEST(ord.total_amount - new_paid, 0)
  );
END;
$function$;

-- 6. Update get_orders to include payments
CREATE OR REPLACE FUNCTION public.get_orders(p_account_id uuid, p_limit integer DEFAULT 50)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  orders_array JSON;
BEGIN
  SELECT json_agg(order_row ORDER BY order_row.created_at DESC) INTO orders_array FROM (
    SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.created_at,
           o.order_type, o.table_number,
           o.payment_status, o.amount_paid,
           (
      SELECT COALESCE(json_agg(json_build_object(
        'item_name', oi.item_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      )), '[]'::json) FROM public.pos_order_items oi WHERE oi.order_id = o.id
    ) AS items,
    (
      SELECT COALESCE(json_agg(json_build_object(
        'method', p.method,
        'amount', p.amount,
        'created_at', p.created_at
      ) ORDER BY p.created_at), '[]'::json)
      FROM public.pos_order_payments p WHERE p.order_id = o.id
    ) AS payments
    FROM public.pos_orders o
    WHERE o.pos_account_id = p_account_id
    ORDER BY o.created_at DESC
    LIMIT p_limit
  ) AS order_row;
  RETURN json_build_object('success', true, 'data', COALESCE(orders_array, '[]'::json));
END;
$function$;
