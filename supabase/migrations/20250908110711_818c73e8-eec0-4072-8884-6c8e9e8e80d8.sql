
-- 1) Remove duplicate upsert_menu_item overloads to eliminate ambiguity
DROP FUNCTION IF EXISTS public.upsert_menu_item(uuid, text, numeric, text, uuid, text);
DROP FUNCTION IF EXISTS public.upsert_menu_item(uuid, text, numeric, text, text, uuid);

-- 2) Create a single, canonical upsert_menu_item (item_id before image)
CREATE OR REPLACE FUNCTION public.upsert_menu_item(
  p_account_id uuid,
  p_name text,
  p_price numeric,
  p_category text,
  p_item_id uuid DEFAULT NULL,
  p_image text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_id uuid;
BEGIN
  IF p_item_id IS NULL THEN
    INSERT INTO public.pos_menu_items (pos_account_id, name, price, category, image)
    VALUES (p_account_id, p_name, p_price, p_category, p_image)
    RETURNING id INTO result_id;
  ELSE
    UPDATE public.pos_menu_items
    SET name = p_name, price = p_price, category = p_category, image = p_image, updated_at = now()
    WHERE id = p_item_id AND pos_account_id = p_account_id
    RETURNING id INTO result_id;
  END IF;

  RETURN json_build_object('success', true, 'id', result_id);
END;
$function$;

-- 3) Fix list_menu_items ordering with json_agg ORDER BY
CREATE OR REPLACE FUNCTION public.list_menu_items(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  items_array json;
BEGIN
  SELECT json_agg(row_to_json(mi) ORDER BY mi.created_at DESC) INTO items_array
  FROM public.pos_menu_items mi
  WHERE mi.pos_account_id = p_account_id;

  RETURN json_build_object(
    'success', true,
    'data', COALESCE(items_array, '[]'::json)
  );
END;
$function$;

-- 4) New: get_orders to load order history with order items
CREATE OR REPLACE FUNCTION public.get_orders(p_account_id uuid, p_limit integer DEFAULT 50)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  orders_array json;
BEGIN
  SELECT json_agg(order_row ORDER BY order_row.created_at DESC) INTO orders_array
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
    LIMIT p_limit
  ) AS order_row;

  RETURN json_build_object('success', true, 'data', COALESCE(orders_array, '[]'::json));
END;
$function$;
