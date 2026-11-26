/*
# Create ru_menu_cache table (single-tenant, no auth)

1. Purpose
   - Caches the parsed weekly menu data fetched from the UFPE
     Restaurant Universitário page (https://www.ufpe.br/restaurante).
   - The Edge Function fetches and parses the HTML, then stores the
     structured JSON here so the app can read it quickly without
     re-scraping on every request.

2. New Tables
   - `ru_menu_cache`
     - `id` (uuid, primary key)
     - `source_url` (text, the URL the data was fetched from)
     - `menu_json` (jsonb, the full parsed weekly menu as JSON)
     - `fetched_at` (timestamptz, when the data was retrieved)
     - `week_label` (text, optional human-readable week identifier)

3. Security
   - RLS enabled.
   - Public read access (anon + authenticated) — this is shared,
     non-sensitive restaurant menu data.
   - Write access restricted to the service role (edge function only),
     enforced by using the service-role key in the edge function.
     No INSERT/UPDATE/DELETE policies for anon/authenticated.

4. Notes
   - Only one row is expected at a time (upserted by the edge function).
   - The `fetched_at` column lets the client decide whether to
     request a fresh fetch or use the cached version.
*/

CREATE TABLE IF NOT EXISTS ru_menu_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  menu_json jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  week_label text
);

ALTER TABLE ru_menu_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for the shared menu data
DROP POLICY IF EXISTS "anon_read_ru_menu_cache" ON ru_menu_cache;
CREATE POLICY "anon_read_ru_menu_cache"
  ON ru_menu_cache FOR SELECT
  TO anon, authenticated USING (true);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ru_menu_cache_fetched_at
  ON ru_menu_cache (fetched_at DESC);
