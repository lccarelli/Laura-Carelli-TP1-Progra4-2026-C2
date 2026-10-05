create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 08:00 UTC = 05:00 en Argentina. Reemplazar CRON_SECRET por el mismo valor del secret de la función.
select cron.schedule(
  'sync-peliculas-diario',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://yyfogbyyeqjbaruvzijh.supabase.co/functions/v1/sync-peliculas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
