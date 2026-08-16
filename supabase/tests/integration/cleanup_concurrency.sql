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

end
$fixture$;
