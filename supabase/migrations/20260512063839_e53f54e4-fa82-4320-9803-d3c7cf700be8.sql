
-- Enable pgcrypto extension for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- BASE TABLES
-- ============================================

CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pos_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pos_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pos_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

CREATE TABLE public.pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL
);

CREATE TABLE public.pos_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pos_account_id, name)
);

CREATE TABLE public.pos_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID NOT NULL REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mobile_number)
);

CREATE TABLE public.pos_menu_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_account_id UUID NOT NULL,
  theme_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  custom_colors JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pos_account_id, theme_name)
);

CREATE TABLE public.pos_digital_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_account_id UUID NOT NULL UNIQUE,
  public_url_slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  qr_code_generated BOOLEAN NOT NULL DEFAULT false,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_menu_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_digital_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view admin_users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Admin users can update admin_users" ON public.admin_users FOR UPDATE USING (true);
CREATE POLICY "Admin users can manage pos_accounts" ON public.pos_accounts FOR ALL USING (true);
CREATE POLICY "Admin users can manage pos_subscriptions" ON public.pos_subscriptions FOR ALL USING (true);
CREATE POLICY "Admin users can view pos_telemetry" ON public.pos_telemetry FOR SELECT USING (true);
CREATE POLICY "POS accounts can update their own telemetry" ON public.pos_telemetry FOR UPDATE USING (true);
CREATE POLICY "POS accounts can insert their own telemetry" ON public.pos_telemetry FOR INSERT WITH CHECK (true);
CREATE POLICY "POS accounts can manage their settings" ON public.pos_settings FOR ALL USING (true);
CREATE POLICY "POS accounts can manage their menu items" ON public.pos_menu_items FOR ALL USING (true);
CREATE POLICY "POS accounts can manage their orders" ON public.pos_orders FOR ALL USING (true);
CREATE POLICY "POS accounts can view order items" ON public.pos_order_items FOR SELECT USING (true);
CREATE POLICY "POS accounts can insert order items" ON public.pos_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "POS accounts can manage their categories" ON public.pos_categories FOR ALL USING (true);
CREATE POLICY "Admin users can manage pos_viewers" ON public.pos_viewers FOR ALL USING (true);
CREATE POLICY "POS accounts can manage their themes" ON public.pos_menu_themes FOR ALL USING (true);
CREATE POLICY "POS accounts can manage their digital menu" ON public.pos_digital_menus FOR ALL USING (true);
CREATE POLICY "Admin users can manage admin_settings" ON public.admin_settings FOR ALL USING (true);
CREATE POLICY "Admins can view all pos settings" ON public.pos_settings FOR SELECT USING (true);
CREATE POLICY "Admins can view all menu items" ON public.pos_menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can view all orders" ON public.pos_orders FOR SELECT USING (true);
CREATE POLICY "Admins can view all order items" ON public.pos_order_items FOR SELECT USING (true);
CREATE POLICY "Admins can view all categories" ON public.pos_categories FOR SELECT USING (true);
CREATE POLICY "Admins can view all themes" ON public.pos_menu_themes FOR SELECT USING (true);
CREATE POLICY "Admins can view all digital menus" ON public.pos_digital_menus FOR SELECT USING (true);
CREATE POLICY "Public can view active digital menus" ON public.pos_digital_menus FOR SELECT USING (is_active = true);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pos_settings_updated_at BEFORE UPDATE ON public.pos_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_menu_items_updated_at BEFORE UPDATE ON public.pos_menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_orders_updated_at BEFORE UPDATE ON public.pos_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_timestamp_pos_viewers BEFORE UPDATE ON public.pos_viewers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_menu_themes_updated_at BEFORE UPDATE ON public.pos_menu_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_digital_menus_updated_at BEFORE UPDATE ON public.pos_digital_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_login(p_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT * INTO admin_record FROM public.admin_users WHERE username = p_username AND password_hash = public.hash_password(p_password);
  IF admin_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid credentials');
  END IF;
  RETURN json_build_object('success', true, 'admin_id', admin_record.id, 'username', admin_record.username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.pos_login(p_mobile_number TEXT, p_pin TEXT)
RETURNS JSON AS $$
DECLARE
  pos_record RECORD;
  subscription_record RECORD;
  viewer_record RECORD;
BEGIN
  SELECT * INTO pos_record FROM public.pos_accounts WHERE mobile_number = p_mobile_number AND pin_hash = public.hash_password(p_pin) AND status = 'active';
  IF pos_record IS NOT NULL THEN
    SELECT * INTO subscription_record FROM public.pos_subscriptions WHERE pos_account_id = pos_record.id AND status = 'active' AND valid_until >= CURRENT_DATE ORDER BY valid_until DESC LIMIT 1;
    IF subscription_record IS NULL THEN
      RETURN json_build_object('success', false, 'message', 'License expired or not found');
    END IF;
    RETURN json_build_object('success', true, 'role', 'owner', 'account_id', pos_record.id, 'restaurant_name', pos_record.restaurant_name, 'mobile_number', pos_record.mobile_number, 'license_valid_until', subscription_record.valid_until, 'days_remaining', (subscription_record.valid_until - CURRENT_DATE));
  END IF;

  SELECT v.*, a.id as account_id, a.restaurant_name, a.mobile_number as account_mobile INTO viewer_record
  FROM public.pos_viewers v JOIN public.pos_accounts a ON a.id = v.pos_account_id
  WHERE v.mobile_number = p_mobile_number AND v.pin_hash = public.hash_password(p_pin) AND v.status = 'active' AND a.status = 'active';

  IF viewer_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid credentials or account disabled');
  END IF;

  SELECT * INTO subscription_record FROM public.pos_subscriptions WHERE pos_account_id = viewer_record.account_id AND status = 'active' AND valid_until >= CURRENT_DATE ORDER BY valid_until DESC LIMIT 1;
  IF subscription_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'License expired or not found');
  END IF;

  RETURN json_build_object('success', true, 'role', 'viewer', 'viewer_id', viewer_record.id, 'account_id', viewer_record.account_id, 'restaurant_name', viewer_record.restaurant_name, 'mobile_number', p_mobile_number, 'license_valid_until', subscription_record.valid_until, 'days_remaining', (subscription_record.valid_until - CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pos_accounts()
RETURNS TABLE (id UUID, mobile_number TEXT, restaurant_name TEXT, status TEXT, license_valid_until DATE, license_status TEXT, days_remaining INTEGER, total_orders INTEGER, total_revenue DECIMAL, last_active TIMESTAMP WITH TIME ZONE, viewer_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT pa.id, pa.mobile_number, pa.restaurant_name, pa.status, ps.valid_until as license_valid_until, ps.status as license_status, (ps.valid_until - CURRENT_DATE) as days_remaining, COALESCE(pt.total_orders, 0) as total_orders, COALESCE(pt.total_revenue, 0) as total_revenue, pt.last_active, COALESCE((SELECT count(*) FROM public.pos_viewers pv WHERE pv.pos_account_id = pa.id AND pv.status = 'active'), 0) as viewer_count
  FROM public.pos_accounts pa LEFT JOIN public.pos_subscriptions ps ON pa.id = ps.pos_account_id AND ps.status = 'active' LEFT JOIN public.pos_telemetry pt ON pa.id = pt.pos_account_id ORDER BY pa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_pos_account(p_mobile_number TEXT, p_pin TEXT, p_restaurant_name TEXT, p_license_duration_days INTEGER DEFAULT 365)
RETURNS JSON AS $$
DECLARE
  new_account_id UUID;
BEGIN
  INSERT INTO public.pos_accounts (mobile_number, pin_hash, restaurant_name) VALUES (p_mobile_number, public.hash_password(p_pin), p_restaurant_name) RETURNING id INTO new_account_id;
  INSERT INTO public.pos_subscriptions (pos_account_id, valid_until) VALUES (new_account_id, CURRENT_DATE + p_license_duration_days);
  INSERT INTO public.pos_telemetry (pos_account_id) VALUES (new_account_id);
  RETURN json_build_object('success', true, 'account_id', new_account_id);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'message', 'Mobile number already exists');
WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Error creating account');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.toggle_pos_account_status(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  current_status TEXT;
  new_status TEXT;
BEGIN
  SELECT status INTO current_status FROM public.pos_accounts WHERE id = p_account_id;
  IF current_status IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Account not found');
  END IF;
  new_status := CASE WHEN current_status = 'active' THEN 'disabled' ELSE 'active' END;
  UPDATE public.pos_accounts SET status = new_status WHERE id = p_account_id;
  RETURN json_build_object('success', true, 'new_status', new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_pos_telemetry(p_account_id UUID, p_order_total NUMERIC)
RETURNS JSON AS $$
BEGIN
  UPDATE public.pos_telemetry SET total_orders = total_orders + 1, total_revenue = total_revenue + p_order_total, last_active = now() WHERE pos_account_id = p_account_id;
  IF NOT FOUND THEN
    INSERT INTO public.pos_telemetry (pos_account_id, total_orders, total_revenue, last_active) VALUES (p_account_id, 1, p_order_total, now());
  END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pos_settings(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record FROM public.pos_settings WHERE pos_account_id = p_account_id;
  IF settings_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Settings not found');
  END IF;
  RETURN json_build_object('success', true, 'data', row_to_json(settings_record));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.upsert_pos_settings(p_account_id UUID, p_restaurant_name TEXT, p_address TEXT DEFAULT NULL, p_phone TEXT DEFAULT NULL, p_email TEXT DEFAULT NULL, p_fssai_number TEXT DEFAULT NULL, p_tax_rate NUMERIC DEFAULT 0, p_gst_inclusive BOOLEAN DEFAULT false, p_privacy_mode BOOLEAN DEFAULT false)
RETURNS JSON AS $$
BEGIN
  INSERT INTO public.pos_settings (pos_account_id, restaurant_name, address, phone, email, fssai_number, tax_rate, gst_inclusive, privacy_mode)
  VALUES (p_account_id, p_restaurant_name, p_address, p_phone, p_email, p_fssai_number, p_tax_rate, p_gst_inclusive, p_privacy_mode)
  ON CONFLICT (pos_account_id) DO UPDATE SET restaurant_name = EXCLUDED.restaurant_name, address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email, fssai_number = EXCLUDED.fssai_number, tax_rate = EXCLUDED.tax_rate, gst_inclusive = EXCLUDED.gst_inclusive, privacy_mode = EXCLUDED.privacy_mode, updated_at = now();
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.list_menu_items(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  items_array JSON;
BEGIN
  SELECT json_agg(row_to_json(mi) ORDER BY mi.created_at DESC) INTO items_array FROM public.pos_menu_items mi WHERE mi.pos_account_id = p_account_id;
  RETURN json_build_object('success', true, 'data', COALESCE(items_array, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.upsert_menu_item(p_account_id UUID, p_name TEXT, p_price NUMERIC, p_category TEXT, p_item_id UUID DEFAULT NULL, p_image TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result_id UUID;
BEGIN
  IF p_item_id IS NULL THEN
    INSERT INTO public.pos_menu_items (pos_account_id, name, price, category, image) VALUES (p_account_id, p_name, p_price, p_category, p_image) RETURNING id INTO result_id;
  ELSE
    UPDATE public.pos_menu_items SET name = p_name, price = p_price, category = p_category, image = p_image, updated_at = now() WHERE id = p_item_id AND pos_account_id = p_account_id RETURNING id INTO result_id;
  END IF;
  RETURN json_build_object('success', true, 'id', result_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_menu_item(p_account_id UUID, p_item_id UUID)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.pos_menu_items WHERE id = p_item_id AND pos_account_id = p_account_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_order(p_account_id UUID, p_order_number TEXT, p_total_amount NUMERIC, p_payment_method TEXT, p_items JSON)
RETURNS JSON AS $$
DECLARE
  order_id UUID;
  item_record JSON;
BEGIN
  INSERT INTO public.pos_orders (pos_account_id, order_number, total_amount, payment_method) VALUES (p_account_id, p_order_number, p_total_amount, p_payment_method) RETURNING id INTO order_id;
  FOR item_record IN SELECT * FROM json_array_elements(p_items)
  LOOP
    INSERT INTO public.pos_order_items (order_id, item_name, quantity, unit_price, total_price) VALUES (order_id, item_record->>'name', (item_record->>'quantity')::integer, (item_record->>'price')::numeric, (item_record->>'total')::numeric);
  END LOOP;
  PERFORM public.update_pos_telemetry(p_account_id, p_total_amount);
  RETURN json_build_object('success', true, 'order_id', order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_item_sales(p_account_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  sales_data JSON;
BEGIN
  SELECT json_agg(json_build_object('item_name', item_name, 'total_quantity', total_quantity, 'total_revenue', total_revenue, 'order_count', order_count) ORDER BY total_quantity DESC) INTO sales_data
  FROM (SELECT oi.item_name, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_revenue, COUNT(DISTINCT o.id) as order_count FROM public.pos_order_items oi JOIN public.pos_orders o ON oi.order_id = o.id WHERE o.pos_account_id = p_account_id AND o.created_at >= (CURRENT_DATE - INTERVAL '1 day' * p_days) GROUP BY oi.item_name) subquery;
  RETURN json_build_object('success', true, 'data', COALESCE(sales_data, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_categories(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  categories_array JSON;
BEGIN
  SELECT json_agg(name ORDER BY name) INTO categories_array FROM public.pos_categories WHERE pos_account_id = p_account_id;
  RETURN json_build_object('success', true, 'data', COALESCE(categories_array, '["General"]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.upsert_categories(p_account_id UUID, p_categories TEXT[])
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.pos_categories WHERE pos_account_id = p_account_id;
  INSERT INTO public.pos_categories (pos_account_id, name) SELECT p_account_id, unnest(p_categories);
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_orders(p_account_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS JSON AS $$
DECLARE
  orders_array JSON;
BEGIN
  SELECT json_agg(order_row ORDER BY order_row.created_at DESC) INTO orders_array FROM (
    SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.created_at, (
      SELECT COALESCE(json_agg(json_build_object('item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price)), '[]'::json) FROM public.pos_order_items oi WHERE oi.order_id = o.id
    ) AS items FROM public.pos_orders o WHERE o.pos_account_id = p_account_id ORDER BY o.created_at DESC LIMIT p_limit
  ) AS order_row;
  RETURN json_build_object('success', true, 'data', COALESCE(orders_array, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_pos_viewer(p_account_id UUID, p_mobile_number TEXT, p_pin TEXT)
RETURNS JSON AS $$
DECLARE
  new_id UUID;
  existing_owner TEXT;
  existing_viewer TEXT;
BEGIN
  SELECT mobile_number INTO existing_owner FROM public.pos_accounts WHERE mobile_number = p_mobile_number;
  IF existing_owner IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Mobile number already used by a POS account');
  END IF;
  SELECT mobile_number INTO existing_viewer FROM public.pos_viewers WHERE mobile_number = p_mobile_number;
  IF existing_viewer IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Mobile number already exists');
  END IF;
  INSERT INTO public.pos_viewers (pos_account_id, mobile_number, pin_hash) VALUES (p_account_id, p_mobile_number, public.hash_password(p_pin)) RETURNING id INTO new_id;
  RETURN json_build_object('success', true, 'viewer_id', new_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Error creating viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.list_pos_viewers(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  viewers JSON;
BEGIN
  SELECT json_agg(json_build_object('id', id, 'mobile_number', mobile_number, 'status', status, 'created_at', created_at) ORDER BY created_at DESC) INTO viewers FROM public.pos_viewers WHERE pos_account_id = p_account_id;
  RETURN json_build_object('success', true, 'data', COALESCE(viewers, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.toggle_pos_viewer_status(p_viewer_id UUID)
RETURNS JSON AS $$
DECLARE
  current_status TEXT;
  new_status TEXT;
BEGIN
  SELECT status INTO current_status FROM public.pos_viewers WHERE id = p_viewer_id;
  IF current_status IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Viewer not found');
  END IF;
  new_status := CASE WHEN current_status = 'active' THEN 'disabled' ELSE 'active' END;
  UPDATE public.pos_viewers SET status = new_status WHERE id = p_viewer_id;
  RETURN json_build_object('success', true, 'new_status', new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_viewer_count(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT count(*) INTO cnt FROM public.pos_viewers WHERE pos_account_id = p_account_id AND status = 'active';
  RETURN json_build_object('success', true, 'count', cnt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_menu_slug(p_account_id UUID, p_restaurant_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'restaurant'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.pos_digital_menus WHERE public_url_slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_public_menu(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  menu_data JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pos_digital_menus WHERE public_url_slug = p_slug AND is_active = true) THEN
    RETURN json_build_object('success', false, 'message', 'Menu not found or inactive');
  END IF;
  SELECT json_build_object('menu_items', (SELECT COALESCE(json_agg(json_build_object('id', mi.id, 'name', mi.name, 'price', mi.price, 'category', mi.category, 'image', mi.image) ORDER BY mi.category, mi.name), '[]'::json) FROM public.pos_menu_items mi WHERE mi.pos_account_id = dm.pos_account_id), 'settings', (SELECT row_to_json(ps) FROM public.pos_settings ps WHERE ps.pos_account_id = dm.pos_account_id), 'theme', (SELECT row_to_json(mt) FROM public.pos_menu_themes mt WHERE mt.pos_account_id = dm.pos_account_id AND mt.active = true LIMIT 1), 'digital_menu', row_to_json(dm)) INTO menu_data FROM public.pos_digital_menus dm WHERE dm.public_url_slug = p_slug;
  RETURN json_build_object('success', true, 'data', menu_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.initialize_digital_menu(p_account_id UUID, p_restaurant_name TEXT)
RETURNS JSON AS $$
DECLARE
  slug_value TEXT;
BEGIN
  slug_value := public.generate_menu_slug(p_account_id, p_restaurant_name);
  INSERT INTO public.pos_digital_menus (pos_account_id, public_url_slug) VALUES (p_account_id, slug_value) ON CONFLICT (pos_account_id) DO NOTHING;
  INSERT INTO public.pos_menu_themes (pos_account_id, theme_name, active) VALUES (p_account_id, 'modern', true) ON CONFLICT DO NOTHING;
  RETURN json_build_object('success', true, 'slug', slug_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_menu_theme(p_account_id UUID, p_theme_name TEXT, p_custom_colors JSONB DEFAULT '{}')
RETURNS JSON AS $$
BEGIN
  UPDATE public.pos_menu_themes SET active = false WHERE pos_account_id = p_account_id;
  INSERT INTO public.pos_menu_themes (pos_account_id, theme_name, active, custom_colors) VALUES (p_account_id, p_theme_name, true, p_custom_colors) ON CONFLICT (pos_account_id, theme_name) DO UPDATE SET active = true, custom_colors = p_custom_colors, updated_at = now();
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_digital_menu_settings(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object('digital_menu', (SELECT row_to_json(dm) FROM public.pos_digital_menus dm WHERE dm.pos_account_id = p_account_id), 'active_theme', (SELECT row_to_json(mt) FROM public.pos_menu_themes mt WHERE mt.pos_account_id = p_account_id AND mt.active = true LIMIT 1), 'all_themes', (SELECT COALESCE(json_agg(row_to_json(mt) ORDER BY mt.theme_name), '[]'::json) FROM public.pos_menu_themes mt WHERE mt.pos_account_id = p_account_id)) INTO result;
  RETURN json_build_object('success', true, 'data', result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_account_full_details(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object('account', (SELECT row_to_json(pa) FROM public.pos_accounts pa WHERE pa.id = p_account_id), 'settings', (SELECT row_to_json(ps) FROM public.pos_settings ps WHERE ps.pos_account_id = p_account_id), 'subscription', (SELECT row_to_json(sub) FROM public.pos_subscriptions sub WHERE sub.pos_account_id = p_account_id AND sub.status = 'active' ORDER BY sub.valid_until DESC LIMIT 1), 'telemetry', (SELECT row_to_json(pt) FROM public.pos_telemetry pt WHERE pt.pos_account_id = p_account_id), 'digital_menu', (SELECT row_to_json(dm) FROM public.pos_digital_menus dm WHERE dm.pos_account_id = p_account_id), 'active_theme', (SELECT row_to_json(mt) FROM public.pos_menu_themes mt WHERE mt.pos_account_id = p_account_id AND mt.active = true LIMIT 1)) INTO result;
  RETURN json_build_object('success', true, 'data', result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_account_menu(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  menu_items JSON;
  categories JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object('id', mi.id, 'name', mi.name, 'price', mi.price, 'category', mi.category, 'image', mi.image, 'created_at', mi.created_at, 'updated_at', mi.updated_at) ORDER BY mi.category, mi.name), '[]'::json) INTO menu_items FROM public.pos_menu_items mi WHERE mi.pos_account_id = p_account_id;
  SELECT COALESCE(json_agg(pc.name ORDER BY pc.name), '[]'::json) INTO categories FROM public.pos_categories pc WHERE pc.pos_account_id = p_account_id;
  RETURN json_build_object('success', true, 'data', json_build_object('menu_items', menu_items, 'categories', categories));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_account_orders(p_account_id UUID, p_limit INTEGER DEFAULT 100, p_offset INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  orders_data JSON;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.pos_orders o WHERE o.pos_account_id = p_account_id;
  SELECT COALESCE(json_agg(json_build_object('id', o.id, 'order_number', o.order_number, 'total_amount', o.total_amount, 'payment_method', o.payment_method, 'created_at', o.created_at, 'items', (SELECT COALESCE(json_agg(json_build_object('item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price)), '[]'::json) FROM public.pos_order_items oi WHERE oi.order_id = o.id)) ORDER BY o.created_at DESC), '[]'::json) INTO orders_data FROM public.pos_orders o WHERE o.pos_account_id = p_account_id ORDER BY o.created_at DESC LIMIT p_limit OFFSET p_offset;
  RETURN json_build_object('success', true, 'data', json_build_object('orders', orders_data, 'total_count', total_count, 'limit', p_limit, 'offset', p_offset));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_account_analytics(p_account_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  analytics_data JSON;
BEGIN
  SELECT json_build_object('summary', json_build_object('total_orders', (SELECT COUNT(*) FROM public.pos_orders o WHERE o.pos_account_id = p_account_id AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days), 'total_revenue', (SELECT COALESCE(SUM(o.total_amount), 0) FROM public.pos_orders o WHERE o.pos_account_id = p_account_id AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days), 'average_order_value', (SELECT COALESCE(AVG(o.total_amount), 0) FROM public.pos_orders o WHERE o.pos_account_id = p_account_id AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days), 'unique_items_sold', (SELECT COUNT(DISTINCT oi.item_name) FROM public.pos_order_items oi JOIN public.pos_orders o ON oi.order_id = o.id WHERE o.pos_account_id = p_account_id AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days)), 'daily_revenue', (SELECT COALESCE(json_agg(json_build_object('date', daily_stats.order_date, 'revenue', daily_stats.daily_revenue, 'orders', daily_stats.daily_orders) ORDER BY daily_stats.order_date), '[]'::json) FROM (SELECT DATE(o.created_at) as order_date, SUM(o.total_amount) as daily_revenue, COUNT(*) as daily_orders FROM public.pos_orders o WHERE o.pos_account_id = p_account_id AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days GROUP BY DATE(o.created_at) ORDER BY DATE(o.created_at)) daily_stats), 'top_items', (SELECT COALESCE(json_agg(json_build_object('item_name', item_stats.item_name, 'quantity_sold', item_stats.total_quantity, 'revenue', item_stats.total_revenue) ORDER BY item_stats.total_quantity DESC), '[]'::json) FROM (SELECT oi.item_name, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_revenue FROM public.pos_order_items oi JOIN public.pos_orders o ON oi.order_id = o.id WHERE o.pos_account_id = p_account_id AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days GROUP BY oi.item_name ORDER BY SUM(oi.quantity) DESC LIMIT 10) item_stats)) INTO analytics_data;
  RETURN json_build_object('success', true, 'data', analytics_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.search_pos_accounts(p_search_term TEXT DEFAULT '', p_status TEXT DEFAULT '', p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  accounts_data JSON;
  total_count INTEGER;
  where_clause TEXT := 'WHERE 1=1';
  query_text TEXT;
BEGIN
  IF p_search_term != '' THEN
    where_clause := where_clause || ' AND (pa.restaurant_name ILIKE ''%' || p_search_term || '%'' OR pa.mobile_number ILIKE ''%' || p_search_term || '%'')';
  END IF;
  IF p_status != '' AND p_status != 'all' THEN
    where_clause := where_clause || ' AND pa.status = ''' || p_status || '''';
  END IF;
  query_text := 'SELECT COUNT(*) FROM public.pos_accounts pa ' || where_clause;
  EXECUTE query_text INTO total_count;
  query_text := 'SELECT COALESCE(json_agg(json_build_object(''id'', account_data.id, ''mobile_number'', account_data.mobile_number, ''restaurant_name'', account_data.restaurant_name, ''status'', account_data.status, ''created_at'', account_data.created_at, ''license_valid_until'', account_data.license_valid_until, ''license_status'', account_data.license_status, ''days_remaining'', account_data.days_remaining, ''total_orders'', account_data.total_orders, ''total_revenue'', account_data.total_revenue, ''last_active'', account_data.last_active) ORDER BY account_data.created_at DESC), ''[]''::json) FROM (SELECT pa.id, pa.mobile_number, pa.restaurant_name, pa.status, pa.created_at, ps.valid_until as license_valid_until, ps.status as license_status, (ps.valid_until - CURRENT_DATE) as days_remaining, COALESCE(pt.total_orders, 0) as total_orders, COALESCE(pt.total_revenue, 0) as total_revenue, pt.last_active FROM public.pos_accounts pa LEFT JOIN public.pos_subscriptions ps ON pa.id = ps.pos_account_id AND ps.status = ''active'' LEFT JOIN public.pos_telemetry pt ON pa.id = pt.pos_account_id ' || where_clause || ' ORDER BY pa.created_at DESC LIMIT ' || p_limit || ' OFFSET ' || p_offset || ') account_data';
  EXECUTE query_text INTO accounts_data;
  RETURN json_build_object('success', true, 'data', json_build_object('accounts', accounts_data, 'total_count', total_count, 'limit', p_limit, 'offset', p_offset));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_settings()
RETURNS JSON AS $$
DECLARE
  settings_data JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object('id', s.id, 'setting_key', s.setting_key, 'setting_value', s.setting_value, 'setting_metadata', s.setting_metadata, 'updated_at', s.updated_at)), '[]'::json) INTO settings_data FROM public.admin_settings s;
  RETURN json_build_object('success', true, 'data', settings_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.upsert_admin_setting(p_key TEXT, p_value TEXT, p_metadata JSONB DEFAULT '{}'::jsonb)
RETURNS JSON AS $$
BEGIN
  INSERT INTO public.admin_settings (setting_key, setting_value, setting_metadata) VALUES (p_key, p_value, p_metadata) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, setting_metadata = EXCLUDED.setting_metadata, updated_at = now();
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_edit_order(p_order_id UUID, p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  order_record RECORD;
  setting_record RECORD;
  order_age_minutes INTEGER;
  allowed_minutes INTEGER;
BEGIN
  SELECT * INTO order_record FROM public.pos_orders WHERE id = p_order_id AND pos_account_id = p_account_id;
  IF order_record IS NULL THEN
    RETURN json_build_object('success', false, 'can_edit', false, 'message', 'Order not found');
  END IF;
  SELECT * INTO setting_record FROM public.admin_settings WHERE setting_key = 'order_edit_mode';
  IF setting_record IS NULL THEN
    setting_record.setting_value := 'time_limited';
    setting_record.setting_metadata := '{"minutes": 30}'::jsonb;
  END IF;
  IF setting_record.setting_value = 'off' THEN
    RETURN json_build_object('success', true, 'can_edit', false, 'message', 'Order editing is disabled');
  ELSIF setting_record.setting_value = 'unlimited' THEN
    RETURN json_build_object('success', true, 'can_edit', true, 'message', 'Order can be edited');
  ELSE
    allowed_minutes := COALESCE((setting_record.setting_metadata->>'minutes')::INTEGER, 30);
    order_age_minutes := EXTRACT(EPOCH FROM (now() - order_record.created_at)) / 60;
    IF order_age_minutes <= allowed_minutes THEN
      RETURN json_build_object('success', true, 'can_edit', true, 'message', 'Order can be edited', 'minutes_remaining', allowed_minutes - order_age_minutes);
    ELSE
      RETURN json_build_object('success', true, 'can_edit', false, 'message', 'Edit time window has expired', 'allowed_minutes', allowed_minutes);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_order_payment_method(p_order_id UUID, p_payment_method TEXT, p_account_id UUID, p_is_admin BOOLEAN DEFAULT false)
RETURNS JSON AS $$
DECLARE
  can_edit_result JSON;
BEGIN
  IF NOT p_is_admin THEN
    can_edit_result := public.can_edit_order(p_order_id, p_account_id);
    IF NOT (can_edit_result->>'can_edit')::boolean THEN
      RETURN json_build_object('success', false, 'message', can_edit_result->>'message');
    END IF;
  END IF;
  UPDATE public.pos_orders SET payment_method = p_payment_method, updated_at = now() WHERE id = p_order_id AND (p_is_admin OR pos_account_id = p_account_id);
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Order not found or access denied');
  END IF;
  RETURN json_build_object('success', true, 'message', 'Payment method updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.admin_users (username, password_hash)
VALUES ('admin', public.hash_password('12345678'));

INSERT INTO public.pos_accounts (mobile_number, pin_hash, restaurant_name)
VALUES ('8129155621', public.hash_password('12345678'), 'Tea Point POS');

DO $$
DECLARE
  tea_point_id UUID;
BEGIN
  SELECT id INTO tea_point_id FROM public.pos_accounts WHERE mobile_number = '8129155621';
  INSERT INTO public.pos_subscriptions (pos_account_id, valid_until) VALUES (tea_point_id, CURRENT_DATE + INTERVAL '1 year');
  INSERT INTO public.pos_telemetry (pos_account_id) VALUES (tea_point_id);
END $$;

INSERT INTO public.admin_settings (setting_key, setting_value, setting_metadata)
VALUES ('order_edit_mode', 'time_limited', '{"minutes": 30}'::jsonb);
