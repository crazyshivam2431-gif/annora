-- ANNORA Supabase schema
create extension if not exists "pgcrypto";

create type public.user_role as enum ('donor', 'ngo', 'driver', 'admin');
create type public.donation_status as enum ('POSTED', 'MATCHED', 'DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'EXPIRED', 'FAILED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'donor',
  city text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table public.ngos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  registration_number text not null,
  description text not null default '',
  authorized_person text not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  latitude double precision,
  longitude double precision,
  max_capacity integer not null default 0,
  current_capacity integer not null default 0,
  daily_meal_requirement integer not null default 0,
  food_preferences text[] not null default '{}',
  operating_hours text not null default '',
  availability text not null default 'AVAILABLE',
  verification_status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  food_name text not null,
  category text not null,
  quantity integer not null,
  unit text not null,
  food_type text not null,
  preparation_time text not null,
  safe_until text not null,
  pickup_time text not null,
  pickup_address text not null,
  location text not null,
  latitude double precision,
  longitude double precision,
  description text not null default '',
  status public.donation_status not null default 'POSTED',
  ngo_id uuid references public.ngos(id),
  driver_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text not null default '/',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.ngos enable row level security;
alter table public.donations enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "users manage their own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "approved ngos are readable" on public.ngos for select to authenticated using (verification_status = 'APPROVED' or user_id = auth.uid());
create policy "ngo owners manage their profile" on public.ngos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "donors read their donations" on public.donations for select to authenticated using (donor_id = auth.uid() or ngo_id in (select id from public.ngos where user_id = auth.uid()) or driver_id = auth.uid());
create policy "donors create donations" on public.donations for insert to authenticated with check (donor_id = auth.uid());
create policy "notification owners read notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notification owners update notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify_nearby_ngos()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, title, message, link)
  select n.user_id, 'New nearby donation',
    concat(new.quantity, ' ', new.unit, ' of ', new.food_name, ' is available near ', new.location, '.'),
    '/dashboard/ngo'
  from public.ngos n
  where lower(n.city) = lower(new.location) and n.availability = 'AVAILABLE';
  return new;
end;
$$;

create trigger donation_notification_trigger
after insert on public.donations
for each row execute function public.notify_nearby_ngos();

-- Phase 1 foundation: trusted role checks, profile extensions, auditability, and RLS.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

create table if not exists public.donor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  organization_name text not null,
  organization_type text not null default '',
  description text not null default '',
  contact_person text not null default '',
  address text not null default '',
  state text not null default '',
  operating_hours text not null default '',
  verification_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  vehicle_type text not null default '',
  vehicle_capacity integer not null default 0 check (vehicle_capacity >= 0),
  availability_status text not null default 'OFFLINE' check (availability_status in ('AVAILABLE', 'BUSY', 'OFFLINE')),
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ngo_documents (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  storage_path text not null,
  document_type text not null,
  verification_status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.donation_matches (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  distance_km numeric,
  capacity_score numeric,
  need_score numeric,
  urgency_score numeric,
  food_compatibility_score numeric,
  driver_availability_score numeric,
  total_score numeric,
  status text not null default 'PROPOSED',
  explanation text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null unique references public.donations(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  status text not null default 'ASSIGNED',
  pickup_time timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  delivery_notes text not null default '',
  recipient_confirmation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impact_events (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid references public.donations(id) on delete set null,
  type text not null,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  tool_name text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  created_at timestamptz not null default now()
);

alter table public.donor_profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.ngo_documents enable row level security;
alter table public.donation_matches enable row level security;
alter table public.deliveries enable row level security;
alter table public.impact_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_tool_calls enable row level security;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
drop policy if exists "users manage their own profile" on public.profiles;
drop policy if exists "approved ngos are readable" on public.ngos;
drop policy if exists "ngo owners manage their profile" on public.ngos;
drop policy if exists "donors read their donations" on public.donations;
drop policy if exists "donors create donations" on public.donations;
drop policy if exists "notification owners read notifications" on public.notifications;
drop policy if exists "notification owners update notifications" on public.notifications;

create policy "profile owners and admins read profiles" on public.profiles for select to authenticated using (id = auth.uid() or public.current_user_role() = 'admin');
create policy "profile owners update profiles" on public.profiles for update to authenticated using (id = auth.uid() or public.current_user_role() = 'admin') with check (id = auth.uid() or public.current_user_role() = 'admin');
create policy "profile owners insert profiles" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "approved ngos or owners read ngos" on public.ngos for select to authenticated using (verification_status = 'APPROVED' or user_id = auth.uid() or public.current_user_role() = 'admin');
create policy "ngo owners and admins manage ngos" on public.ngos for all to authenticated using (user_id = auth.uid() or public.current_user_role() = 'admin') with check (user_id = auth.uid() or public.current_user_role() = 'admin');
create policy "owners and authorized users read donations" on public.donations for select to authenticated using (donor_id = auth.uid() or ngo_id in (select id from public.ngos where user_id = auth.uid()) or driver_id = auth.uid() or public.current_user_role() = 'admin');
create policy "donors create their donations" on public.donations for insert to authenticated with check (donor_id = auth.uid());
create policy "owners update donations" on public.donations for update to authenticated using (donor_id = auth.uid() or public.current_user_role() = 'admin') with check (donor_id = auth.uid() or public.current_user_role() = 'admin');
create policy "notification owners read notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notification owners update notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "donor owners manage donor profiles" on public.donor_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "driver owners manage driver profiles" on public.driver_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ngo owners read private documents" on public.ngo_documents for select to authenticated using (ngo_id in (select id from public.ngos where user_id = auth.uid()) or public.current_user_role() = 'admin');
create policy "ngo owners manage documents" on public.ngo_documents for all to authenticated using (ngo_id in (select id from public.ngos where user_id = auth.uid()) or public.current_user_role() = 'admin') with check (ngo_id in (select id from public.ngos where user_id = auth.uid()) or public.current_user_role() = 'admin');
create policy "authorized users read matches" on public.donation_matches for select to authenticated using (donation_id in (select id from public.donations where donor_id = auth.uid() or driver_id = auth.uid() or ngo_id in (select id from public.ngos where user_id = auth.uid())) or public.current_user_role() = 'admin');
create policy "authorized users read deliveries" on public.deliveries for select to authenticated using (driver_id = auth.uid() or ngo_id in (select id from public.ngos where user_id = auth.uid()) or donation_id in (select id from public.donations where donor_id = auth.uid()) or public.current_user_role() = 'admin');
create policy "owners read impact events" on public.impact_events for select to authenticated using (donation_id in (select id from public.donations where donor_id = auth.uid()) or public.current_user_role() = 'admin');
create policy "admins manage audit logs" on public.audit_logs for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "chat owners manage sessions" on public.chat_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chat owners manage messages" on public.chat_messages for all to authenticated using (session_id in (select id from public.chat_sessions where user_id = auth.uid())) with check (session_id in (select id from public.chat_sessions where user_id = auth.uid()));
create policy "users read own ai calls" on public.ai_tool_calls for select to authenticated using (user_id = auth.uid() or public.current_user_role() = 'admin');
