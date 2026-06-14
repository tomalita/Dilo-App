-- Storytelling extension — run in Supabase SQL Editor

-- Add new slide types
ALTER TABLE slides DROP CONSTRAINT IF EXISTS slides_type_check;
ALTER TABLE slides ADD CONSTRAINT slides_type_check
  CHECK (type IN ('multiple_choice','info','story','story_choice','open_question'));

-- Branch targets: array of slide indices per option for story_choice
ALTER TABLE slides ADD COLUMN IF NOT EXISTS branch_targets jsonb DEFAULT NULL;
