-- Dinámicas feature — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id text NOT NULL,
  title text NOT NULL DEFAULT 'Nueva presentación',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice','info')),
  question text NOT NULL DEFAULT '',
  options jsonb DEFAULT '["","","",""]'::jsonb,
  correct_answer integer DEFAULT NULL,
  time_limit integer DEFAULT 30
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id),
  coach_id text NOT NULL,
  code text UNIQUE NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting','active','ended')),
  current_slide_index integer DEFAULT 0,
  slide_started_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  slide_id uuid REFERENCES slides(id),
  participant_id uuid REFERENCES session_participants(id),
  answer text,
  is_correct boolean,
  response_time_ms integer,
  submitted_at timestamptz DEFAULT now()
);

-- RLS (permissive for MVP)
ALTER TABLE decks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decks_all"        ON decks              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "slides_all"       ON slides             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sessions_all"     ON sessions           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "participants_all" ON session_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "responses_all"    ON responses          FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime on the three tables that need live sync
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
