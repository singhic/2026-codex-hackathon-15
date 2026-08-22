create or replace function api.list_available_tests()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_user_id();
  actor_region text;
begin
  if not private.has_required_consents(actor_id) then
    raise exception using errcode = 'P0001', message = 'CONSENT_REQUIRED';
  end if;

  perform private.advance_test_lifecycle();

  select preference.region_code into actor_region
  from public.profile_preferences as preference
  where preference.user_id = actor_id;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', candidate.id,
      'slug', candidate.slug,
      'storeName', candidate.store_name,
      'categoryName', candidate.category_name,
      'regionCode', candidate.region_code,
      'title', candidate.title,
      'question', candidate.question,
      'rewardPoints', candidate.reward_points,
      'voteCount', candidate.vote_count,
      'targetVotes', candidate.target_votes,
      'endsAt', candidate.ends_at,
      'options', candidate.options
    ) order by candidate.interest_match desc, candidate.ends_at, candidate.created_at desc)
    from (
      select
        test.id,
        test.slug,
        store.name as store_name,
        category.name as category_name,
        store.region_code,
        test.title,
        test.question,
        test.reward_points,
        test.vote_count,
        test.target_votes,
        test.ends_at,
        test.created_at,
        exists (
          select 1
          from public.profile_interests as interest
          where interest.user_id = actor_id
            and interest.category_id = store.category_id
        ) as interest_match,
        (
          select jsonb_agg(jsonb_build_object(
            'id', option.id,
            'position', option.position,
            'assetPath', option.asset_path
          ) order by option.position)
          from public.test_options as option
          where option.test_id = test.id
        ) as options
      from public.tests as test
      join public.stores as store on store.id = test.store_id
      join public.categories as category on category.id = store.category_id
      where test.status = 'active'
        and store.owner_id <> actor_id
        and (actor_region is null or store.region_code = actor_region)
        and not exists (
          select 1
          from private.votes as vote
          where vote.test_id = test.id and vote.user_id = actor_id
        )
      order by interest_match desc, test.ends_at, test.created_at desc
      limit 20
    ) as candidate
  ), '[]'::jsonb);
end;
$$;

revoke execute on function api.list_available_tests() from public, anon;
grant execute on function api.list_available_tests() to authenticated;
