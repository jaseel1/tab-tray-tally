-- Create update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tables for server-side POS data persistence

-- Settings table
CREATE TABLE public.pos_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  fssai_number TEXT,
  tax_rate NUMERIC DEFAULT 0,
  gst_inclusive BOOLEAN DEFAULT false,
  privacy_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pos_account_id)
);

-- Menu items table
CREATE TABLE public.pos_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders table
CREATE TABLE public.pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order items table
CREATE TABLE public.pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL
);

-- Categories table
CREATE TABLE public.pos_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pos_account_id, name)
);

-- Enable RLS
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for POS accounts to manage their own data
CREATE POLICY "POS accounts can manage their settings" ON public.pos_settings FOR ALL USING (true);
CREATE POLICY "POS accounts can manage their menu items" ON public.pos_menu_items FOR ALL USING (true);
CREATE POLICY "POS accounts can manage their orders" ON public.pos_orders FOR ALL USING (true);
CREATE POLICY "POS accounts can view order items" ON public.pos_order_items FOR SELECT USING (true);
CREATE POLICY "POS accounts can insert order items" ON public.pos_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "POS accounts can manage their categories" ON public.pos_categories FOR ALL USING (true);

-- Admin policies
CREATE POLICY "Admins can view all pos settings" ON public.pos_settings FOR SELECT USING (true);
CREATE POLICY "Admins can view all menu items" ON public.pos_menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can view all orders" ON public.pos_orders FOR SELECT USING (true);
CREATE POLICY "Admins can view all order items" ON public.pos_order_items FOR SELECT USING (true);
CREATE POLICY "Admins can view all categories" ON public.pos_categories FOR SELECT USING (true);

-- Create update triggers
CREATE TRIGGER update_pos_settings_updated_at
  BEFORE UPDATE ON public.pos_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_menu_items_updated_at
  BEFORE UPDATE ON public.pos_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC Functions

-- Get settings for a POS account
CREATE OR REPLACE FUNCTION public.get_pos_settings(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record FROM public.pos_settings WHERE pos_account_id = p_account_id;
  
  IF settings_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Settings not found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'data', row_to_json(settings_record)
  );
END;
$function$;

-- Upsert settings (all required params first, then all optional params)
CREATE OR REPLACE FUNCTION public.upsert_pos_settings(
  p_account_id uuid,
  p_restaurant_name text,
  p_address text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_fssai_number text DEFAULT NULL,
  p_tax_rate numeric DEFAULT 0,
  p_gst_inclusive boolean DEFAULT false,
  p_privacy_mode boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.pos_settings (
    pos_account_id, restaurant_name, address, phone, email, 
    fssai_number, tax_rate, gst_inclusive, privacy_mode
  )
  VALUES (
    p_account_id, p_restaurant_name, p_address, p_phone, p_email,
    p_fssai_number, p_tax_rate, p_gst_inclusive, p_privacy_mode
  )
  ON CONFLICT (pos_account_id) 
  DO UPDATE SET
    restaurant_name = EXCLUDED.restaurant_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    fssai_number = EXCLUDED.fssai_number,
    tax_rate = EXCLUDED.tax_rate,
    gst_inclusive = EXCLUDED.gst_inclusive,
    privacy_mode = EXCLUDED.privacy_mode,
    updated_at = now();
    
  RETURN json_build_object('success', true);
END;
$function$;

-- Get menu items for account
CREATE OR REPLACE FUNCTION public.list_menu_items(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  items_array json;
BEGIN
  SELECT json_agg(row_to_json(mi)) INTO items_array
  FROM public.pos_menu_items mi
  WHERE pos_account_id = p_account_id
  ORDER BY created_at DESC;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(items_array, '[]'::json)
  );
END;
$function$;

-- Upsert menu item (required params first, optional params last)
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
AS $function$
DECLARE
  result_id uuid;
BEGIN
  IF p_item_id IS NULL THEN
    -- Insert new item
    INSERT INTO public.pos_menu_items (pos_account_id, name, price, category, image)
    VALUES (p_account_id, p_name, p_price, p_category, p_image)
    RETURNING id INTO result_id;
  ELSE
    -- Update existing item
    UPDATE public.pos_menu_items 
    SET name = p_name, price = p_price, category = p_category, image = p_image, updated_at = now()
    WHERE id = p_item_id AND pos_account_id = p_account_id
    RETURNING id INTO result_id;
  END IF;
  
  RETURN json_build_object('success', true, 'id', result_id);
END;
$function$;

-- Delete menu item
CREATE OR REPLACE FUNCTION public.delete_menu_item(p_account_id uuid, p_item_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.pos_menu_items 
  WHERE id = p_item_id AND pos_account_id = p_account_id;
  
  RETURN json_build_object('success', true);
END;
$function$;

-- Create order
CREATE OR REPLACE FUNCTION public.create_order(
  p_account_id uuid,
  p_order_number text,
  p_total_amount numeric,
  p_payment_method text,
  p_items json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  order_id uuid;
  item_record json;
BEGIN
  -- Insert order
  INSERT INTO public.pos_orders (pos_account_id, order_number, total_amount, payment_method)
  VALUES (p_account_id, p_order_number, p_total_amount, p_payment_method)
  RETURNING id INTO order_id;
  
  -- Insert order items
  FOR item_record IN SELECT * FROM json_array_elements(p_items)
  LOOP
    INSERT INTO public.pos_order_items (order_id, item_name, quantity, unit_price, total_price)
    VALUES (
      order_id,
      item_record->>'name',
      (item_record->>'quantity')::integer,
      (item_record->>'price')::numeric,
      (item_record->>'total')::numeric
    );
  END LOOP;
  
  -- Update telemetry
  PERFORM public.update_pos_telemetry(p_account_id, p_total_amount);
  
  RETURN json_build_object('success', true, 'order_id', order_id);
END;
$function$;

-- Get item sales analytics
CREATE OR REPLACE FUNCTION public.get_item_sales(p_account_id uuid, p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sales_data json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'item_name', item_name,
      'total_quantity', total_quantity,
      'total_revenue', total_revenue,
      'order_count', order_count
    ) ORDER BY total_quantity DESC
  ) INTO sales_data
  FROM (
    SELECT 
      oi.item_name,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.total_price) as total_revenue,
      COUNT(DISTINCT o.id) as order_count
    FROM public.pos_order_items oi
    JOIN public.pos_orders o ON oi.order_id = o.id
    WHERE o.pos_account_id = p_account_id
      AND o.created_at >= (CURRENT_DATE - INTERVAL '1 day' * p_days)
    GROUP BY oi.item_name
  ) subquery;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(sales_data, '[]'::json)
  );
END;
$function$;

-- Get categories for account
CREATE OR REPLACE FUNCTION public.get_categories(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  categories_array json;
BEGIN
  SELECT json_agg(name ORDER BY name) INTO categories_array
  FROM public.pos_categories
  WHERE pos_account_id = p_account_id;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(categories_array, '["General"]'::json)
  );
END;
$function$;

-- Update categories for account
CREATE OR REPLACE FUNCTION public.upsert_categories(p_account_id uuid, p_categories text[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete existing categories
  DELETE FROM public.pos_categories WHERE pos_account_id = p_account_id;
  
  -- Insert new categories
  INSERT INTO public.pos_categories (pos_account_id, name)
  SELECT p_account_id, unnest(p_categories);
  
  RETURN json_build_object('success', true);
END;
$function$;