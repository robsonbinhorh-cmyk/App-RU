/*
# Create app_secrets table for server-side secret storage

1. Purpose
   - Stores server-side secrets (like VAPID_PRIVATE_KEY) that Edge Functions
     need but cannot be set via the Supabase CLI in this environment.
   - RLS enabled with NO policies for anon/authenticated — only the
     service role key (used by Edge Functions) can read/write.

2. New Tables
   - `app_secrets`
     - `key` (text, primary key) — the secret name
     - `value` (text, not null) — the secret value
     - `updated_at` (timestamptz, default now())

3. Security
   - RLS enabled, deny-by-default (no anon/authenticated policies).
   - Only accessible via service role key (bypasses RLS).
   - NEVER exposed to client-side code.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;
