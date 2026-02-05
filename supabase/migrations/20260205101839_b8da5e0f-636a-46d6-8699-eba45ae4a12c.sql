CREATE OR REPLACE FUNCTION public.get_account_orders(
  p_account_id uuid, 
  p_limit integer DEFAULT 100, 
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orders_data json;
  total_count integer;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM public.pos_orders o
  WHERE o.pos_account_id = p_account_id;
  
  -- Get orders with items using subquery approach
  SELECT COALESCE(json_agg(order_row ORDER BY order_row.created_at DESC), '[]'::json) 
  INTO orders_data
  FROM (
    SELECT 
      o.id,
      o.order_number,
      o.total_amount,
      o.payment_method,
      o.created_at,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ), '[]'::json)
        FROM public.pos_order_items oi
        WHERE oi.order_id = o.id
      ) AS items
    FROM public.pos_orders o
    WHERE o.pos_account_id = p_account_id
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) AS order_row;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'orders', orders_data,
      'total_count', total_count,
      'limit', p_limit,
      'offset', p_offset
    )
  );
END;
$$;