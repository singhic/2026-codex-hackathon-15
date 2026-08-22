begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'owner@example.test',
    '',
    now(),
    '{"provider":"google","providers":["google"]}',
    '{"name":"테스트 운영자"}',
    now(),
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'customer@example.test',
    '',
    now(),
    '{"provider":"google","providers":["google"]}',
    '{"name":"테스트 고객"}',
    now(),
    now()
  );

select is(
  (select count(*) from public.profiles where id in (
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
  )),
  2::bigint,
  'auth trigger creates both profiles'
);

insert into public.user_consents (user_id, document_id)
select user_id, document.id
from unnest(array[
  '10000000-0000-4000-8000-000000000001'::uuid,
  '20000000-0000-4000-8000-000000000002'::uuid
]) as user_id
cross join public.legal_documents as document
where document.is_required and document.retired_at is null;

select is(
  private.grant_owner_credit(
    '10000000-0000-4000-8000-000000000001',
    10000,
    'test-initial-credit',
    'pgTAP fixture'
  ),
  10000::bigint,
  'owner credit grant creates the initial balance'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$select api.create_store('테스트 카페', 1::smallint, 'KR-11', '서울시 테스트로 1')$$,
  'owner creates a store through the API schema'
);

reset role;
select set_config(
  'test.store_id',
  (select id::text from public.stores where owner_id = '10000000-0000-4000-8000-000000000001'),
  true
);

set local role authenticated;
select throws_ok(
  format(
    $$select api.create_test_draft(%L::uuid, '잘못된 리워드', '서버 계약과 다른 리워드', now(), now() + interval '1 day', 30::smallint, 10::smallint)$$,
    current_setting('test.store_id')
  ),
  'P0001',
  'VALIDATION_FAILED',
  'draft reward must match the server package catalog'
);
select lives_ok(
  format(
    $$select api.create_test_draft(%L::uuid, 'A/B 포스터 테스트', '어느 포스터가 더 좋은가요?', now() - interval '1 hour', now() + interval '2 days', 30::smallint, 30::smallint)$$,
    current_setting('test.store_id')
  ),
  'owner creates a two-option draft'
);

reset role;
select set_config(
  'test.test_id',
  (select id::text from public.tests where store_id = current_setting('test.store_id')::uuid),
  true
);
select set_config(
  'test.slug',
  (select slug from public.tests where id = current_setting('test.test_id')::uuid),
  true
);
select set_config(
  'test.option_a_id',
  (select id::text from public.test_options where test_id = current_setting('test.test_id')::uuid and position = 1),
  true
);
select set_config(
  'test.option_b_id',
  (select id::text from public.test_options where test_id = current_setting('test.test_id')::uuid and position = 2),
  true
);
select set_config(
  'test.asset_a',
  concat(
    '10000000-0000-4000-8000-000000000001/',
    current_setting('test.store_id'), '/',
    current_setting('test.test_id'), '/',
    current_setting('test.option_a_id'), '/a.webp'
  ),
  true
);
select set_config(
  'test.asset_b',
  concat(
    '10000000-0000-4000-8000-000000000001/',
    current_setting('test.store_id'), '/',
    current_setting('test.test_id'), '/',
    current_setting('test.option_b_id'), '/b.webp'
  ),
  true
);

set local role authenticated;
insert into storage.objects (bucket_id, name, owner_id)
values
  ('test-posters', current_setting('test.asset_a'), auth.uid()::text),
  ('test-posters', current_setting('test.asset_b'), auth.uid()::text);
select api.set_test_option_asset(
  current_setting('test.test_id')::uuid,
  current_setting('test.option_a_id')::uuid,
  current_setting('test.asset_a')
);
select api.set_test_option_asset(
  current_setting('test.test_id')::uuid,
  current_setting('test.option_b_id')::uuid,
  current_setting('test.asset_b')
);
reset role;

select is(
  (select count(*) from storage.objects where bucket_id = 'test-posters'),
  2::bigint,
  'draft owner can insert objects through the private bucket RLS policy'
);
select is(
  (select count(*) from public.test_options where test_id = current_setting('test.test_id')::uuid and asset_path is not null),
  2::bigint,
  'asset confirmation records both validated storage paths'
);

set local role authenticated;
select api.start_test(
  current_setting('test.test_id')::uuid,
  '30000000-0000-4000-8000-000000000003'
);
reset role;

select is(
  (select status::text from public.tests where id = current_setting('test.test_id')::uuid),
  'active',
  'start RPC activates a test whose start time has passed'
);
select is(
  (select balance from private.owner_credit_accounts where user_id = '10000000-0000-4000-8000-000000000001'),
  5000::bigint,
  'start RPC charges the fixed 30-vote package price'
);
select is(
  (select count(*) from private.owner_credit_entries where entry_type = 'test_charge'),
  1::bigint,
  'start charge is recorded once'
);

set local role authenticated;
select api.start_test(
  current_setting('test.test_id')::uuid,
  '30000000-0000-4000-8000-000000000003'
);
select throws_ok(
  format(
    $$select api.submit_vote(%L, %L::uuid, '40000000-0000-4000-8000-000000000004')$$,
    current_setting('test.slug'),
    current_setting('test.option_a_id')
  ),
  'P0001',
  'OWN_STORE_TEST',
  'an owner cannot vote on their own store test'
);
reset role;

select is(
  (select count(*) from private.owner_credit_entries where entry_type = 'test_charge'),
  1::bigint,
  'repeating start with the same key does not charge twice'
);
select is(
  jsonb_array_length(api.list_available_tests()),
  0,
  'an owner cannot discover a test from their own store'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;
select is(
  jsonb_array_length(api.list_available_tests()),
  1,
  'a customer discovers an active test before voting'
);
select set_config(
  'test.vote_response',
  api.submit_vote(
    current_setting('test.slug'),
    current_setting('test.option_a_id')::uuid,
    '50000000-0000-4000-8000-000000000005'
  )::text,
  true
);
reset role;

select is(
  (select count(*) from private.votes where test_id = current_setting('test.test_id')::uuid),
  1::bigint,
  'a customer vote is recorded once'
);
select is(
  (select vote_count from public.tests where id = current_setting('test.test_id')::uuid),
  1,
  'test aggregate vote count increments atomically'
);
select is(
  (select vote_count from public.test_options where id = current_setting('test.option_a_id')::uuid),
  1,
  'option aggregate vote count increments atomically'
);
select is(
  (select balance from private.reward_point_accounts where user_id = '20000000-0000-4000-8000-000000000002'),
  30::bigint,
  'customer reward points are credited separately'
);
select is(
  (select count(*) from private.reward_point_entries where user_id = '20000000-0000-4000-8000-000000000002'),
  1::bigint,
  'reward ledger receives one entry'
);

set local role authenticated;
select api.submit_vote(
  current_setting('test.slug'),
  current_setting('test.option_a_id')::uuid,
  '50000000-0000-4000-8000-000000000005'
);
select throws_ok(
  format(
    $$select api.submit_vote(%L, %L::uuid, '60000000-0000-4000-8000-000000000006')$$,
    current_setting('test.slug'),
    current_setting('test.option_a_id')
  ),
  'P0001',
  'ALREADY_VOTED',
  'a second idempotency key cannot create another vote'
);
select api.record_test_detail_view(current_setting('test.slug'));
select api.record_test_detail_view(current_setting('test.slug'));
reset role;

select is(
  (select count(*) from private.votes where test_id = current_setting('test.test_id')::uuid),
  1::bigint,
  'replaying a vote idempotency key does not duplicate the vote'
);
select is(
  jsonb_array_length(api.list_available_tests()),
  0,
  'a completed participation is removed from customer discovery'
);
select is(
  (select balance from private.reward_point_accounts where user_id = '20000000-0000-4000-8000-000000000002'),
  30::bigint,
  'replaying a vote does not duplicate the reward'
);
select is(
  (select count(*) from private.test_detail_views where test_id = current_setting('test.test_id')::uuid),
  1::bigint,
  'detail views are unique per user and Korea date'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;
select is(
  (api.get_test_results(current_setting('test.test_id')::uuid) ->> 'detailViews')::bigint,
  1::bigint,
  'owner results expose the deduplicated detail view count'
);
reset role;

update public.tests
set starts_at = now() - interval '2 days',
    ends_at = now() - interval '1 second'
where id = current_setting('test.test_id')::uuid;

select is(
  (private.finalize_test(current_setting('test.test_id')::uuid) ->> 'refundedCredits')::bigint,
  4834::bigint,
  'an expired 1-of-30 test refunds the unused fixed-price credit'
);
select is(
  (select balance from private.owner_credit_accounts where user_id = '10000000-0000-4000-8000-000000000001'),
  9834::bigint,
  'refund returns virtual credit to the shared owner account'
);
select is(
  (select status::text from private.test_billings where test_id = current_setting('test.test_id')::uuid),
  'settled',
  'billing is settled after completion'
);
select is(
  (private.finalize_test(current_setting('test.test_id')::uuid) ->> 'changed')::boolean,
  false,
  'finalization is idempotent'
);

select * from finish();
rollback;
