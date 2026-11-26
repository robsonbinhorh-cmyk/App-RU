/*
# Create push_subscriptions table (Phase 1 — Web Push foundation)

1. Purpose
   - Stores browser PushSubscription data (endpoint + encryption keys)
     so the server can later send Web Push notifications to devices
     even when the PWA is closed.
   - This is Phase 1 only: subscription storage. No notification
     preferences, no scheduling, no sending logic.

2. New Tables
   - `push_subscriptions`
     - `id` (uuid, primary key)
     - `endpoint` (text, unique, not null) — the push service endpoint URL
     - `p256dh_key` (text, not null) — ECDH public key for content encryption
     - `auth_key` (text, not null) — authentication secret for content encryption
     - `expiration_time` (bigint, nullable) — subscription expiration timestamp
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())

3. Security
   - RLS enabled.
   - NO policies for anon or authenticated roles — the table is
     completely locked down from direct client access.
   - All reads/writes go through the `push-subscription` Edge Function
     using the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
   - This ensures push subscription data is never exposed to the
     browser or to other users.

4. Notes
   - The `endpoint` UNIQUE constraint ensures that re-subscribing
     from the same device updates the existing row rather than
     creating duplicates.
   - No user identity columns in Phase 1 (no auth). Subscriptions
     are anonymous. User-specific preferences will be added in
     a later phase.
*/

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  expiration_time bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON push_subscriptions (endpoint);
