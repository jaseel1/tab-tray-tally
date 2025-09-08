
-- 1) View-only users table
create table if not exists public.pos_viewers (
  id uuid primary key default gen_random_uuid(),
  pos_account_id uuid not null references public.pos_accounts(id) on delete cascade,
  mobile_number text not null unique,
  pin_hash text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pos_viewers enable row level security;

-- Admin-managed via RPC
create policy "Admin users can manage pos_viewers"
  on public.pos_viewers
  for all
  using (true)
  with check (true);

-- updated_at trigger
drop trigger if exists set_timestamp_pos_viewers on public.pos_viewers;
create trigger set_timestamp_pos_viewers
before update on public.pos_viewers
for each row
execute procedure public.update_updated_at_column();

-- 2) RPCs for managing viewers
create or replace function public.create_pos_viewer(
  p_account_id uuid,
  p_mobile_number text,
  p_pin text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  existing_owner text;
  existing_viewer text;
begin
  -- prevent collision with owner account mobile
  select mobile_number into existing_owner
  from public.pos_accounts
  where mobile_number = p_mobile_number;

  if existing_owner is not null then
    return json_build_object('success', false, 'message', 'Mobile number already used by a POS account');
  end if;

  -- prevent duplicate viewer mobile
  select mobile_number into existing_viewer
  from public.pos_viewers
  where mobile_number = p_mobile_number;

  if existing_viewer is not null then
    return json_build_object('success', false, 'message', 'Mobile number already exists');
  end if;

  insert into public.pos_viewers (pos_account_id, mobile_number, pin_hash)
  values (p_account_id, p_mobile_number, public.hash_password(p_pin))
  returning id into new_id;

  return json_build_object('success', true, 'viewer_id', new_id);
exception
  when others then
    return json_build_object('success', false, 'message', 'Error creating viewer');
end;
$$;

create or replace function public.list_pos_viewers(
  p_account_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  viewers json;
begin
  select json_agg(
    json_build_object(
      'id', id,
      'mobile_number', mobile_number,
      'status', status,
      'created_at', created_at
    )
    order by created_at desc
  )
  into viewers
  from public.pos_viewers
  where pos_account_id = p_account_id;

  return json_build_object('success', true, 'data', coalesce(viewers, '[]'::json));
end;
$$;

create or replace function public.toggle_pos_viewer_status(
  p_viewer_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  new_status text;
begin
  select status into current_status from public.pos_viewers where id = p_viewer_id;
  if current_status is null then
    return json_build_object('success', false, 'message', 'Viewer not found');
  end if;

  new_status := case when current_status = 'active' then 'disabled' else 'active' end;

  update public.pos_viewers
  set status = new_status
  where id = p_viewer_id;

  return json_build_object('success', true, 'new_status', new_status);
end;
$$;

create or replace function public.get_viewer_count(
  p_account_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt integer;
begin
  select count(*)
  into cnt
  from public.pos_viewers
  where pos_account_id = p_account_id
    and status = 'active';

  return json_build_object('success', true, 'count', cnt);
end;
$$;

-- 3) Update pos_login to allow viewer logins
create or replace function public.pos_login(
  p_mobile_number text,
  p_pin text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  pos_record record;
  subscription_record record;
  viewer_record record;
begin
  -- Owner POS account
  select *
  into pos_record
  from public.pos_accounts
  where mobile_number = p_mobile_number
    and pin_hash = public.hash_password(p_pin)
    and status = 'active';

  if pos_record is not null then
    select *
    into subscription_record
    from public.pos_subscriptions
    where pos_account_id = pos_record.id
      and status = 'active'
      and valid_until >= current_date
    order by valid_until desc
    limit 1;

    if subscription_record is null then
      return json_build_object('success', false, 'message', 'License expired or not found');
    end if;

    return json_build_object(
      'success', true,
      'role', 'owner',
      'account_id', pos_record.id,
      'restaurant_name', pos_record.restaurant_name,
      'mobile_number', pos_record.mobile_number,
      'license_valid_until', subscription_record.valid_until,
      'days_remaining', (subscription_record.valid_until - current_date)
    );
  end if;

  -- Viewer account
  select v.*, a.id as account_id, a.restaurant_name, a.mobile_number as account_mobile
  into viewer_record
  from public.pos_viewers v
  join public.pos_accounts a on a.id = v.pos_account_id
  where v.mobile_number = p_mobile_number
    and v.pin_hash = public.hash_password(p_pin)
    and v.status = 'active'
    and a.status = 'active';

  if viewer_record is null then
    return json_build_object('success', false, 'message', 'Invalid credentials or account disabled');
  end if;

  select *
  into subscription_record
  from public.pos_subscriptions
  where pos_account_id = viewer_record.account_id
    and status = 'active'
    and valid_until >= current_date
  order by valid_until desc
  limit 1;

  if subscription_record is null then
    return json_build_object('success', false, 'message', 'License expired or not found');
  end if;

  return json_build_object(
    'success', true,
    'role', 'viewer',
    'viewer_id', viewer_record.id,
    'account_id', viewer_record.account_id,
    'restaurant_name', viewer_record.restaurant_name,
    'mobile_number', viewer_record.account_mobile,
    'license_valid_until', subscription_record.valid_until,
    'days_remaining', (subscription_record.valid_until - current_date)
  );
end;
$$;

-- 4) Extend get_pos_accounts to include viewer_count (active viewers)
create or replace function public.get_pos_accounts()
returns table(
  id uuid,
  mobile_number text,
  restaurant_name text,
  status text,
  license_valid_until date,
  license_status text,
  days_remaining integer,
  total_orders integer,
  total_revenue numeric,
  last_active timestamptz,
  viewer_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    pa.id,
    pa.mobile_number,
    pa.restaurant_name,
    pa.status,
    ps.valid_until as license_valid_until,
    ps.status as license_status,
    (ps.valid_until - current_date) as days_remaining,
    coalesce(pt.total_orders, 0) as total_orders,
    coalesce(pt.total_revenue, 0) as total_revenue,
    pt.last_active,
    coalesce((
      select count(*)
      from public.pos_viewers pv
      where pv.pos_account_id = pa.id
        and pv.status = 'active'
    ), 0) as viewer_count
  from public.pos_accounts pa
  left join public.pos_subscriptions ps on pa.id = ps.pos_account_id and ps.status = 'active'
  left join public.pos_telemetry pt on pa.id = pt.pos_account_id
  order by pa.created_at desc;
end;
$$;
