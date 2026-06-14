-- Media fields — run in Supabase SQL Editor
ALTER TABLE slides ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL;
