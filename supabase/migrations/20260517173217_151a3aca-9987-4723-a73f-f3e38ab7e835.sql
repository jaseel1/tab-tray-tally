CREATE OR REPLACE FUNCTION public.get_account_orders(p_account_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  orders_data JSON;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.pos_orders o WHERE o.pos_account_id = p_account_id;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', sub.id,
      'order_number', sub.order_number,
      'total_amount', sub.total_amount,
      'payment_method', sub.payment_method,
      'payment_status', sub.payment_status,
      'amount_paid', sub.amount_paid,
      'order_type', sub.order_type,
      'table_number', sub.table_number,
      'session_id', sub.session_id,
      'created_at', sub.created_at,
      'items', (
        SELECT COALESCE(json_agg(json_build_object(
          'item_name', oi.item_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )), '[]'::json)
        FROM public.pos_order_items oi WHERE oi.order_id = sub.id
      ),
      'payments', (
        SELECT COALESCE(json_agg(json_build_object(
          'method', p.method,
          'amount', p.amount,
          'created_at', p.created_at
        ) ORDER BY p.created_at), '[]'::json)
        FROM public.pos_order_payments p WHERE p.order_id = sub.id
      )
    ) ORDER BY sub.created_at DESC
  ), '[]'::json) INTO orders_data
  FROM (
    SELECT o.id, o.order_number, o.total_amount, o.payment_method,
           o.payment_status, o.amount_paid, o.order_type, o.table_number,
           o.session_id, o.created_at
    FROM public.pos_orders o
    WHERE o.pos_account_id = p_account_id
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN json_build_object('success', true, 'data', json_build_object(
    'orders', orders_data,
    'total_count', total_count,
    'limit', p_limit,
    'offset', p_offset
  ));
END;
$function$;