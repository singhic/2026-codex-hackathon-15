create schema if not exists api;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

revoke all on schema api from public, anon;
revoke all on schema private from public, anon, authenticated;
grant usage on schema api to authenticated, service_role;
grant usage on schema private to postgres, service_role, supabase_auth_admin;

alter default privileges for role postgres in schema api revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public, anon, authenticated;

create type public.age_band as enum ('teens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties_plus');
create type public.test_status as enum ('draft', 'scheduled', 'active', 'completed', 'cancelled');
create type private.billing_status as enum ('reserved', 'settled', 'cancelled');
create type private.owner_credit_entry_type as enum ('admin_grant', 'test_charge', 'test_refund', 'adjustment');
create type private.reward_point_entry_type as enum ('vote_reward', 'adjustment');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  region_code text check (region_code is null or char_length(region_code) between 2 and 20),
  age_band public.age_band,
  updated_at timestamptz not null default now()
);

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique check (char_length(name) between 1 and 40),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

create table public.profile_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id smallint not null references public.categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table public.legal_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  document_key text not null check (document_key ~ '^[a-z0-9-]+$'),
  version text not null check (char_length(version) between 1 and 20),
  title text not null check (char_length(title) between 1 and 100),
  is_required boolean not null,
  effective_at timestamptz not null,
  retired_at timestamptz,
  unique (document_key, version),
  check (retired_at is null or retired_at > effective_at)
);

create table public.user_consents (
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid not null references public.legal_documents (id) on delete restrict,
  agreed_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  primary key (user_id, document_id),
  check (withdrawn_at is null or withdrawn_at >= agreed_at)
);

create table public.stores (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 100),
  category_id smallint not null references public.categories (id) on delete restrict,
  region_code text not null check (char_length(region_code) between 2 and 20),
  address text not null check (char_length(address) between 2 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stores_owner_created_idx on public.stores (owner_id, created_at desc);

create table public.pricing_packages (
  target_votes smallint primary key check (target_votes in (30, 50, 70, 100)),
  price_credits bigint not null check (price_credits > 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.tests (
  id uuid primary key default extensions.gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  slug text not null unique default lower(encode(extensions.gen_random_bytes(9), 'hex')),
  title text not null check (char_length(title) between 1 and 120),
  question text not null check (char_length(question) between 1 and 300),
  status public.test_status not null default 'draft',
  target_votes smallint not null references public.pricing_packages (target_votes),
  reward_points smallint not null default 0 check (reward_points between 0 and 30),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  vote_count integer not null default 0 check (vote_count >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at + interval '1 day'),
  check (ends_at <= starts_at + interval '30 days'),
  check (vote_count <= target_votes)
);

create index tests_store_status_created_idx on public.tests (store_id, status, created_at desc);
create index tests_lifecycle_idx on public.tests (status, starts_at, ends_at)
where status in ('scheduled', 'active');

create table public.test_options (
  id uuid primary key default extensions.gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete cascade,
  position smallint not null check (position in (1, 2)),
  asset_path text,
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_id, position),
  unique (test_id, id)
);

alter table public.profiles enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.profile_interests enable row level security;
alter table public.legal_documents enable row level security;
alter table public.user_consents enable row level security;
alter table public.stores enable row level security;
alter table public.pricing_packages enable row level security;
alter table public.tests enable row level security;
alter table public.test_options enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger profile_preferences_set_updated_at before update on public.profile_preferences
for each row execute function private.set_updated_at();
create trigger stores_set_updated_at before update on public.stores
for each row execute function private.set_updated_at();
create trigger pricing_packages_set_updated_at before update on public.pricing_packages
for each row execute function private.set_updated_at();
create trigger tests_set_updated_at before update on public.tests
for each row execute function private.set_updated_at();
create trigger test_options_set_updated_at before update on public.test_options
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, 'user'), '@', 1), 'user'), 80),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  provider text := coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', '');
begin
  if provider <> 'google' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Google 계정으로만 가입할 수 있습니다.'
      )
    );
  end if;
  return '{}'::jsonb;
end;
$$;

grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.before_user_created(jsonb) from public, anon, authenticated;

create or replace function private.current_user_id()
returns uuid
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  user_id uuid := auth.uid();
begin
  if user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;
  return user_id;
end;
$$;

create or replace function private.is_store_owner(store_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores as store
    where store.id = is_store_owner.store_id
      and store.owner_id = is_store_owner.user_id
  );
$$;

revoke execute on function private.is_store_owner(uuid, uuid) from public, anon, authenticated;

create or replace function private.is_current_store_owner(store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_store_owner(is_current_store_owner.store_id, auth.uid());
$$;

grant execute on function private.is_current_store_owner(uuid) to authenticated;

create policy profiles_own_select on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy profiles_own_update on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy preferences_own_all on public.profile_preferences
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy interests_own_all on public.profile_interests
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy consents_own_select on public.user_consents
for select to authenticated using (user_id = (select auth.uid()));
create policy consents_own_insert on public.user_consents
for insert to authenticated with check (user_id = (select auth.uid()));
create policy stores_owner_all on public.stores
for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy tests_owner_all on public.tests
for all to authenticated using (private.is_current_store_owner(store_id)) with check (private.is_current_store_owner(store_id));
create policy options_owner_all on public.test_options
for all to authenticated using (
  exists (
    select 1 from public.tests as test
    where test.id = test_options.test_id and private.is_current_store_owner(test.store_id)
  )
) with check (
  exists (
    select 1 from public.tests as test
    where test.id = test_options.test_id and private.is_current_store_owner(test.store_id)
  )
);
