create extension if not exists pg_cron;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'advance-test-lifecycle'
  ) then
    perform cron.schedule(
      'advance-test-lifecycle',
      '* * * * *',
      'select private.advance_test_lifecycle();'
    );
  end if;
end;
$$;

