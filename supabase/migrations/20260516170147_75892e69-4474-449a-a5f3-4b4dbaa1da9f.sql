CREATE OR REPLACE FUNCTION public.admin_delete_order(p_account_id uuid, p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ord RECORD;
BEGIN
  SELECT * INTO ord FROM public.pos_orders WHERE id = p_order_id AND pos_account_id = p_account_id;
  IF ord IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  DELETE FROM public.pos_order_payments WHERE order_id = p_order_id;
  DELETE FROM public.pos_order_items WHERE order_id = p_order_id;
  DELETE FROM public.pos_orders WHERE id = p_order_id;

  IF ord.payment_status = 'paid' THEN
    UPDATE public.pos_telemetry
       SET total_orders = GREATEST(COALESCE(total_orders, 0) - 1, 0),
           total_revenue = GREATEST(COALESCE(total_revenue, 0) - COALESCE(ord.total_amount, 0), 0)
     WHERE pos_account_id = p_account_id;
  END IF;

  IF ord.order_type = 'dine_in' AND ord.session_id IS NOT NULL THEN
    UPDATE public.pos_tables
       SET status = 'free', current_session_id = NULL, updated_at = now()
     WHERE current_session_id = ord.session_id;
    DELETE FROM public.pos_table_sessions WHERE id = ord.session_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Order deleted');
END;
$function$;