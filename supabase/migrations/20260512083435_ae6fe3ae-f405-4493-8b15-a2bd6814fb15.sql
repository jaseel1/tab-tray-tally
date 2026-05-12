CREATE OR REPLACE FUNCTION public.rename_pos_table(p_account_id uuid, p_table_id uuid, p_label text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trimmed text;
BEGIN
  trimmed := NULLIF(btrim(COALESCE(p_label, '')), '');
  UPDATE public.pos_tables
     SET label = COALESCE(trimmed, 'Table ' || table_number),
         updated_at = now()
   WHERE id = p_table_id AND pos_account_id = p_account_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Table not found');
  END IF;
  RETURN json_build_object('success', true);
END;
$$;