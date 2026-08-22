create or replace function api.get_test_results(p_test_id uuid)
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
  from private.test_detail_views as detail_view
  where detail_view.test_id = target_test.id;

  return jsonb_build_object(
    'testId', target_test.id,
    'title', target_test.title,
    'status', target_test.status,
    'voteCount', target_test.vote_count,
    'targetVotes', target_test.target_votes,
    'detailViews', detail_views,
    'options', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', option.id,
        'position', option.position,
        'voteCount', option.vote_count,
        'percentage', case
          when target_test.vote_count = 0 then 0
          else round(option.vote_count::numeric * 100 / target_test.vote_count, 1)
        end,
        'assetPath', option.asset_path
      ) order by option.position), '[]'::jsonb)
      from public.test_options as option
      where option.test_id = target_test.id
    )
  );
end;
$$;
