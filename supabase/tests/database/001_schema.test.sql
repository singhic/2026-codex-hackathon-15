begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

select has_schema('api', 'api schema exists');
select has_schema('private', 'private schema exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'stores', 'stores table exists');
select has_table('public', 'tests', 'tests table exists');
select has_table('public', 'test_options', 'test options table exists');
select has_column(
  'public',
  'pricing_packages',
  'reward_points',
  'pricing package owns the customer reward contract'
);
select has_table('private', 'owner_credit_entries', 'owner credit ledger exists');
select has_table('private', 'reward_point_entries', 'reward point ledger exists');
select has_table('private', 'votes', 'private votes table exists');
select has_table('private', 'test_detail_views', 'detail view receipts exist');
select has_function('api', 'start_test', array['uuid', 'uuid'], 'start RPC exists');
select has_function(
  'api',
  'list_available_tests',
  array[]::text[],
  'customer discovery RPC exists'
);
select has_function(
  'api',
  'healthcheck',
  array[]::text[],
  'readiness healthcheck RPC exists'
);
select has_function(
  'api',
  'submit_vote',
  array['text', 'uuid', 'uuid'],
  'vote RPC exists'
);
select has_trigger(
  'auth',
  'users',
  'on_auth_user_created',
  'auth user profile trigger exists'
);
select ok(
  (
    select bool_and(class.relrowsecurity)
    from pg_class as class
    join pg_namespace as namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname in (
        'profiles', 'profile_preferences', 'categories', 'profile_interests',
        'legal_documents', 'user_consents', 'stores', 'pricing_packages',
        'tests', 'test_options'
      )
  ),
  'all public domain tables have RLS enabled'
);
select ok(
  (
    select bool_and(class.relrowsecurity)
    from pg_class as class
    join pg_namespace as namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'private'
      and class.relkind = 'r'
  ),
  'all private tables have RLS enabled'
);
select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'test-posters' and not public
  ),
  'test poster bucket is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'test-posters'),
  5242880::bigint,
  'test poster file limit is 5 MiB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'test-posters'),
  array['image/jpeg', 'image/png', 'image/webp']::text[],
  'test poster MIME allowlist is exact'
);
select is(
  private.before_user_created(
    '{"user":{"app_metadata":{"provider":"google"}}}'::jsonb
  ),
  '{}'::jsonb,
  'Google signup passes the defensive auth hook'
);
select is(
  private.before_user_created(
    '{"user":{"app_metadata":{"provider":"email"}}}'::jsonb
  ) -> 'error' ->> 'http_code',
  '403',
  'non-Google signup is rejected by the auth hook'
);
select ok(
  not has_function_privilege('anon', 'api.start_test(uuid,uuid)', 'execute'),
  'anonymous users cannot execute owner RPCs'
);
select ok(
  has_function_privilege('anon', 'api.healthcheck()', 'execute'),
  'anonymous readiness checks can execute only the healthcheck RPC'
);
select ok(
  has_function_privilege('authenticated', 'api.start_test(uuid,uuid)', 'execute'),
  'authenticated users can execute the granted owner RPC'
);
select ok(
  not has_schema_privilege('authenticated', 'private', 'usage'),
  'authenticated users cannot access the private schema directly'
);
select ok(
  to_regprocedure('public.rls_auto_enable()') is null
    or not has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute'),
  'signed-in users cannot execute the platform RLS event trigger function'
);

select * from finish();
rollback;
