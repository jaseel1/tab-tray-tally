-- Add per-restaurant order editing override columns
ALTER TABLE public.pos_settings
  ADD COLUMN IF NOT EXISTS order_edit_mode text,
  ADD COLUMN IF NOT EXISTS order_edit_minutes integer;

-- Rewrite can_edit_order to use per-account settings first, fall back to global admin_settings
CREATE OR REPLACE FUNCTION public.can_edit_order(p_order_id uuid, p_account_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  order_record RECORD;
  acct_mode text;
  acct_minutes integer;
  setting_record RECORD;
  effective_mode text;
  effective_minutes integer;
  order_age_minutes INTEGER;
BEGIN
  SELECT * INTO order_record FROM public.pos_orders WHERE id = p_order_id AND pos_account_id = p_account_id;
  IF order_record IS NULL THEN
    RETURN json_build_object('success', false, 'can_edit', false, 'message', 'Order not found');
  END IF;

  SELECT order_edit_mode, order_edit_minutes INTO acct_mode, acct_minutes
    FROM public.pos_settings WHERE pos_account_id = p_account_id;

  IF acct_mode IS NOT NULL THEN
    effective_mode := acct_mode;
    effective_minutes := COALESCE(acct_minutes, 30);
  ELSE
    SELECT * INTO setting_record FROM public.admin_settings WHERE setting_key = 'order_edit_mode';
    IF setting_record IS NULL THEN
      effective_mode := 'time_limited';
      effective_minutes := 30;
    ELSE
      effective_mode := setting_record.setting_value;
      effective_minutes := COALESCE((setting_record.setting_metadata->>'minutes')::INTEGER, 30);
    END IF;
  END IF;

  IF effective_mode = 'off' THEN
    RETURN json_build_object('success', true, 'can_edit', false, 'message', 'Order editing is disabled');
  ELSIF effective_mode = 'unlimited' THEN
    RETURN json_build_object('success', true, 'can_edit', true, 'message', 'Order can be edited');
  ELSE
    order_age_minutes := EXTRACT(EPOCH FROM (now() - order_record.created_at)) / 60;
    IF order_age_minutes <= effective_minutes THEN
      RETURN json_build_object('success', true, 'can_edit', true, 'message', 'Order can be edited', 'minutes_remaining', effective_minutes - order_age_minutes);
    ELSE
      RETURN json_build_object('success', true, 'can_edit', false, 'message', 'Edit time window has expired', 'allowed_minutes', effective_minutes);
    END IF;
  END IF;
END;
$function$;

-- RPC to update per-account order editing settings (NULL mode means use global default)
CREATE OR REPLACE FUNCTION public.update_account_edit_settings(p_account_id uuid, p_mode text, p_minutes integer DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_mode IS NOT NULL AND p_mode NOT IN ('off', 'unlimited', 'time_limited') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid mode');
  END IF;

  INSERT INTO public.pos_settings (pos_account_id, restaurant_name, order_edit_mode, order_edit_minutes)
  VALUES (
    p_account_id,
    COALESCE((SELECT restaurant_name FROM public.pos_accounts WHERE id = p_account_id), 'Restaurant'),
    p_mode,
    CASE WHEN p_mode = 'time_limited' THEN COALESCE(p_minutes, 30) ELSE NULL END
  )
  ON CONFLICT (pos_account_id) DO UPDATE SET
    order_edit_mode = EXCLUDED.order_edit_mode,
    order_edit_minutes = EXCLUDED.order_edit_minutes,
    updated_at = now();

  RETURN json_build_object('success', true);
END;
$function$;