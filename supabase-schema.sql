-- ══════════════════════════════════════════════════
-- NEU Library Visitor Log — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS library_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,           -- institutional email
  rfid        TEXT UNIQUE,           -- RFID / student ID
  college     TEXT,
  blocked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_or_rfid CHECK (email IS NOT NULL OR rfid IS NOT NULL)
);

-- ── VISITS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS library_visits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES library_users(id) ON DELETE CASCADE,
  purpose     TEXT NOT NULL CHECK (purpose IN (
                'Reading', 'Researching', 'Studying',
                'Use of Computer', 'Group Study', 'Other'
              )),
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_visits_user    ON library_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_logged  ON library_visits(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email    ON library_users(email);
CREATE INDEX IF NOT EXISTS idx_users_rfid     ON library_users(rfid);

-- ── ROW LEVEL SECURITY ───────────────────────────
-- Allow public (anon) to insert users and visits (visitor kiosk)
ALTER TABLE library_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_visits ENABLE ROW LEVEL SECURITY;

-- Anon can read users (to check if they exist / blocked)
CREATE POLICY "anon_read_users" ON library_users
  FOR SELECT TO anon USING (true);

-- Anon can insert new users
CREATE POLICY "anon_insert_users" ON library_users
  FOR INSERT TO anon WITH CHECK (true);

-- Anon can read visits
CREATE POLICY "anon_read_visits" ON library_visits
  FOR SELECT TO anon USING (true);

-- Anon can insert visits
CREATE POLICY "anon_insert_visits" ON library_visits
  FOR INSERT TO anon WITH CHECK (true);

-- Admin (authenticated) can do everything
CREATE POLICY "admin_all_users" ON library_users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_visits" ON library_visits
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── USEFUL VIEWS ─────────────────────────────────

-- Full visit log with user details
CREATE OR REPLACE VIEW visit_log AS
SELECT
  v.id,
  v.logged_at,
  v.purpose,
  u.id        AS user_id,
  u.name,
  u.email,
  u.rfid,
  u.college,
  u.blocked
FROM library_visits v
JOIN library_users  u ON u.id = v.user_id
ORDER BY v.logged_at DESC;

-- Daily visit count
CREATE OR REPLACE VIEW daily_counts AS
SELECT
  DATE(logged_at) AS visit_date,
  COUNT(*)        AS total_visits
FROM library_visits
GROUP BY DATE(logged_at)
ORDER BY visit_date DESC;

-- College breakdown
CREATE OR REPLACE VIEW college_counts AS
SELECT
  u.college,
  COUNT(*) AS visit_count
FROM library_visits v
JOIN library_users u ON u.id = v.user_id
GROUP BY u.college
ORDER BY visit_count DESC;

-- ══════════════════════════════════════════════════
-- OPTIONAL: Seed demo data
-- ══════════════════════════════════════════════════
/*
INSERT INTO library_users (name, email, college) VALUES
  ('Maria Santos',  'maria.santos@neu.edu.ph',  'CITE'),
  ('Juan Reyes',    'juan.reyes@neu.edu.ph',    'CBA'),
  ('Ana Cruz',      'ana.cruz@neu.edu.ph',      'CAS'),
  ('Carlo Garcia',  'carlo.garcia@neu.edu.ph',  'CEA');

INSERT INTO library_visits (user_id, purpose)
SELECT id, 'Studying' FROM library_users WHERE email = 'maria.santos@neu.edu.ph';

INSERT INTO library_visits (user_id, purpose)
SELECT id, 'Reading' FROM library_users WHERE email = 'juan.reyes@neu.edu.ph';
*/
