
ALTER TABLE public.pos_menu_items
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS dietary text,
  ADD COLUMN IF NOT EXISTS popular boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.replace_account_menu(p_account_id uuid, p_items jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  cats text[];
  inserted int := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN json_build_object('success', false, 'message', 'Invalid items payload');
  END IF;

  DELETE FROM public.pos_menu_items WHERE pos_account_id = p_account_id;
  DELETE FROM public.pos_categories WHERE pos_account_id = p_account_id;

  SELECT ARRAY(
    SELECT DISTINCT NULLIF(btrim(elem->>'category'), '')
    FROM jsonb_array_elements(p_items) elem
    WHERE NULLIF(btrim(elem->>'category'), '') IS NOT NULL
  ) INTO cats;

  IF array_length(cats, 1) IS NULL THEN
    cats := ARRAY['General'];
  END IF;

  INSERT INTO public.pos_categories (pos_account_id, name)
  SELECT p_account_id, unnest(cats);

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF NULLIF(btrim(COALESCE(item->>'name', '')), '') IS NULL THEN
      CONTINUE;
    END IF;
    INSERT INTO public.pos_menu_items (
      pos_account_id, name, price, category, image, description, dietary, popular
    ) VALUES (
      p_account_id,
      btrim(item->>'name'),
      COALESCE((item->>'price')::numeric, 0),
      COALESCE(NULLIF(btrim(item->>'category'), ''), 'General'),
      NULLIF(item->>'image', ''),
      NULLIF(item->>'description', ''),
      NULLIF(item->>'dietary', ''),
      COALESCE((item->>'popular')::boolean, false)
    );
    inserted := inserted + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'inserted_count', inserted);
END;
$$;
