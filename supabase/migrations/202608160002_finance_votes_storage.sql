create table private.owner_credit_accounts (
  user_id uuid primary key references public.profiles (id) on delete restrict,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table private.owner_credit_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  test_id uuid references public.tests (id) on delete restrict,
  entry_type private.owner_credit_entry_type not null,
  amount bigint not null check (amount <> 0),
  balance_after bigint not null check (balance_after >= 0),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 200),
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now()
);

create index owner_credit_entries_user_created_idx
on private.owner_credit_entries (user_id, created_at desc);

create table private.reward_point_accounts (
  user_id uuid primary key references public.profiles (id) on delete restrict,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table private.reward_point_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  vote_id uuid,
  entry_type private.reward_point_entry_type not null,
  amount bigint not null check (amount <> 0),
  balance_after bigint not null check (balance_after >= 0),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 200),
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now()
);

create index reward_point_entries_user_created_idx
on private.reward_point_entries (user_id, created_at desc);

create table private.test_billings (
  test_id uuid primary key references public.tests (id) on delete restrict,
  payer_user_id uuid not null references public.profiles (id) on delete restrict,
  package_price bigint not null check (package_price > 0),
  used_credits bigint check (used_credits is null or used_credits >= 0),
  refunded_credits bigint not null default 0 check (refunded_credits >= 0),
  status private.billing_status not null default 'reserved',
  start_idempotency_key uuid not null unique,
  cancel_idempotency_key uuid unique,
  reserved_at timestamptz not null default now(),
  settled_at timestamptz,
  check (used_credits is null or used_credits + refunded_credits = package_price)
);

create table private.votes (
  id uuid primary key default extensions.gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete restrict,
  option_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete restrict,
  reward_points_snapshot smallint not null check (reward_points_snapshot between 0 and 30),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  unique (test_id, user_id),
  foreign key (test_id, option_id)
    references public.test_options (test_id, id)
    on delete restrict
);

alter table private.reward_point_entries
add constraint reward_point_entries_vote_id_fkey
foreign key (vote_id) references private.votes (id) on delete restrict;

create index votes_test_option_idx on private.votes (test_id, option_id);
create index votes_user_created_idx on private.votes (user_id, created_at desc);

create table private.test_detail_views (
  test_id uuid not null references public.tests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_on date not null,
  created_at timestamptz not null default now(),
  primary key (test_id, user_id, viewed_on)
);

create index test_detail_views_test_date_idx
on private.test_detail_views (test_id, viewed_on);

alter table private.owner_credit_accounts enable row level security;
alter table private.owner_credit_entries enable row level security;
alter table private.reward_point_accounts enable row level security;
alter table private.reward_point_entries enable row level security;
alter table private.test_billings enable row level security;
alter table private.votes enable row level security;
alter table private.test_detail_views enable row level security;

create or replace function private.grant_owner_credit(
  p_user_id uuid,
  p_amount bigint,
  p_idempotency_key text,
  p_note text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_balance bigint;
begin
  if p_amount <= 0 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  if exists (
    select 1 from private.owner_credit_entries
    where idempotency_key = p_idempotency_key
  ) then
    select balance into current_balance
    from private.owner_credit_accounts
    where user_id = p_user_id;
    return coalesce(current_balance, 0);
  end if;

  insert into private.owner_credit_accounts (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set balance = private.owner_credit_accounts.balance + excluded.balance,
        updated_at = now()
  returning balance into current_balance;

  insert into private.owner_credit_entries (
    user_id, entry_type, amount, balance_after, idempotency_key, note
  ) values (
    p_user_id, 'admin_grant', p_amount, current_balance, p_idempotency_key, p_note
  );

  return current_balance;
end;
$$;

revoke execute on function private.grant_owner_credit(uuid, bigint, text, text)
from public, anon, authenticated;

create or replace function private.can_manage_test_asset(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.test_options as option
    join public.tests as test on test.id = option.test_id
    join public.stores as store on store.id = test.store_id
    where store.owner_id = auth.uid()
      and test.status = 'draft'
      and split_part(can_manage_test_asset.object_name, '/', 1) = store.owner_id::text
      and split_part(can_manage_test_asset.object_name, '/', 2) = store.id::text
      and split_part(can_manage_test_asset.object_name, '/', 3) = test.id::text
      and split_part(can_manage_test_asset.object_name, '/', 4) = option.id::text
      and split_part(can_manage_test_asset.object_name, '/', 5) <> ''
  );
$$;

create or replace function private.can_read_test_asset(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.test_options as option
    join public.tests as test on test.id = option.test_id
    join public.stores as store on store.id = test.store_id
    where split_part(can_read_test_asset.object_name, '/', 1) = store.owner_id::text
      and split_part(can_read_test_asset.object_name, '/', 2) = store.id::text
      and split_part(can_read_test_asset.object_name, '/', 3) = test.id::text
      and split_part(can_read_test_asset.object_name, '/', 4) = option.id::text
      and (
        store.owner_id = auth.uid()
        or test.status in ('active', 'completed')
      )
  );
$$;

revoke execute on function private.can_manage_test_asset(text) from public, anon;
revoke execute on function private.can_read_test_asset(text) from public, anon;
grant execute on function private.can_manage_test_asset(text) to authenticated;
grant execute on function private.can_read_test_asset(text) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'test-posters',
  'test-posters',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists test_posters_owner_insert on storage.objects;
create policy test_posters_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'test-posters'
  and private.can_manage_test_asset(name)
);

drop policy if exists test_posters_authorized_select on storage.objects;
create policy test_posters_authorized_select on storage.objects
for select to authenticated
using (
  bucket_id = 'test-posters'
  and private.can_read_test_asset(name)
);

drop policy if exists test_posters_owner_update on storage.objects;
create policy test_posters_owner_update on storage.objects
for update to authenticated
using (
  bucket_id = 'test-posters'
  and private.can_manage_test_asset(name)
)
with check (
  bucket_id = 'test-posters'
  and private.can_manage_test_asset(name)
);

drop policy if exists test_posters_owner_delete on storage.objects;
create policy test_posters_owner_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'test-posters'
  and private.can_manage_test_asset(name)
);
