create or replace function private.has_required_consents(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.legal_documents as document
    where document.is_required
      and document.effective_at <= now()
      and document.retired_at is null
      and not exists (
        select 1
        from public.user_consents as consent
        where consent.user_id = p_user_id
          and consent.document_id = document.id
          and consent.withdrawn_at is null
      )
  );
$$;

revoke execute on function private.has_required_consents(uuid) from public, anon, authenticated;

create or replace function private.finalize_test(p_test_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_test public.tests%rowtype;
  billing private.test_billings%rowtype;
  used_amount bigint;
  refund_amount bigint;
  new_balance bigint;
begin
  select * into target_test
  from public.tests
  where id = p_test_id
  for update;

  if not found then
    return jsonb_build_object('changed', false, 'status', 'not_found');
  end if;

  if target_test.status in ('completed', 'cancelled', 'draft') then
    return jsonb_build_object('changed', false, 'status', target_test.status);
  end if;

  if target_test.status = 'scheduled' and target_test.starts_at <= now() and target_test.ends_at > now() then
    update public.tests
    set status = 'active'
    where id = target_test.id;
    target_test.status := 'active';
  end if;

  if target_test.vote_count < target_test.target_votes and target_test.ends_at > now() then
    return jsonb_build_object('changed', false, 'status', target_test.status);
  end if;

  select * into billing
  from private.test_billings
  where test_id = target_test.id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'BILLING_NOT_FOUND';
  end if;

  if billing.status <> 'reserved' then
    update public.tests
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = target_test.id;

    return jsonb_build_object(
      'changed', false,
      'status', 'completed',
      'usedCredits', coalesce(billing.used_credits, billing.package_price),
      'refundedCredits', billing.refunded_credits
    );
  end if;

  used_amount := floor(
    billing.package_price::numeric * least(target_test.vote_count, target_test.target_votes)::numeric
    / target_test.target_votes::numeric
  )::bigint;
  refund_amount := billing.package_price - used_amount;

  if refund_amount > 0 then
    select balance into new_balance
    from private.owner_credit_accounts
    where user_id = billing.payer_user_id
    for update;

    update private.owner_credit_accounts
    set balance = balance + refund_amount,
        updated_at = now()
    where user_id = billing.payer_user_id
    returning balance into new_balance;

    insert into private.owner_credit_entries (
      user_id,
      test_id,
      entry_type,
      amount,
      balance_after,
      idempotency_key,
      note
    ) values (
      billing.payer_user_id,
      target_test.id,
      'test_refund',
      refund_amount,
      new_balance,
      'test-refund:' || target_test.id::text,
      '목표 미달 테스트 크레딧 반환'
    ) on conflict (idempotency_key) do nothing;
  end if;

  update private.test_billings
  set used_credits = used_amount,
      refunded_credits = refund_amount,
      status = 'settled',
      settled_at = now()
  where test_id = target_test.id;

  update public.tests
  set status = 'completed',
      completed_at = coalesce(completed_at, now())
  where id = target_test.id;

  return jsonb_build_object(
    'changed', true,
    'status', 'completed',
    'usedCredits', used_amount,
    'refundedCredits', refund_amount
  );
end;
$$;

revoke execute on function private.finalize_test(uuid) from public, anon, authenticated;

create or replace function private.advance_test_lifecycle()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
  changed_count integer := 0;
  activated_count integer := 0;
  result jsonb;
begin
  update public.tests
  set status = 'active'
  where status = 'scheduled'
    and starts_at <= now()
    and ends_at > now();

  get diagnostics activated_count = row_count;
  changed_count := changed_count + activated_count;

  for target in
    select id
    from public.tests
    where status in ('scheduled', 'active')
      and (ends_at <= now() or vote_count >= target_votes)
    order by ends_at
  loop
    result := private.finalize_test(target.id);
    if coalesce((result ->> 'changed')::boolean, false) then
      changed_count := changed_count + 1;
    end if;
  end loop;

  return changed_count;
end;
$$;

revoke execute on function private.advance_test_lifecycle() from public, anon, authenticated;

create or replace function api.get_current_legal_documents()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', document.id,
    'key', document.document_key,
    'version', document.version,
    'title', document.title,
    'required', document.is_required
  ) order by document.is_required desc, document.document_key), '[]'::jsonb)
  from public.legal_documents as document
  where document.effective_at <= now()
    and document.retired_at is null;
$$;

create or replace function api.accept_legal_documents(p_document_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  consent_document_id uuid;
begin
  if p_document_ids is null or cardinality(p_document_ids) = 0 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  foreach consent_document_id in array p_document_ids loop
    if not exists (
      select 1 from public.legal_documents
      where id = consent_document_id and effective_at <= now() and retired_at is null
    ) then
      raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
    end if;

    insert into public.user_consents (user_id, document_id, agreed_at, withdrawn_at)
    values (actor_id, consent_document_id, now(), null)
    on conflict (user_id, document_id) do update
      set agreed_at = excluded.agreed_at,
          withdrawn_at = null;
  end loop;

  return jsonb_build_object('requiredAccepted', private.has_required_consents(actor_id));
end;
$$;

create or replace function api.get_my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
begin
  return (
    select jsonb_build_object(
      'id', profile.id,
      'displayName', profile.display_name,
      'avatarUrl', profile.avatar_url,
      'onboardingCompletedAt', profile.onboarding_completed_at,
      'regionCode', preference.region_code,
      'ageBand', preference.age_band,
      'requiredConsentsAccepted', private.has_required_consents(actor_id),
      'interestCategoryIds', coalesce((
        select jsonb_agg(interest.category_id order by interest.category_id)
        from public.profile_interests as interest
        where interest.user_id = actor_id
      ), '[]'::jsonb)
    )
    from public.profiles as profile
    left join public.profile_preferences as preference on preference.user_id = profile.id
    where profile.id = actor_id
  );
end;
$$;

create or replace function api.update_my_profile(
  p_display_name text,
  p_region_code text default null,
  p_age_band public.age_band default null,
  p_interest_category_ids smallint[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
begin
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 80 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_interest_category_ids, '{}'::smallint[])) as category_id
    where not exists (
      select 1 from public.categories
      where id = category_id and is_active
    )
  ) then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  update public.profiles
  set display_name = trim(p_display_name),
      onboarding_completed_at = case
        when private.has_required_consents(actor_id) then coalesce(onboarding_completed_at, now())
        else onboarding_completed_at
      end
  where id = actor_id;

  insert into public.profile_preferences (user_id, region_code, age_band)
  values (actor_id, nullif(trim(p_region_code), ''), p_age_band)
  on conflict (user_id) do update
    set region_code = excluded.region_code,
        age_band = excluded.age_band;

  delete from public.profile_interests where profile_interests.user_id = actor_id;
  insert into public.profile_interests (user_id, category_id)
  select actor_id, category_id
  from unnest(coalesce(p_interest_category_ids, '{}'::smallint[])) as category_id
  on conflict do nothing;

  return api.get_my_profile();
end;
$$;

create or replace function api.create_store(
  p_name text,
  p_category_id smallint,
  p_region_code text,
  p_address text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  new_store public.stores%rowtype;
begin
  if not private.has_required_consents(actor_id) then
    raise exception using errcode = 'P0001', message = 'CONSENT_REQUIRED';
  end if;

  if not exists (
    select 1 from public.categories where id = p_category_id and is_active
  ) then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  insert into public.stores (owner_id, name, category_id, region_code, address)
  values (actor_id, trim(p_name), p_category_id, trim(p_region_code), trim(p_address))
  returning * into new_store;

  return jsonb_build_object(
    'id', new_store.id,
    'name', new_store.name,
    'categoryId', new_store.category_id,
    'regionCode', new_store.region_code,
    'address', new_store.address
  );
end;
$$;

create or replace function api.get_my_stores()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', store.id,
      'name', store.name,
      'categoryId', store.category_id,
      'categoryName', category.name,
      'regionCode', store.region_code,
      'address', store.address,
      'createdAt', store.created_at
    ) order by store.created_at desc)
    from public.stores as store
    join public.categories as category on category.id = store.category_id
    where store.owner_id = actor_id
  ), '[]'::jsonb);
end;
$$;

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
        'priceCredits', package.price_credits
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
begin
  if not private.is_store_owner(p_store_id, actor_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  if not exists (
    select 1 from public.pricing_packages
    where target_votes = p_target_votes and is_active
  ) then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  insert into public.tests (
    store_id, created_by, title, question, target_votes, reward_points, starts_at, ends_at
  ) values (
    p_store_id, actor_id, trim(p_title), trim(p_question), p_target_votes, p_reward_points, p_starts_at, p_ends_at
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
  if not exists (
    select 1 from public.pricing_packages
    where target_votes = p_target_votes and is_active
  ) then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  update public.tests
  set title = trim(p_title),
      question = trim(p_question),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      target_votes = p_target_votes,
      reward_points = p_reward_points
  where id = target_test.id
  returning * into target_test;

  return jsonb_build_object('id', target_test.id, 'status', target_test.status);
end;
$$;

create or replace function api.set_test_option_asset(
  p_test_id uuid,
  p_option_id uuid,
  p_asset_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
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
  if not private.can_manage_test_asset(p_asset_path) then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'test-posters' and name = p_asset_path
  ) then
    raise exception using errcode = 'P0001', message = 'ASSET_NOT_AVAILABLE';
  end if;

  update public.test_options
  set asset_path = p_asset_path
  where id = p_option_id and test_id = p_test_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_OPTION';
  end if;

  return jsonb_build_object('testId', p_test_id, 'optionId', p_option_id, 'assetPath', p_asset_path);
end;
$$;

create or replace function api.start_test(
  p_test_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  package_price bigint;
  current_balance bigint;
  next_status public.test_status;
  existing_billing private.test_billings%rowtype;
begin
  select * into existing_billing
  from private.test_billings
  where start_idempotency_key = p_idempotency_key;

  if found then
    if existing_billing.test_id <> p_test_id or existing_billing.payer_user_id <> actor_id then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    select status into next_status from public.tests where id = p_test_id;
    select balance into current_balance from private.owner_credit_accounts where owner_credit_accounts.user_id = actor_id;
    return jsonb_build_object(
      'testId', p_test_id,
      'status', next_status,
      'chargedCredits', existing_billing.package_price,
      'ownerCreditBalance', coalesce(current_balance, 0)
    );
  end if;

  select test.* into target_test
  from public.tests as test
  join public.stores as store on store.id = test.store_id
  where test.id = p_test_id and store.owner_id = actor_id
  for update of test;

  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  -- 같은 시작 키의 동시 요청은 잠금 대기 뒤 선행 요청의 청구를 다시 읽는다.
  select * into existing_billing
  from private.test_billings
  where start_idempotency_key = p_idempotency_key;

  if found then
    if existing_billing.test_id <> p_test_id or existing_billing.payer_user_id <> actor_id then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    select status into next_status from public.tests where id = p_test_id;
    select balance into current_balance
    from private.owner_credit_accounts
    where owner_credit_accounts.user_id = actor_id;
    return jsonb_build_object(
      'testId', p_test_id,
      'status', next_status,
      'chargedCredits', existing_billing.package_price,
      'ownerCreditBalance', coalesce(current_balance, 0)
    );
  end if;

  if target_test.status <> 'draft' then
    raise exception using errcode = 'P0001', message = 'INVALID_TEST_STATE';
  end if;
  if target_test.ends_at <= now() then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;
  if (
    select count(*) from public.test_options
    where test_id = p_test_id and asset_path is not null
  ) <> 2 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  select price_credits into package_price
  from public.pricing_packages
  where target_votes = target_test.target_votes and is_active;

  if package_price is null then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  insert into private.owner_credit_accounts (user_id, balance)
  values (actor_id, 0)
  on conflict (user_id) do nothing;

  select balance into current_balance
  from private.owner_credit_accounts
  where owner_credit_accounts.user_id = actor_id
  for update;

  if current_balance < package_price then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_CREDIT';
  end if;

  current_balance := current_balance - package_price;
  update private.owner_credit_accounts
  set balance = current_balance, updated_at = now()
  where owner_credit_accounts.user_id = actor_id;

  insert into private.owner_credit_entries (
    user_id, test_id, entry_type, amount, balance_after, idempotency_key, note
  ) values (
    actor_id,
    p_test_id,
    'test_charge',
    -package_price,
    current_balance,
    'test-start:' || p_idempotency_key::text,
    '테스트 시작 크레딧 차감'
  );

  insert into private.test_billings (
    test_id, payer_user_id, package_price, start_idempotency_key
  ) values (
    p_test_id, actor_id, package_price, p_idempotency_key
  );

  next_status := case
    when target_test.starts_at > now() then 'scheduled'::public.test_status
    else 'active'::public.test_status
  end;
  update public.tests set status = next_status where id = p_test_id;

  return jsonb_build_object(
    'testId', p_test_id,
    'status', next_status,
    'chargedCredits', package_price,
    'ownerCreditBalance', current_balance
  );
end;
$$;

create or replace function api.cancel_scheduled_test(
  p_test_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  billing private.test_billings%rowtype;
  new_balance bigint;
begin
  select test.* into target_test
  from public.tests as test
  join public.stores as store on store.id = test.store_id
  where test.id = p_test_id and store.owner_id = actor_id
  for update of test;

  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  select * into billing from private.test_billings
  where test_id = p_test_id
  for update;

  if billing.cancel_idempotency_key = p_idempotency_key and target_test.status = 'cancelled' then
    select balance into new_balance from private.owner_credit_accounts where owner_credit_accounts.user_id = actor_id;
    return jsonb_build_object('testId', p_test_id, 'status', 'cancelled', 'ownerCreditBalance', new_balance);
  end if;

  if target_test.status <> 'scheduled' or target_test.starts_at <= now() or billing.status <> 'reserved' then
    raise exception using errcode = 'P0001', message = 'INVALID_TEST_STATE';
  end if;

  select balance into new_balance
  from private.owner_credit_accounts
  where owner_credit_accounts.user_id = actor_id
  for update;

  update private.owner_credit_accounts
  set balance = balance + billing.package_price, updated_at = now()
  where owner_credit_accounts.user_id = actor_id
  returning balance into new_balance;

  insert into private.owner_credit_entries (
    user_id, test_id, entry_type, amount, balance_after, idempotency_key, note
  ) values (
    actor_id,
    p_test_id,
    'test_refund',
    billing.package_price,
    new_balance,
    'test-cancel:' || p_idempotency_key::text,
    '예약 테스트 취소 크레딧 반환'
  );

  update private.test_billings
  set used_credits = 0,
      refunded_credits = package_price,
      status = 'cancelled',
      cancel_idempotency_key = p_idempotency_key,
      settled_at = now()
  where test_id = p_test_id;

  update public.tests
  set status = 'cancelled', completed_at = now()
  where id = p_test_id;

  return jsonb_build_object('testId', p_test_id, 'status', 'cancelled', 'ownerCreditBalance', new_balance);
end;
$$;

create or replace function api.submit_vote(
  p_slug text,
  p_option_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  existing_vote private.votes%rowtype;
  new_vote_id uuid;
  reward_balance bigint := 0;
begin
  select * into existing_vote
  from private.votes
  where idempotency_key = p_idempotency_key;

  if found then
    select test.* into target_test from public.tests as test where test.id = existing_vote.test_id;
    if existing_vote.user_id <> actor_id or target_test.slug <> p_slug or existing_vote.option_id <> p_option_id then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    select balance into reward_balance from private.reward_point_accounts where reward_point_accounts.user_id = actor_id;
    return jsonb_build_object(
      'voteId', existing_vote.id,
      'testId', existing_vote.test_id,
      'rewardPoints', existing_vote.reward_points_snapshot,
      'rewardPointBalance', coalesce(reward_balance, 0),
      'testCompleted', target_test.status = 'completed'
    );
  end if;

  select * into target_test
  from public.tests
  where slug = p_slug
  for update;

  if not found or target_test.status in ('draft', 'cancelled') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  -- 같은 멱등 키의 요청들이 동시에 첫 조회를 통과할 수 있다. 테스트 행
  -- 잠금을 얻은 뒤 선행 트랜잭션이 만든 투표를 다시 확인해 같은 결과를 준다.
  select * into existing_vote
  from private.votes
  where idempotency_key = p_idempotency_key;

  if found then
    if existing_vote.user_id <> actor_id
      or target_test.slug <> p_slug
      or existing_vote.option_id <> p_option_id
    then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    select balance into reward_balance
    from private.reward_point_accounts
    where reward_point_accounts.user_id = actor_id;
    return jsonb_build_object(
      'voteId', existing_vote.id,
      'testId', existing_vote.test_id,
      'rewardPoints', existing_vote.reward_points_snapshot,
      'rewardPointBalance', coalesce(reward_balance, 0),
      'testCompleted', target_test.status = 'completed'
    );
  end if;

  if target_test.status = 'scheduled' and target_test.starts_at <= now() and target_test.ends_at > now() then
    update public.tests set status = 'active' where id = target_test.id;
    target_test.status := 'active';
  end if;

  if target_test.ends_at <= now() or target_test.vote_count >= target_test.target_votes then
    perform private.finalize_test(target_test.id);
    return jsonb_build_object('ok', false, 'code', 'TEST_NOT_ACTIVE');
  end if;

  if target_test.status <> 'active' or target_test.starts_at > now() then
    raise exception using errcode = 'P0001', message = 'TEST_NOT_ACTIVE';
  end if;

  if private.is_store_owner(target_test.store_id, actor_id) then
    raise exception using errcode = 'P0001', message = 'OWN_STORE_TEST';
  end if;

  if not private.has_required_consents(actor_id) then
    raise exception using errcode = 'P0001', message = 'CONSENT_REQUIRED';
  end if;

  if not exists (
    select 1 from public.test_options
    where id = p_option_id and test_id = target_test.id
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_OPTION';
  end if;

  if exists (
    select 1 from private.votes
    where test_id = target_test.id and votes.user_id = actor_id
  ) then
    raise exception using errcode = 'P0001', message = 'ALREADY_VOTED';
  end if;

  insert into private.votes (
    test_id, option_id, user_id, reward_points_snapshot, idempotency_key
  ) values (
    target_test.id, p_option_id, actor_id, target_test.reward_points, p_idempotency_key
  ) returning id into new_vote_id;

  update public.test_options
  set vote_count = vote_count + 1
  where id = p_option_id and test_id = target_test.id;

  update public.tests
  set vote_count = vote_count + 1
  where id = target_test.id
  returning * into target_test;

  if target_test.reward_points > 0 then
    insert into private.reward_point_accounts (user_id, balance)
    values (actor_id, target_test.reward_points)
    on conflict (user_id) do update
      set balance = private.reward_point_accounts.balance + excluded.balance,
          updated_at = now()
    returning balance into reward_balance;

    insert into private.reward_point_entries (
      user_id, vote_id, entry_type, amount, balance_after, idempotency_key, note
    ) values (
      actor_id,
      new_vote_id,
      'vote_reward',
      target_test.reward_points,
      reward_balance,
      'vote-reward:' || new_vote_id::text,
      '투표 참여 보상'
    );
  else
    select balance into reward_balance from private.reward_point_accounts where reward_point_accounts.user_id = actor_id;
  end if;

  if target_test.vote_count >= target_test.target_votes then
    perform private.finalize_test(target_test.id);
    target_test.status := 'completed';
  end if;

  return jsonb_build_object(
    'ok', true,
    'voteId', new_vote_id,
    'testId', target_test.id,
    'rewardPoints', target_test.reward_points,
    'rewardPointBalance', coalesce(reward_balance, 0),
    'testCompleted', target_test.status = 'completed'
  );
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'ALREADY_VOTED';
end;
$$;

create or replace function api.record_test_detail_view(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  inserted_count integer;
  viewed_on date := (now() at time zone 'Asia/Seoul')::date;
begin
  select * into target_test from public.tests where slug = p_slug;
  if not found or target_test.status not in ('active', 'completed') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  insert into private.test_detail_views (test_id, user_id, viewed_on)
  values (target_test.id, actor_id, viewed_on)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;

  return jsonb_build_object('recorded', inserted_count = 1, 'viewedOn', viewed_on);
end;
$$;

create or replace function api.get_vote_context(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
  store_name text;
  owned boolean;
  already_voted boolean;
begin
  select test.* into target_test
  from public.tests as test
  join public.stores as store on store.id = test.store_id
  where test.slug = p_slug;

  if not found or target_test.status in ('draft', 'cancelled') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  select name into store_name
  from public.stores
  where id = target_test.store_id;

  if target_test.status in ('scheduled', 'active') then
    perform private.finalize_test(target_test.id);
    select * into target_test from public.tests where id = target_test.id;
  end if;

  owned := private.is_store_owner(target_test.store_id, actor_id);
  select exists (
    select 1 from private.votes where test_id = target_test.id and votes.user_id = actor_id
  ) into already_voted;

  return jsonb_build_object(
    'id', target_test.id,
    'slug', target_test.slug,
    'storeId', target_test.store_id,
    'storeName', store_name,
    'title', target_test.title,
    'question', target_test.question,
    'status', target_test.status,
    'startsAt', target_test.starts_at,
    'endsAt', target_test.ends_at,
    'rewardPoints', target_test.reward_points,
    'ownedByCurrentUser', owned,
    'alreadyVoted', already_voted,
    'options', (
      select jsonb_agg(jsonb_build_object(
        'id', option.id,
        'position', option.position,
        'assetPath', option.asset_path
      ) order by option.position)
      from public.test_options as option
      where option.test_id = target_test.id
    )
  );
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
    'status', target_test.status,
    'voteCount', target_test.vote_count,
    'targetVotes', target_test.target_votes,
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

create or replace function api.get_owner_dashboard(p_store_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target record;
begin
  if not private.is_store_owner(p_store_id, actor_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  for target in
    select id from public.tests
    where store_id = p_store_id and status in ('scheduled', 'active')
  loop
    perform private.finalize_test(target.id);
  end loop;

  return jsonb_build_object(
    'storeId', p_store_id,
    'tests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', test.id,
        'slug', test.slug,
        'title', test.title,
        'status', test.status,
        'voteCount', test.vote_count,
        'targetVotes', test.target_votes,
        'startsAt', test.starts_at,
        'endsAt', test.ends_at
      ) order by test.created_at desc)
      from public.tests as test
      where test.store_id = p_store_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function api.get_test_results(p_test_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  target_test public.tests%rowtype;
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

  return jsonb_build_object(
    'testId', target_test.id,
    'title', target_test.title,
    'status', target_test.status,
    'voteCount', target_test.vote_count,
    'targetVotes', target_test.target_votes,
    'options', (
      select jsonb_agg(jsonb_build_object(
        'id', option.id,
        'position', option.position,
        'voteCount', option.vote_count,
        'percentage', case
          when target_test.vote_count = 0 then 0
          else round(option.vote_count::numeric * 100 / target_test.vote_count, 1)
        end,
        'assetPath', option.asset_path
      ) order by option.position)
      from public.test_options as option
      where option.test_id = target_test.id
    )
  );
end;
$$;

create or replace function api.get_public_result(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_test public.tests%rowtype;
begin
  perform private.current_user_id();
  select * into target_test from public.tests where slug = p_slug;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if target_test.status in ('scheduled', 'active') then
    perform private.finalize_test(target_test.id);
    select * into target_test from public.tests where id = target_test.id;
  end if;
  if target_test.status <> 'completed' then
    raise exception using errcode = 'P0001', message = 'RESULT_NOT_AVAILABLE';
  end if;

  return jsonb_build_object(
    'testId', target_test.id,
    'title', target_test.title,
    'voteCount', target_test.vote_count,
    'options', (
      select jsonb_agg(jsonb_build_object(
        'id', option.id,
        'position', option.position,
        'voteCount', option.vote_count,
        'percentage', case
          when target_test.vote_count = 0 then 0
          else round(option.vote_count::numeric * 100 / target_test.vote_count, 1)
        end,
        'assetPath', option.asset_path
      ) order by option.position)
      from public.test_options as option
      where option.test_id = target_test.id
    )
  );
end;
$$;

create or replace function api.get_owner_wallet()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
begin
  return jsonb_build_object(
    'balance', coalesce((
      select balance from private.owner_credit_accounts where owner_credit_accounts.user_id = actor_id
    ), 0),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', entry.id,
        'testId', entry.test_id,
        'type', entry.entry_type,
        'amount', entry.amount,
        'balanceAfter', entry.balance_after,
        'createdAt', entry.created_at
      ) order by entry.created_at desc)
      from (
        select * from private.owner_credit_entries
        where owner_credit_entries.user_id = actor_id
        order by created_at desc
        limit 50
      ) as entry
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function api.get_reward_wallet()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
begin
  return jsonb_build_object(
    'balance', coalesce((
      select balance from private.reward_point_accounts where reward_point_accounts.user_id = actor_id
    ), 0),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', entry.id,
        'voteId', entry.vote_id,
        'type', entry.entry_type,
        'amount', entry.amount,
        'balanceAfter', entry.balance_after,
        'createdAt', entry.created_at
      ) order by entry.created_at desc)
      from (
        select * from private.reward_point_entries
        where reward_point_entries.user_id = actor_id
        order by created_at desc
        limit 50
      ) as entry
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on all functions in schema api from public, anon, authenticated;
grant execute on function api.get_current_legal_documents() to authenticated;
grant execute on function api.accept_legal_documents(uuid[]) to authenticated;
grant execute on function api.get_my_profile() to authenticated;
grant execute on function api.update_my_profile(text, text, public.age_band, smallint[]) to authenticated;
grant execute on function api.create_store(text, smallint, text, text) to authenticated;
grant execute on function api.get_my_stores() to authenticated;
grant execute on function api.get_catalog() to authenticated;
grant execute on function api.create_test_draft(uuid, text, text, timestamptz, timestamptz, smallint, smallint) to authenticated;
grant execute on function api.update_test_draft(uuid, text, text, timestamptz, timestamptz, smallint, smallint) to authenticated;
grant execute on function api.set_test_option_asset(uuid, uuid, text) to authenticated;
grant execute on function api.start_test(uuid, uuid) to authenticated;
grant execute on function api.cancel_scheduled_test(uuid, uuid) to authenticated;
grant execute on function api.submit_vote(text, uuid, uuid) to authenticated;
grant execute on function api.record_test_detail_view(text) to authenticated;
grant execute on function api.get_vote_context(text) to authenticated;
grant execute on function api.get_test_progress(uuid) to authenticated;
grant execute on function api.get_owner_dashboard(uuid) to authenticated;
grant execute on function api.get_test_results(uuid) to authenticated;
grant execute on function api.get_public_result(text) to authenticated;
grant execute on function api.get_owner_wallet() to authenticated;
grant execute on function api.get_reward_wallet() to authenticated;
