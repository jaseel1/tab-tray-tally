CREATE OR REPLACE FUNCTION public.get_orders(p_account_id uuid, p_limit integer DEFAULT 50)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  orders_array JSON;
BEGIN
  SELECT json_agg(order_row ORDER BY order_row.created_at DESC) INTO orders_array FROM (
    SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.created_at,
           o.order_type, o.table_number, (
      SELECT COALESCE(json_agg(json_build_object(
        'item_name', oi.item_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      )), '[]'::json) FROM public.pos_order_items oi WHERE oi.order_id = o.id
    ) AS items
    FROM public.pos_orders o
    WHERE o.pos_account_id = p_account_id
    ORDER BY o.created_at DESC
    LIMIT p_limit
  ) AS order_row;
  RETURN json_build_object('success', true, 'data', COALESCE(orders_array, '[]'::json));
END;
$$;