
-- 1) Create viewers table
create table if not exists public.pos_viewers (
  id uuid primary key default gen_random_uuid(),
  pos_account_id uuid not null,
  mobile_number text not null,
  pin_hash text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pos_account_id, mobile_number)
);

-- Enable RLS and policies (consistent with existing permissive approach)
alter table public.pos_viewers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pos_viewers'
      and policyname = 'Admins can manage pos_viewers'
  ) then
    create policy "Admins can manage pos_viewers"
      on public.pos_viewers
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pos_viewers'
      and policyname = 'Admins can view all pos_viewers'
  ) then
    create policy "Admins can view all pos_viewers"
      on public.pos_viewers
      for select
      using (true);
  end if;
end $$;

-- Updated-at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_pos_viewers_updated_at'
  ) then
    create trigger set_pos_viewers_updated_at
      before update on public.pos_viewers
      for each row
      execute function public.update_updated_at_column();
  end if;
end $$;

-- 2) RPCs for viewers

-- List viewers for an account
create or replace function public.list_pos_viewers(p_account_id uuid)
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
      'id', v.id,
      'mobile_number', v.mobile_number,
      'status', v.status,
      'created_at', v.created_at
    )
    order by v.created_at desc
  )
  into viewers
  from public.pos_viewers v
  where v.pos_account_id = p_account_id;

  return json_build_object(
    'success', true,
    'data', coalesce(viewers, '[]'::json)
  );
end;
$$;

-- Create a viewer (8-digit PIN enforced)
create or replace function public.create_pos_viewer(p_account_id uuid, p_mobile_number text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if length(coalesce(p_pin, '')) <> 8 then
    return json_build_object('success', false, 'message', 'PIN must be 8 digits');
  end if;

  insert into public.pos_viewers (pos_account_id, mobile_number, pin_hash)
  values (p_account_id, p_mobile_number, public.hash_password(p_pin))
  returning id into new_id;

  return json_build_object('success', true, 'viewer_id', new_id);
exception
  when unique_violation then
    return json_build_object('success', false, 'message', 'Mobile number already exists for this account');
  when others then
    return json_build_object('success', false, 'message', 'Error creating viewer');
end;
$$;

-- Toggle viewer status
create or replace function public.toggle_pos_viewer_status(p_viewer_id uuid)
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

-- 3) Update pos_login to support viewer logins and return role
create or replace function public.pos_login(p_mobile_number text, p_pin text)
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
  -- Try owner login first
  select *
    into pos_record
  from public.pos_accounts
  where mobile_number = p_mobile_number
    and pin_hash = public.hash_password(p_pin)
    and status = 'active';

  if pos_record is not null then
    -- Verify active subscription
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

  -- Try viewer login
  select v.*, pa.restaurant_name, pa.status as account_status, pa.id as account_id
    into viewer_record
  from public.pos_viewers v
  join public.pos_accounts pa on pa.id = v.pos_account_id
  where v.mobile_number = p_mobile_number
    and v.pin_hash = public.hash_password(p_pin)
    and v.status = 'active'
    and pa.status = 'active'
  limit 1;

  if viewer_record is null then
    return json_build_object('success', false, 'message', 'Invalid credentials or account disabled');
  end if;

  -- Verify active subscription for the owning account
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
    'account_id', viewer_record.account_id,
    'restaurant_name', viewer_record.restaurant_name,
    'mobile_number', p_mobile_number,
    'license_valid_until', subscription_record.valid_until,
    'days_remaining', (subscription_record.valid_until - current_date)
  );
end;
$$;

-- 4) Extend get_pos_accounts to include viewer_count
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
      from public.pos_viewers v
      where v.pos_account_id = pa.id
        and v.status = 'active'
    ), 0) as viewer_count
  from public.pos_accounts pa
  left join public.pos_subscriptions ps
    on pa.id = ps.pos_account_id and ps.status = 'active'
  left join public.pos_telemetry pt
    on pa.id = pt.pos_account_id
  order by pa.created_at desc;
end;
$$;
