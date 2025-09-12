-- Fix ON CONFLICT errors by ensuring matching unique indexes and cleaning duplicates

-- 1) Remove duplicates so unique indexes can be created safely
-- a) pos_menu_themes: keep latest per (pos_account_id, theme_name)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY pos_account_id, theme_name 
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.pos_menu_themes
)
DELETE FROM public.pos_menu_themes t
USING ranked r
WHERE t.id = r.id AND r.rn > 1;

-- b) pos_digital_menus: keep latest per pos_account_id
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY pos_account_id 
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.pos_digital_menus
)
DELETE FROM public.pos_digital_menus d
USING ranked r
WHERE d.id = r.id AND r.rn > 1;

-- c) pos_settings: keep latest per pos_account_id
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY pos_account_id 
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.pos_settings
)
DELETE FROM public.pos_settings s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 2) Create the required unique indexes used by ON CONFLICT
-- For update_menu_theme (ON CONFLICT (pos_account_id, theme_name))
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_menu_themes_account_theme 
  ON public.pos_menu_themes (pos_account_id, theme_name);

-- For initialize_digital_menu (ON CONFLICT (pos_account_id) DO NOTHING)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_digital_menus_account 
  ON public.pos_digital_menus (pos_account_id);

-- Ensure slug uniqueness for public URLs (good data integrity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_digital_menus_slug 
  ON public.pos_digital_menus (public_url_slug);

-- For upsert_pos_settings (ON CONFLICT (pos_account_id))
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_settings_account 
  ON public.pos_settings (pos_account_id);
