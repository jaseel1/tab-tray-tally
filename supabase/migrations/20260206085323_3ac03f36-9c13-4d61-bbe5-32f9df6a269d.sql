-- Create admin_settings table for global configuration
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin can manage settings
CREATE POLICY "Admin users can manage admin_settings"
ON public.admin_settings
FOR ALL
USING (true);

-- Add updated_at column to pos_orders
ALTER TABLE public.pos_orders 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at on pos_orders
CREATE TRIGGER update_pos_orders_updated_at
BEFORE UPDATE ON public.pos_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default order edit setting (time_limited, 30 minutes)
INSERT INTO public.admin_settings (setting_key, setting_value, setting_metadata)
VALUES ('order_edit_mode', 'time_limited', '{"minutes": 30}'::jsonb);

-- Function to get all admin settings
CREATE OR REPLACE FUNCTION public.get_admin_settings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_data json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', s.id,
      'setting_key', s.setting_key,
      'setting_value', s.setting_value,
      'setting_metadata', s.setting_metadata,
      'updated_at', s.updated_at
    )
  ), '[]'::json) INTO settings_data
  FROM public.admin_settings s;
  
  RETURN json_build_object('success', true, 'data', settings_data);
END;
$$;

-- Function to upsert an admin setting
CREATE OR REPLACE FUNCTION public.upsert_admin_setting(
  p_key TEXT,
  p_value TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_settings (setting_key, setting_value, setting_metadata)
  VALUES (p_key, p_value, p_metadata)
  ON CONFLICT (setting_key)
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    setting_metadata = EXCLUDED.setting_metadata,
    updated_at = now();
  
  RETURN json_build_object('success', true);
END;
$$;

-- Function to check if an order can be edited
CREATE OR REPLACE FUNCTION public.can_edit_order(
  p_order_id UUID,
  p_account_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  setting_record RECORD;
  order_age_minutes INTEGER;
  allowed_minutes INTEGER;
BEGIN
  -- Get the order
  SELECT * INTO order_record
  FROM public.pos_orders
  WHERE id = p_order_id AND pos_account_id = p_account_id;
  
  IF order_record IS NULL THEN
    RETURN json_build_object('success', false, 'can_edit', false, 'message', 'Order not found');
  END IF;
  
  -- Get the edit mode setting
  SELECT * INTO setting_record
  FROM public.admin_settings
  WHERE setting_key = 'order_edit_mode';
  
  -- If no setting exists, default to time_limited with 30 minutes
  IF setting_record IS NULL THEN
    setting_record.setting_value := 'time_limited';
    setting_record.setting_metadata := '{"minutes": 30}'::jsonb;
  END IF;
  
  -- Check based on edit mode
  IF setting_record.setting_value = 'off' THEN
    RETURN json_build_object('success', true, 'can_edit', false, 'message', 'Order editing is disabled');
  ELSIF setting_record.setting_value = 'unlimited' THEN
    RETURN json_build_object('success', true, 'can_edit', true, 'message', 'Order can be edited');
  ELSE
    -- time_limited mode
    allowed_minutes := COALESCE((setting_record.setting_metadata->>'minutes')::INTEGER, 30);
    order_age_minutes := EXTRACT(EPOCH FROM (now() - order_record.created_at)) / 60;
    
    IF order_age_minutes <= allowed_minutes THEN
      RETURN json_build_object(
        'success', true, 
        'can_edit', true, 
        'message', 'Order can be edited',
        'minutes_remaining', allowed_minutes - order_age_minutes
      );
    ELSE
      RETURN json_build_object(
        'success', true, 
        'can_edit', false, 
        'message', 'Edit time window has expired',
        'allowed_minutes', allowed_minutes
      );
    END IF;
  END IF;
END;
$$;

-- Function to update order payment method
CREATE OR REPLACE FUNCTION public.update_order_payment_method(
  p_order_id UUID,
  p_payment_method TEXT,
  p_account_id UUID,
  p_is_admin BOOLEAN DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  can_edit_result json;
BEGIN
  -- If not admin, check if order can be edited
  IF NOT p_is_admin THEN
    can_edit_result := public.can_edit_order(p_order_id, p_account_id);
    
    IF NOT (can_edit_result->>'can_edit')::boolean THEN
      RETURN json_build_object(
        'success', false,
        'message', can_edit_result->>'message'
      );
    END IF;
  END IF;
  
  -- Update the payment method
  UPDATE public.pos_orders
  SET payment_method = p_payment_method, updated_at = now()
  WHERE id = p_order_id AND (p_is_admin OR pos_account_id = p_account_id);
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Order not found or access denied');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Payment method updated successfully');
END;
$$;