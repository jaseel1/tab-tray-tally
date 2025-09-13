-- Create comprehensive Super Admin data access functions

-- Function to get complete account details including all related data
CREATE OR REPLACE FUNCTION public.get_account_full_details(p_account_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'account', (
      SELECT row_to_json(pa)
      FROM public.pos_accounts pa
      WHERE pa.id = p_account_id
    ),
    'settings', (
      SELECT row_to_json(ps)
      FROM public.pos_settings ps
      WHERE ps.pos_account_id = p_account_id
    ),
    'subscription', (
      SELECT row_to_json(sub)
      FROM public.pos_subscriptions sub
      WHERE sub.pos_account_id = p_account_id AND sub.status = 'active'
      ORDER BY sub.valid_until DESC
      LIMIT 1
    ),
    'telemetry', (
      SELECT row_to_json(pt)
      FROM public.pos_telemetry pt
      WHERE pt.pos_account_id = p_account_id
    ),
    'digital_menu', (
      SELECT row_to_json(dm)
      FROM public.pos_digital_menus dm
      WHERE dm.pos_account_id = p_account_id
    ),
    'active_theme', (
      SELECT row_to_json(mt)
      FROM public.pos_menu_themes mt
      WHERE mt.pos_account_id = p_account_id AND mt.active = true
      LIMIT 1
    )
  ) INTO result;
  
  RETURN json_build_object('success', true, 'data', result);
END;
$function$;

-- Function to get account menu items with categories
CREATE OR REPLACE FUNCTION public.get_account_menu(p_account_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  menu_items json;
  categories json;
BEGIN
  -- Get menu items
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', mi.id,
      'name', mi.name,
      'price', mi.price,
      'category', mi.category,
      'image', mi.image,
      'created_at', mi.created_at,
      'updated_at', mi.updated_at
    ) ORDER BY mi.category, mi.name
  ), '[]'::json) INTO menu_items
  FROM public.pos_menu_items mi
  WHERE mi.pos_account_id = p_account_id;
  
  -- Get categories
  SELECT COALESCE(json_agg(pc.name ORDER BY pc.name), '[]'::json) INTO categories
  FROM public.pos_categories pc
  WHERE pc.pos_account_id = p_account_id;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'menu_items', menu_items,
      'categories', categories
    )
  );
END;
$function$;

-- Function to get account orders with detailed information
CREATE OR REPLACE FUNCTION public.get_account_orders(p_account_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  orders_data json;
  total_count integer;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM public.pos_orders o
  WHERE o.pos_account_id = p_account_id;
  
  -- Get orders with items
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'total_amount', o.total_amount,
      'payment_method', o.payment_method,
      'created_at', o.created_at,
      'items', (
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
      )
    ) ORDER BY o.created_at DESC
  ), '[]'::json) INTO orders_data
  FROM public.pos_orders o
  WHERE o.pos_account_id = p_account_id
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
  
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
$function$;

-- Function to get account analytics and performance metrics
CREATE OR REPLACE FUNCTION public.get_account_analytics(p_account_id uuid, p_days integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  analytics_data json;
BEGIN
  SELECT json_build_object(
    'summary', json_build_object(
      'total_orders', (
        SELECT COUNT(*)
        FROM public.pos_orders o
        WHERE o.pos_account_id = p_account_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
      ),
      'total_revenue', (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM public.pos_orders o
        WHERE o.pos_account_id = p_account_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
      ),
      'average_order_value', (
        SELECT COALESCE(AVG(o.total_amount), 0)
        FROM public.pos_orders o
        WHERE o.pos_account_id = p_account_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
      ),
      'unique_items_sold', (
        SELECT COUNT(DISTINCT oi.item_name)
        FROM public.pos_order_items oi
        JOIN public.pos_orders o ON oi.order_id = o.id
        WHERE o.pos_account_id = p_account_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
      )
    ),
    'daily_revenue', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'date', daily_stats.order_date,
          'revenue', daily_stats.daily_revenue,
          'orders', daily_stats.daily_orders
        ) ORDER BY daily_stats.order_date
      ), '[]'::json)
      FROM (
        SELECT 
          DATE(o.created_at) as order_date,
          SUM(o.total_amount) as daily_revenue,
          COUNT(*) as daily_orders
        FROM public.pos_orders o
        WHERE o.pos_account_id = p_account_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at)
      ) daily_stats
    ),
    'top_items', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'item_name', item_stats.item_name,
          'quantity_sold', item_stats.total_quantity,
          'revenue', item_stats.total_revenue
        ) ORDER BY item_stats.total_quantity DESC
      ), '[]'::json)
      FROM (
        SELECT 
          oi.item_name,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.total_price) as total_revenue
        FROM public.pos_order_items oi
        JOIN public.pos_orders o ON oi.order_id = o.id
        WHERE o.pos_account_id = p_account_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
        GROUP BY oi.item_name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 10
      ) item_stats
    )
  ) INTO analytics_data;
  
  RETURN json_build_object('success', true, 'data', analytics_data);
END;
$function$;

-- Function to search accounts by various criteria
CREATE OR REPLACE FUNCTION public.search_pos_accounts(p_search_term text DEFAULT '', p_status text DEFAULT '', p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  accounts_data json;
  total_count integer;
  where_clause text := 'WHERE 1=1';
BEGIN
  -- Build dynamic where clause
  IF p_search_term != '' THEN
    where_clause := where_clause || ' AND (pa.restaurant_name ILIKE ''%' || p_search_term || '%'' OR pa.mobile_number ILIKE ''%' || p_search_term || '%'')';
  END IF;
  
  IF p_status != '' THEN
    where_clause := where_clause || ' AND pa.status = ''' || p_status || '''';
  END IF;
  
  -- Get total count
  EXECUTE 'SELECT COUNT(*) FROM public.pos_accounts pa ' || where_clause INTO total_count;
  
  -- Get accounts with related data
  EXECUTE '
    SELECT COALESCE(json_agg(
      json_build_object(
        ''id'', pa.id,
        ''mobile_number'', pa.mobile_number,
        ''restaurant_name'', pa.restaurant_name,
        ''status'', pa.status,
        ''created_at'', pa.created_at,
        ''license_valid_until'', ps.valid_until,
        ''license_status'', ps.status,
        ''days_remaining'', (ps.valid_until - CURRENT_DATE),
        ''total_orders'', COALESCE(pt.total_orders, 0),
        ''total_revenue'', COALESCE(pt.total_revenue, 0),
        ''last_active'', pt.last_active
      ) ORDER BY pa.created_at DESC
    ), ''[]''::json)
    FROM public.pos_accounts pa
    LEFT JOIN public.pos_subscriptions ps ON pa.id = ps.pos_account_id AND ps.status = ''active''
    LEFT JOIN public.pos_telemetry pt ON pa.id = pt.pos_account_id
    ' || where_clause || '
    ORDER BY pa.created_at DESC
    LIMIT ' || p_limit || ' OFFSET ' || p_offset
  INTO accounts_data;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'accounts', accounts_data,
      'total_count', total_count,
      'limit', p_limit,
      'offset', p_offset
    )
  );
END;
$function$;