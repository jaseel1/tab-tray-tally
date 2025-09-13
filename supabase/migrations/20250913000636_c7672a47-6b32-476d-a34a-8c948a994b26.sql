-- Fix search_pos_accounts function to resolve GROUP BY error
CREATE OR REPLACE FUNCTION public.search_pos_accounts(
  p_search_term text DEFAULT ''::text, 
  p_status text DEFAULT ''::text, 
  p_limit integer DEFAULT 50, 
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  accounts_data json;
  total_count integer;
  where_clause text := 'WHERE 1=1';
  query_text text;
BEGIN
  -- Build dynamic where clause
  IF p_search_term != '' THEN
    where_clause := where_clause || ' AND (pa.restaurant_name ILIKE ''%' || p_search_term || '%'' OR pa.mobile_number ILIKE ''%' || p_search_term || '%'')';
  END IF;
  
  IF p_status != '' AND p_status != 'all' THEN
    where_clause := where_clause || ' AND pa.status = ''' || p_status || '''';
  END IF;
  
  -- Get total count
  query_text := 'SELECT COUNT(*) FROM public.pos_accounts pa ' || where_clause;
  EXECUTE query_text INTO total_count;
  
  -- Get accounts with related data - fixed query structure
  query_text := '
    SELECT COALESCE(json_agg(
      json_build_object(
        ''id'', account_data.id,
        ''mobile_number'', account_data.mobile_number,
        ''restaurant_name'', account_data.restaurant_name,
        ''status'', account_data.status,
        ''created_at'', account_data.created_at,
        ''license_valid_until'', account_data.license_valid_until,
        ''license_status'', account_data.license_status,
        ''days_remaining'', account_data.days_remaining,
        ''total_orders'', account_data.total_orders,
        ''total_revenue'', account_data.total_revenue,
        ''last_active'', account_data.last_active
      ) ORDER BY account_data.created_at DESC
    ), ''[]''::json)
    FROM (
      SELECT 
        pa.id,
        pa.mobile_number,
        pa.restaurant_name,
        pa.status,
        pa.created_at,
        ps.valid_until as license_valid_until,
        ps.status as license_status,
        (ps.valid_until - CURRENT_DATE) as days_remaining,
        COALESCE(pt.total_orders, 0) as total_orders,
        COALESCE(pt.total_revenue, 0) as total_revenue,
        pt.last_active
      FROM public.pos_accounts pa
      LEFT JOIN public.pos_subscriptions ps ON pa.id = ps.pos_account_id AND ps.status = ''active''
      LEFT JOIN public.pos_telemetry pt ON pa.id = pt.pos_account_id
      ' || where_clause || '
      ORDER BY pa.created_at DESC
      LIMIT ' || p_limit || ' OFFSET ' || p_offset || '
    ) account_data';
  
  EXECUTE query_text INTO accounts_data;
  
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
$function$