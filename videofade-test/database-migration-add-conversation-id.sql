-- Migration script to add conversation_id to existing user_sessions table
-- Run this if you already have the database set up and need to add the conversation_id field

-- Add conversation_id column to user_sessions table
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255);

-- Create index for conversation_id lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_conversation_id ON user_sessions(conversation_id);

-- Update the user_survey_pairs view to include conversation_id
DROP VIEW IF EXISTS user_survey_pairs;

CREATE OR REPLACE VIEW user_survey_pairs AS
SELECT
  us.session_id,
  us.conversation_id,
  pre.id as pre_survey_id,
  pre.submitted_at as pre_submitted_at,
  post.id as post_survey_id,
  post.submitted_at as post_submitted_at,
  EXTRACT(EPOCH FROM (post.submitted_at - pre.submitted_at)) / 60 as minutes_between_surveys
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE pre.id IS NOT NULL;
