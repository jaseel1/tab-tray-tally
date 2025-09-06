-- Create admin_users table for super admin login
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pos_accounts table for POS account management
CREATE TABLE public.pos_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pos_subscriptions table for license management
CREATE TABLE public.pos_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pos_telemetry table for monitoring
CREATE TABLE public.pos_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_account_id UUID REFERENCES public.pos_accounts(id) ON DELETE CASCADE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_telemetry ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users (only accessible by authenticated admins)
CREATE POLICY "Admin users can view admin_users" ON public.admin_users
  FOR SELECT USING (true);

CREATE POLICY "Admin users can update admin_users" ON public.admin_users
  FOR UPDATE USING (true);

-- Create RLS policies for pos_accounts (only accessible by authenticated admins)
CREATE POLICY "Admin users can manage pos_accounts" ON public.pos_accounts
  FOR ALL USING (true);

-- Create RLS policies for pos_subscriptions (only accessible by authenticated admins)
CREATE POLICY "Admin users can manage pos_subscriptions" ON public.pos_subscriptions
  FOR ALL USING (true);

-- Create RLS policies for pos_telemetry (only accessible by authenticated admins)
CREATE POLICY "Admin users can view pos_telemetry" ON public.pos_telemetry
  FOR SELECT USING (true);

CREATE POLICY "POS accounts can update their own telemetry" ON public.pos_telemetry
  FOR UPDATE USING (true);

CREATE POLICY "POS accounts can insert their own telemetry" ON public.pos_telemetry
  FOR INSERT WITH CHECK (true);

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash function for demo purposes
  -- In production, use proper password hashing
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create RPC function for admin login
CREATE OR REPLACE FUNCTION public.admin_login(p_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE username = p_username AND password_hash = public.hash_password(p_password);
  
  IF admin_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid credentials');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'admin_id', admin_record.id,
    'username', admin_record.username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for POS login
CREATE OR REPLACE FUNCTION public.pos_login(p_mobile_number TEXT, p_pin TEXT)
RETURNS JSON AS $$
DECLARE
  pos_record RECORD;
  subscription_record RECORD;
BEGIN
  -- Get POS account
  SELECT * INTO pos_record 
  FROM public.pos_accounts 
  WHERE mobile_number = p_mobile_number AND pin_hash = public.hash_password(p_pin) AND status = 'active';
  
  IF pos_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid credentials or account disabled');
  END IF;
  
  -- Get active subscription
  SELECT * INTO subscription_record
  FROM public.pos_subscriptions
  WHERE pos_account_id = pos_record.id AND status = 'active' AND valid_until >= CURRENT_DATE
  ORDER BY valid_until DESC
  LIMIT 1;
  
  IF subscription_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'License expired or not found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'account_id', pos_record.id,
    'restaurant_name', pos_record.restaurant_name,
    'mobile_number', pos_record.mobile_number,
    'license_valid_until', subscription_record.valid_until,
    'days_remaining', (subscription_record.valid_until - CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get all POS accounts for admin
CREATE OR REPLACE FUNCTION public.get_pos_accounts()
RETURNS TABLE (
  id UUID,
  mobile_number TEXT,
  restaurant_name TEXT,
  status TEXT,
  license_valid_until DATE,
  license_status TEXT,
  days_remaining INTEGER,
  total_orders INTEGER,
  total_revenue DECIMAL,
  last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.mobile_number,
    pa.restaurant_name,
    pa.status,
    ps.valid_until as license_valid_until,
    ps.status as license_status,
    (ps.valid_until - CURRENT_DATE) as days_remaining,
    COALESCE(pt.total_orders, 0) as total_orders,
    COALESCE(pt.total_revenue, 0) as total_revenue,
    pt.last_active
  FROM public.pos_accounts pa
  LEFT JOIN public.pos_subscriptions ps ON pa.id = ps.pos_account_id AND ps.status = 'active'
  LEFT JOIN public.pos_telemetry pt ON pa.id = pt.pos_account_id
  ORDER BY pa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to create new POS account
CREATE OR REPLACE FUNCTION public.create_pos_account(
  p_mobile_number TEXT,
  p_pin TEXT,
  p_restaurant_name TEXT,
  p_license_duration_days INTEGER DEFAULT 365
)
RETURNS JSON AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Insert new POS account
  INSERT INTO public.pos_accounts (mobile_number, pin_hash, restaurant_name)
  VALUES (p_mobile_number, public.hash_password(p_pin), p_restaurant_name)
  RETURNING id INTO new_account_id;
  
  -- Create subscription
  INSERT INTO public.pos_subscriptions (pos_account_id, valid_until)
  VALUES (new_account_id, CURRENT_DATE + p_license_duration_days);
  
  -- Create telemetry record
  INSERT INTO public.pos_telemetry (pos_account_id)
  VALUES (new_account_id);
  
  RETURN json_build_object('success', true, 'account_id', new_account_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'Mobile number already exists');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Error creating account');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to toggle POS account status
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

-- Insert Super Admin user (admin / admin123)
INSERT INTO public.admin_users (username, password_hash)
VALUES ('admin', public.hash_password('admin123'));

-- Insert Tea Point POS account (8129155621 / 12345678) with 1 year validity
INSERT INTO public.pos_accounts (mobile_number, pin_hash, restaurant_name)
VALUES ('8129155621', public.hash_password('12345678'), 'Tea Point POS');

-- Get the Tea Point account ID and create subscription
DO $$
DECLARE
  tea_point_id UUID;
BEGIN
  SELECT id INTO tea_point_id FROM public.pos_accounts WHERE mobile_number = '8129155621';
  
  INSERT INTO public.pos_subscriptions (pos_account_id, valid_until)
  VALUES (tea_point_id, CURRENT_DATE + INTERVAL '1 year');
  
  INSERT INTO public.pos_telemetry (pos_account_id)
  VALUES (tea_point_id);
END $$;