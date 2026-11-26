/*
# Set up pg_cron for scheduled push notifications

1. Purpose
   - Enables the pg_cron extension for PostgreSQL job scheduling.
   - Creates three scheduled jobs that call the send-push Edge Function:
     a) Daily "Cardápio do dia" at 08:00 Recife time (11:00 UTC)
     b) Daily "Dica do dia" at 08:05 Recife time (11:05 UTC)
     c) "Novo cardápio" check every 30 minutes during daytime

2. Timezone
   - Recife/Brazil is UTC-3 (America/Recife).
   - 08:00 Recife = 11:00 UTC.
   - pg_cron uses UTC, so we schedule in UTC and document the conversion.

3. Jobs created
   - push_cardapio_do_dia: runs daily at 11:00 UTC (08:00 Recife)
   - push_dica_do_dia: runs daily at 11:05 UTC (08:05 Recife)
   - push_novo_cardapio: runs every 30 minutes from 10:00-22:00 UTC
     (07:00-19:00 Recife, covering the UFPE menu update window)

4. Security
   - pg_cron runs as the postgres user, which bypasses RLS.
   - The jobs use pg_http extensions or net.http_post to call the Edge Function.
   - The Edge Function URL is constructed from the SUPABASE_URL env var.
*/

-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP requests from pg_cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Job 1: Cardápio do dia — daily at 08:00 Recife (11:00 UTC)
SELECT cron.schedule(
  'push_cardapio_do_dia',
  '0 11 * * *',
  $$
    SELECT net.http_get(
      url := (SELECT value FROM app_secrets WHERE key = 'SUPABASE_URL') || '/functions/v1/send-push?type=cardapio_do_dia',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT value FROM app_secrets WHERE key = 'SUPABASE_ANON_KEY')
      )
    );
  $$
);

-- Job 2: Dica do dia — daily at 08:05 Recife (11:05 UTC)
SELECT cron.schedule(
  'push_dica_do_dia',
  '5 11 * * *',
  $$
    SELECT net.http_get(
      url := (SELECT value FROM app_secrets WHERE key = 'SUPABASE_URL') || '/functions/v1/send-push?type=dica_do_dia',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT value FROM app_secrets WHERE key = 'SUPABASE_ANON_KEY')
      )
    );
  $$
);

-- Job 3: Novo cardápio check — every 30 minutes from 07:00-19:00 Recife (10:00-22:00 UTC)
SELECT cron.schedule(
  'push_novo_cardapio',
  '0,30 10-22 * * *',
  $$
    SELECT net.http_get(
      url := (SELECT value FROM app_secrets WHERE key = 'SUPABASE_URL') || '/functions/v1/send-push?type=novo_cardapio',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT value FROM app_secrets WHERE key = 'SUPABASE_ANON_KEY')
      )
    );
  $$
);
