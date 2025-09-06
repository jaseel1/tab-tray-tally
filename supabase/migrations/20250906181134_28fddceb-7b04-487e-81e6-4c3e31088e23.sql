-- Create function to update POS telemetry when orders are processed
CREATE OR REPLACE FUNCTION public.update_pos_telemetry(p_account_id uuid, p_order_total numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update telemetry record
  UPDATE public.pos_telemetry 
  SET 
    total_orders = total_orders + 1,
    total_revenue = total_revenue + p_order_total,
    last_active = now()
  WHERE pos_account_id = p_account_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.pos_telemetry (pos_account_id, total_orders, total_revenue, last_active)
    VALUES (p_account_id, 1, p_order_total, now());
  END IF;
  
  RETURN json_build_object('success', true);
END;
$function$