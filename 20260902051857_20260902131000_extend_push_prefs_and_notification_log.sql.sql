/*
# Extend push_subscriptions with notification preferences and add notification log

1. Changes to existing table: push_subscriptions
   - Added `pref_novo_cardapio` (boolean, default true) — existing preference
   - Added `pref_dica_do_dia` (boolean, default false) — existing preference
   - Added `pref_cardapio_do_dia` (boolean, default false) — NEW preference, OFF by default
   - Added `notification_time` (text, default '08:00') — configurable daily notification time
   - These columns allow server-side push sending to filter by user preference.
   - The existing localStorage preferences remain the source of truth on the client;
     these server-side columns are synced when the user subscribes.

2. New Table: notification_log
   - Tracks sent notifications to prevent duplicates.
   - `id` (uuid, primary key)
   - `subscription_endpoint` (text, not null) — which subscription received it
   - `notification_type` (text, not null) — 'cardapio_do_dia' | 'novo_cardapio' | 'dica_do_dia' | 'test'
   - `notification_key` (text, not null) — deterministic dedup key (e.g., 'cardapio_do_dia:2026-09-02')
   - `sent_at` (timestamptz, default now())
   - UNIQUE constraint on (subscription_endpoint, notification_key) prevents duplicate sends.

3. Security
   - RLS remains enabled on push_subscriptions with no public policies.
   - RLS enabled on notification_log with no public policies.
   - Both tables only accessible via service role key (Edge Functions).
*/

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS pref_novo_cardapio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pref_dica_do_dia boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pref_cardapio_do_dia boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_time text NOT NULL DEFAULT '08:00';

CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_endpoint text NOT NULL,
  notification_type text NOT NULL,
  notification_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_endpoint, notification_key)
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_log_key
  ON notification_log (notification_key);

CREATE INDEX IF NOT EXISTS idx_notification_log_endpoint
  ON notification_log (subscription_endpoint);
