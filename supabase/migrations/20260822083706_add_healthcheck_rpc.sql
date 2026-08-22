create or replace function api.healthcheck()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function api.healthcheck() from public, anon, authenticated;
grant usage on schema api to anon;
grant execute on function api.healthcheck() to anon, authenticated, service_role;
