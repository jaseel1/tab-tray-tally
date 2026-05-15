
-- pos_settings: add table_count
ALTER TABLE public.pos_settings ADD COLUMN IF NOT EXISTS table_count INTEGER NOT NULL DEFAULT 0;

-- pos_orders: add order_type / table_number / session_id
ALTER TABLE public.pos_orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'takeaway';
ALTER TABLE public.pos_orders ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE public.pos_orders ADD COLUMN IF NOT EXISTS session_id UUID;

-- pos_tables
CREATE TABLE IF NOT EXISTS public.pos_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_account_id UUID NOT NULL,
  table_number INTEGER NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  current_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pos_account_id, table_number)
);

ALTER TABLE public.pos_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POS accounts can manage their tables"
  ON public.pos_tables FOR ALL USING (true) WITH CHECK (true);

-- pos_table_sessions
CREATE TABLE IF NOT EXISTS public.pos_table_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_account_id UUID NOT NULL,
  table_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  bill_number TEXT,
  billed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_table_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POS accounts can manage their table sessions"
  ON public.pos_table_sessions FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_pos_tables_updated ON public.pos_tables;
CREATE TRIGGER trg_pos_tables_updated BEFORE UPDATE ON public.pos_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pos_table_sessions_updated ON public.pos_table_sessions;
CREATE TRIGGER trg_pos_table_sessions_updated BEFORE UPDATE ON public.pos_table_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= RPCs =============

-- Super admin: set table count (0-10), creates/trims rows
CREATE OR REPLACE FUNCTION public.update_pos_table_count(p_account_id UUID, p_count INTEGER)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  i INTEGER;
BEGIN
  IF p_count < 0 OR p_count > 10 THEN
    RETURN json_build_object('success', false, 'message', 'Table count must be between 0 and 10');
  END IF;

  -- ensure pos_settings row exists
  INSERT INTO public.pos_settings (pos_account_id, restaurant_name, table_count)
  VALUES (p_account_id, COALESCE((SELECT restaurant_name FROM public.pos_accounts WHERE id = p_account_id), 'Restaurant'), p_count)
  ON CONFLICT (pos_account_id) DO UPDATE SET table_count = p_count, updated_at = now();

  -- create missing tables up to p_count
  FOR i IN 1..GREATEST(p_count, 0) LOOP
    INSERT INTO public.pos_tables (pos_account_id, table_number, label, status)
    VALUES (p_account_id, i, 'Table ' || i, 'free')
    ON CONFLICT (pos_account_id, table_number) DO NOTHING;
  END LOOP;

  -- delete extra tables (only if free)
  DELETE FROM public.pos_tables
   WHERE pos_account_id = p_account_id
     AND table_number > p_count;

  RETURN json_build_object('success', true, 'count', p_count);
END;
$$;

-- List tables with current session summary
CREATE OR REPLACE FUNCTION public.list_pos_tables(p_account_id UUID)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result JSON;
  tcount INTEGER;
BEGIN
  SELECT COALESCE(table_count, 0) INTO tcount FROM public.pos_settings WHERE pos_account_id = p_account_id;

  SELECT COALESCE(json_agg(row ORDER BY (row->>'table_number')::int), '[]'::json) INTO result FROM (
    SELECT json_build_object(
      'id', t.id,
      'table_number', t.table_number,
      'label', t.label,
      'status', t.status,
      'current_session_id', t.current_session_id,
      'session', (
        SELECT json_build_object(
          'id', s.id,
          'items', s.items,
          'subtotal', s.subtotal,
          'tax', s.tax,
          'total', s.total,
          'status', s.status,
          'bill_number', s.bill_number,
          'opened_at', s.created_at,
          'billed_at', s.billed_at
        )
        FROM public.pos_table_sessions s
        WHERE s.id = t.current_session_id
      )
    ) AS row
    FROM public.pos_tables t
    WHERE t.pos_account_id = p_account_id
  ) sub;

  RETURN json_build_object('success', true, 'data', json_build_object('tables', result, 'table_count', COALESCE(tcount, 0)));
END;
$$;

-- Upsert running session for a table
CREATE OR REPLACE FUNCTION public.upsert_table_session(
  p_account_id UUID,
  p_table_id UUID,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  table_rec RECORD;
  sess_id UUID;
BEGIN
  SELECT * INTO table_rec FROM public.pos_tables WHERE id = p_table_id AND pos_account_id = p_account_id;
  IF table_rec IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Table not found');
  END IF;

  IF table_rec.current_session_id IS NULL THEN
    INSERT INTO public.pos_table_sessions (pos_account_id, table_id, items, subtotal, tax, total, status)
    VALUES (p_account_id, p_table_id, p_items, p_subtotal, p_tax, p_total, 'open')
    RETURNING id INTO sess_id;

    UPDATE public.pos_tables SET current_session_id = sess_id, status = 'occupied', updated_at = now() WHERE id = p_table_id;
  ELSE
    sess_id := table_rec.current_session_id;
    UPDATE public.pos_table_sessions
       SET items = p_items, subtotal = p_subtotal, tax = p_tax, total = p_total, updated_at = now()
     WHERE id = sess_id;
    -- Re-set table status to occupied if it was free
    IF table_rec.status = 'free' THEN
      UPDATE public.pos_tables SET status = 'occupied', updated_at = now() WHERE id = p_table_id;
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'session_id', sess_id);
END;
$$;

-- Generate bill from a table session: creates pos_orders + items, marks session billed and table billed
CREATE OR REPLACE FUNCTION public.generate_table_bill(
  p_account_id UUID,
  p_session_id UUID,
  p_payment_method TEXT
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sess RECORD;
  tbl RECORD;
  order_id UUID;
  order_num TEXT;
  item JSONB;
BEGIN
  SELECT * INTO sess FROM public.pos_table_sessions WHERE id = p_session_id AND pos_account_id = p_account_id;
  IF sess IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Session not found');
  END IF;
  IF sess.status <> 'open' THEN
    RETURN json_build_object('success', false, 'message', 'Session already billed');
  END IF;

  SELECT * INTO tbl FROM public.pos_tables WHERE id = sess.table_id;

  order_num := 'ORD-' || EXTRACT(EPOCH FROM now())::bigint;

  INSERT INTO public.pos_orders (pos_account_id, order_number, total_amount, payment_method, order_type, table_number, session_id)
  VALUES (p_account_id, order_num, sess.total, p_payment_method, 'dine_in', tbl.table_number, sess.id)
  RETURNING id INTO order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(sess.items)
  LOOP
    INSERT INTO public.pos_order_items (order_id, item_name, quantity, unit_price, total_price)
    VALUES (
      order_id,
      item->>'name',
      (item->>'quantity')::int,
      (item->>'price')::numeric,
      (item->>'total')::numeric
    );
  END LOOP;

  UPDATE public.pos_table_sessions
     SET status = 'billed', bill_number = order_num, billed_at = now(), updated_at = now()
   WHERE id = sess.id;

  UPDATE public.pos_tables SET status = 'billed', updated_at = now() WHERE id = sess.table_id;

  PERFORM public.update_pos_telemetry(p_account_id, sess.total);

  RETURN json_build_object('success', true, 'order_id', order_id, 'order_number', order_num);
END;
$$;

-- Mark billed session as paid: closes session, frees table
CREATE OR REPLACE FUNCTION public.close_table_session(p_account_id UUID, p_session_id UUID)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sess RECORD;
BEGIN
  SELECT * INTO sess FROM public.pos_table_sessions WHERE id = p_session_id AND pos_account_id = p_account_id;
  IF sess IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Session not found');
  END IF;

  UPDATE public.pos_table_sessions SET status = 'closed', updated_at = now() WHERE id = sess.id;
  UPDATE public.pos_tables
     SET status = 'free', current_session_id = NULL, updated_at = now()
   WHERE id = sess.table_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Update create_order to support order_type/table_number from POS (takeaway/parcel)
CREATE OR REPLACE FUNCTION public.create_order(
  p_account_id uuid,
  p_order_number text,
  p_total_amount numeric,
  p_payment_method text,
  p_items json,
  p_order_type text DEFAULT 'takeaway',
  p_table_number integer DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  order_id UUID;
  item_record JSON;
BEGIN
  INSERT INTO public.pos_orders (pos_account_id, order_number, total_amount, payment_method, order_type, table_number)
  VALUES (p_account_id, p_order_number, p_total_amount, p_payment_method, p_order_type, p_table_number)
  RETURNING id INTO order_id;

  FOR item_record IN SELECT * FROM json_array_elements(p_items)
  LOOP
    INSERT INTO public.pos_order_items (order_id, item_name, quantity, unit_price, total_price)
    VALUES (order_id, item_record->>'name', (item_record->>'quantity')::integer, (item_record->>'price')::numeric, (item_record->>'total')::numeric);
  END LOOP;

  PERFORM public.update_pos_telemetry(p_account_id, p_total_amount);
  RETURN json_build_object('success', true, 'order_id', order_id);
END;
$$;
