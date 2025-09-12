-- Create table for menu themes
CREATE TABLE public.pos_menu_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_account_id UUID NOT NULL,
  theme_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  custom_colors JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for digital menu settings
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

-- Enable RLS
ALTER TABLE public.pos_menu_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_digital_menus ENABLE ROW LEVEL SECURITY;

-- Create policies for pos_menu_themes
CREATE POLICY "POS accounts can manage their themes" 
ON public.pos_menu_themes 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all themes" 
ON public.pos_menu_themes 
FOR SELECT 
USING (true);

-- Create policies for pos_digital_menus
CREATE POLICY "POS accounts can manage their digital menu" 
ON public.pos_digital_menus 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all digital menus" 
ON public.pos_digital_menus 
FOR SELECT 
USING (true);

-- Public access policy for digital menus (for public menu viewing)
CREATE POLICY "Public can view active digital menus" 
ON public.pos_digital_menus 
FOR SELECT 
USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_pos_menu_themes_updated_at
BEFORE UPDATE ON public.pos_menu_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_digital_menus_updated_at
BEFORE UPDATE ON public.pos_digital_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique menu slug
CREATE OR REPLACE FUNCTION public.generate_menu_slug(p_account_id uuid, p_restaurant_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Create base slug from restaurant name
  base_slug := lower(regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'restaurant';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM public.pos_digital_menus WHERE public_url_slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- Create function to get public menu data
CREATE OR REPLACE FUNCTION public.get_public_menu(p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  menu_data json;
  settings_data json;
  theme_data json;
BEGIN
  -- Check if digital menu exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.pos_digital_menus 
    WHERE public_url_slug = p_slug AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Menu not found or inactive');
  END IF;
  
  -- Get menu items, settings, and theme for the restaurant
  SELECT json_build_object(
    'menu_items', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', mi.id,
          'name', mi.name,
          'price', mi.price,
          'category', mi.category,
          'image', mi.image
        ) ORDER BY mi.category, mi.name
      ), '[]'::json)
      FROM public.pos_menu_items mi
      WHERE mi.pos_account_id = dm.pos_account_id
    ),
    'settings', (
      SELECT row_to_json(ps)
      FROM public.pos_settings ps
      WHERE ps.pos_account_id = dm.pos_account_id
    ),
    'theme', (
      SELECT row_to_json(mt)
      FROM public.pos_menu_themes mt
      WHERE mt.pos_account_id = dm.pos_account_id AND mt.active = true
      LIMIT 1
    ),
    'digital_menu', row_to_json(dm)
  ) INTO menu_data
  FROM public.pos_digital_menus dm
  WHERE dm.public_url_slug = p_slug;
  
  RETURN json_build_object('success', true, 'data', menu_data);
END;
$function$;

-- Create function to initialize digital menu for account
CREATE OR REPLACE FUNCTION public.initialize_digital_menu(p_account_id uuid, p_restaurant_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  slug_value text;
BEGIN
  -- Generate unique slug
  slug_value := public.generate_menu_slug(p_account_id, p_restaurant_name);
  
  -- Insert digital menu record
  INSERT INTO public.pos_digital_menus (pos_account_id, public_url_slug)
  VALUES (p_account_id, slug_value)
  ON CONFLICT (pos_account_id) DO NOTHING;
  
  -- Insert default theme
  INSERT INTO public.pos_menu_themes (pos_account_id, theme_name, active)
  VALUES (p_account_id, 'modern', true)
  ON CONFLICT DO NOTHING;
  
  RETURN json_build_object('success', true, 'slug', slug_value);
END;
$function$;

-- Create function to update menu theme
CREATE OR REPLACE FUNCTION public.update_menu_theme(p_account_id uuid, p_theme_name text, p_custom_colors jsonb DEFAULT '{}')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Deactivate all themes for this account
  UPDATE public.pos_menu_themes 
  SET active = false 
  WHERE pos_account_id = p_account_id;
  
  -- Insert or update the selected theme
  INSERT INTO public.pos_menu_themes (pos_account_id, theme_name, active, custom_colors)
  VALUES (p_account_id, p_theme_name, true, p_custom_colors)
  ON CONFLICT (pos_account_id, theme_name) 
  DO UPDATE SET active = true, custom_colors = p_custom_colors, updated_at = now();
  
  RETURN json_build_object('success', true);
END;
$function$;

-- Create function to get digital menu settings
CREATE OR REPLACE FUNCTION public.get_digital_menu_settings(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
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
    ),
    'all_themes', (
      SELECT COALESCE(json_agg(row_to_json(mt) ORDER BY mt.theme_name), '[]'::json)
      FROM public.pos_menu_themes mt 
      WHERE mt.pos_account_id = p_account_id
    )
  ) INTO result;
  
  RETURN json_build_object('success', true, 'data', result);
END;
$function$;