-- ============================================================
-- BrokenBanglore — Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Reports ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_no          TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'general',
  severity        TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','emergency')),

  -- Location
  lat             DECIMAL(9,6),
  lng             DECIMAL(9,6),
  area_name       TEXT,
  ward_no         INTEGER,
  ward_name       TEXT,

  -- Representatives (auto-assigned from our wardData map)
  constituency    TEXT,
  mla_name        TEXT,
  mla_party       TEXT,
  mp_name         TEXT,
  mp_constituency TEXT,
  authority       TEXT DEFAULT 'BBMP',
  authority_email TEXT,

  -- Status
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','in_progress','resolved','ignored')),
  upvotes         INTEGER NOT NULL DEFAULT 1,

  -- Media
  photo_url       TEXT,

  -- Reporter
  reporter_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email  TEXT,

  -- Escalation tracking
  email_sent_at      TIMESTAMPTZ,
  escalation_sent_at TIMESTAMPTZ,
  resolved_at        TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ward-based queries (most common filter on the map)
CREATE INDEX IF NOT EXISTS idx_reports_ward_no  ON reports(ward_no);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created  ON reports(created_at DESC);

-- ─── Petitions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS petitions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  ward_no            INTEGER,
  area_name          TEXT,
  goal_signatures    INTEGER NOT NULL DEFAULT 500,
  current_signatures INTEGER NOT NULL DEFAULT 1,
  creator_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','won')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Forum Posts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  body         TEXT,
  category     TEXT NOT NULL DEFAULT 'discussions',
  author_name  TEXT DEFAULT 'Anonymous Citizen',
  ward         TEXT,
  upvotes      INTEGER NOT NULL DEFAULT 0,
  creator_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RPC: increment upvotes atomically ────────────────────
CREATE OR REPLACE FUNCTION increment_upvotes(report_id UUID)
RETURNS void AS $$
  UPDATE reports SET upvotes = upvotes + 1 WHERE id = report_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_post_upvotes(post_id UUID)
RETURNS void AS $$
  UPDATE forum_posts SET upvotes = upvotes + 1 WHERE id = post_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─── Row Level Security ───────────────────────────────────
ALTER TABLE reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts  ENABLE ROW LEVEL SECURITY;

-- Anyone can read reports (public data)
CREATE POLICY "Public read reports"      ON reports      FOR SELECT USING (true);
CREATE POLICY "Public read petitions"    ON petitions    FOR SELECT USING (true);
CREATE POLICY "Public read forum posts"  ON forum_posts  FOR SELECT USING (true);

-- Anyone can insert (anonymous reporting allowed)
CREATE POLICY "Anyone can report"        ON reports      FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can petition"      ON petitions    FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can post"          ON forum_posts  FOR INSERT WITH CHECK (true);

-- Only the creator can update or delete their own records
CREATE POLICY "Owners can update reports"     ON reports     FOR UPDATE USING (auth.uid() = reporter_id);
CREATE POLICY "Owners can update petitions"   ON petitions   FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Owners can update posts"       ON forum_posts FOR UPDATE USING (auth.uid() = creator_id);

-- ─── Auto-trigger: send email on report insert ────────────
-- (Edge Function handles the actual email sending via HTTP)
-- The frontend calls supabase.functions.invoke('send-complaint-email') after insert.

-- ─── Realtime ─────────────────────────────────────────────
-- Enable real-time on reports so the map updates live
ALTER TABLE reports   REPLICA IDENTITY FULL;
ALTER TABLE petitions REPLICA IDENTITY FULL;
