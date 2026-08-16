do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';
  end if;
end;
$$;

create index if not exists owner_credit_entries_test_idx
on private.owner_credit_entries (test_id)
where test_id is not null;

create index if not exists reward_point_entries_vote_idx
on private.reward_point_entries (vote_id)
where vote_id is not null;

create index if not exists test_billings_payer_idx
on private.test_billings (payer_user_id);

create index if not exists test_detail_views_user_idx
on private.test_detail_views (user_id);

create index if not exists profile_interests_category_idx
on public.profile_interests (category_id);

create index if not exists stores_category_idx
on public.stores (category_id);

create index if not exists tests_created_by_idx
on public.tests (created_by);

create index if not exists tests_target_votes_idx
on public.tests (target_votes);

create index if not exists user_consents_document_idx
on public.user_consents (document_id);
