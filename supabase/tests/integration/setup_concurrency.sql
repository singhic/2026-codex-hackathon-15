do $fixture$
begin

delete from private.reward_point_entries
where user_id in (
  '71000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000002'
);
delete from private.votes
where user_id in (
  '71000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000002'
);
delete from private.reward_point_accounts
where user_id in (
  '71000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000002'
);
delete from private.test_detail_views
where test_id = '74000000-0000-4000-8000-000000000004';
delete from private.test_billings
where test_id in (
  '74000000-0000-4000-8000-000000000004',
  '74100000-0000-4000-8000-000000000014'
);
delete from private.owner_credit_entries
where test_id = '74000000-0000-4000-8000-000000000004'
   or user_id = '70000000-0000-4000-8000-000000000000';
delete from private.owner_credit_accounts
where user_id = '70000000-0000-4000-8000-000000000000';
delete from public.tests
where id in (
  '74000000-0000-4000-8000-000000000004',
  '74100000-0000-4000-8000-000000000014'
);
delete from public.stores
where id = '73000000-0000-4000-8000-000000000003';
delete from auth.users
where id in (
  '70000000-0000-4000-8000-000000000000',
  '71000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000002'
);

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
    '70000000-0000-4000-8000-000000000000',
    'authenticated', 'authenticated', 'concurrency-owner@example.test', '', now(),
    '{"provider":"google","providers":["google"]}', '{"name":"동시성 운영자"}', now(), now()
  ),
  (
    '71000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'concurrency-one@example.test', '', now(),
    '{"provider":"google","providers":["google"]}', '{"name":"동시성 고객 1"}', now(), now()
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'concurrency-two@example.test', '', now(),
    '{"provider":"google","providers":["google"]}', '{"name":"동시성 고객 2"}', now(), now()
  );

insert into public.user_consents (user_id, document_id)
select user_id, document.id
from unnest(array[
  '70000000-0000-4000-8000-000000000000'::uuid,
  '71000000-0000-4000-8000-000000000001'::uuid,
  '72000000-0000-4000-8000-000000000002'::uuid
]) as user_id
cross join public.legal_documents as document
where document.is_required and document.retired_at is null;

insert into public.stores (id, owner_id, name, category_id, region_code, address)
values (
  '73000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000000',
  '동시성 테스트 매장',
  1,
  'KR-11',
  '서울시 테스트로 2'
);

insert into public.tests (
  id,
  store_id,
  created_by,
  slug,
  title,
  question,
  status,
  target_votes,
  reward_points,
  starts_at,
  ends_at
) values (
  '74000000-0000-4000-8000-000000000004',
  '73000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000000',
  'concurrency-test',
  '동시성 테스트',
  '어느 포스터를 선택하시겠어요?',
  'active',
  30,
  10,
  now() - interval '1 hour',
  now() + interval '2 days'
), (
  '74100000-0000-4000-8000-000000000014',
  '73000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000000',
  'concurrency-start-test',
  '동시 시작 테스트',
  '시작 결제는 한 번만 처리되나요?',
  'draft',
  30,
  0,
  now() - interval '1 hour',
  now() + interval '2 days'
);

insert into public.test_options (id, test_id, position, asset_path)
values
  (
    '75000000-0000-4000-8000-000000000005',
    '74000000-0000-4000-8000-000000000004',
    1,
    '70000000-0000-4000-8000-000000000000/73000000-0000-4000-8000-000000000003/74000000-0000-4000-8000-000000000004/75000000-0000-4000-8000-000000000005/a.webp'
  ),
  (
    '76000000-0000-4000-8000-000000000006',
    '74000000-0000-4000-8000-000000000004',
    2,
    '70000000-0000-4000-8000-000000000000/73000000-0000-4000-8000-000000000003/74000000-0000-4000-8000-000000000004/76000000-0000-4000-8000-000000000006/b.webp'
  ),
  (
    '75100000-0000-4000-8000-000000000015',
    '74100000-0000-4000-8000-000000000014',
    1,
    '70000000-0000-4000-8000-000000000000/73000000-0000-4000-8000-000000000003/74100000-0000-4000-8000-000000000014/75100000-0000-4000-8000-000000000015/a.webp'
  ),
  (
    '76100000-0000-4000-8000-000000000016',
    '74100000-0000-4000-8000-000000000014',
    2,
    '70000000-0000-4000-8000-000000000000/73000000-0000-4000-8000-000000000003/74100000-0000-4000-8000-000000000014/76100000-0000-4000-8000-000000000016/b.webp'
  );

perform private.grant_owner_credit(
  '70000000-0000-4000-8000-000000000000',
  10000,
  'concurrency-owner-credit',
  'Node integration fixture'
);

end
$fixture$;
