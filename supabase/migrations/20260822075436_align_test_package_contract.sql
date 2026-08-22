alter table public.pricing_packages
add column reward_points smallint not null default 30
check (reward_points between 0 and 30);

alter table public.tests drop constraint tests_check;
alter table public.tests
add constraint tests_positive_duration check (ends_at > starts_at);

create or replace function api.get_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.current_user_id();
  return jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', category.id,
        'slug', category.slug,
        'name', category.name
      ) order by category.sort_order, category.id)
      from public.categories as category
      where category.is_active
    ), '[]'::jsonb),
    'pricingPackages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'targetVotes', package.target_votes,
        'priceCredits', package.price_credits,
        'rewardPoints', package.reward_points
      ) order by package.target_votes)
      from public.pricing_packages as package
      where package.is_active
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function api.create_test_draft(
  p_store_id uuid,
  p_title text,
  p_question text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_target_votes smallint,
  p_reward_points smallint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  new_test public.tests%rowtype;
  first_option uuid;
  second_option uuid;
  package_reward_points smallint;
begin
  if not private.is_store_owner(p_store_id, actor_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  if p_ends_at <= now()
    or p_ends_at <= p_starts_at
    or p_ends_at > p_starts_at + interval '30 days'
  then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  select reward_points into package_reward_points
  from public.pricing_packages
  where target_votes = p_target_votes and is_active;

  if package_reward_points is null or p_reward_points <> package_reward_points then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  insert into public.tests (
    store_id, created_by, title, question, target_votes, reward_points, starts_at, ends_at
  ) values (
    p_store_id, actor_id, trim(p_title), trim(p_question), p_target_votes,
    package_reward_points, p_starts_at, p_ends_at
  ) returning * into new_test;

  insert into public.test_options (test_id, position)
  values (new_test.id, 1)
  returning id into first_option;

  insert into public.test_options (test_id, position)
  values (new_test.id, 2)
  returning id into second_option;

  return jsonb_build_object(
    'id', new_test.id,
    'storeId', new_test.store_id,
    'slug', new_test.slug,
    'status', new_test.status,
    'optionAId', first_option,
    'optionBId', second_option
  );
end;
$$;

create or replace function api.update_test_draft(
  p_test_id uuid,
  p_title text,
  p_question text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_target_votes smallint,
  p_reward_points smallint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  package_reward_points smallint;
begin
  select test.* into target_test
  from public.tests as test
  join public.stores as store on store.id = test.store_id
  where test.id = p_test_id and store.owner_id = actor_id
  for update of test;

  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if target_test.status <> 'draft' then
    raise exception using errcode = 'P0001', message = 'INVALID_TEST_STATE';
  end if;
  if p_ends_at <= now()
    or p_ends_at <= p_starts_at
    or p_ends_at > p_starts_at + interval '30 days'
  then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  select reward_points into package_reward_points
  from public.pricing_packages
  where target_votes = p_target_votes and is_active;

  if package_reward_points is null or p_reward_points <> package_reward_points then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  update public.tests
  set title = trim(p_title),
      question = trim(p_question),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      target_votes = p_target_votes,
      reward_points = package_reward_points
  where id = target_test.id
  returning * into target_test;

  return jsonb_build_object('id', target_test.id, 'status', target_test.status);
end;
$$;

create or replace function api.get_test_progress(p_test_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  detail_views bigint;
begin
  select test.* into target_test
  from public.tests as test
  join public.stores as store on store.id = test.store_id
  where test.id = p_test_id and store.owner_id = actor_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  if target_test.status in ('scheduled', 'active') then
    perform private.finalize_test(target_test.id);
    select * into target_test from public.tests where id = target_test.id;
  end if;

  select count(*) into detail_views
  from private.test_detail_views
  where test_id = target_test.id;

  return jsonb_build_object(
    'id', target_test.id,
    'storeId', target_test.store_id,
    'title', target_test.title,
    'question', target_test.question,
    'status', target_test.status,
    'voteCount', target_test.vote_count,
    'targetVotes', target_test.target_votes,
    'rewardPoints', target_test.reward_points,
    'detailViews', detail_views,
    'startsAt', target_test.starts_at,
    'endsAt', target_test.ends_at,
    'completedAt', target_test.completed_at,
    'options', (
      select jsonb_agg(jsonb_build_object(
        'id', option.id,
        'position', option.position,
        'voteCount', option.vote_count,
        'assetPath', option.asset_path
      ) order by option.position)
      from public.test_options as option
      where option.test_id = target_test.id
    )
  );
end;
$$;
