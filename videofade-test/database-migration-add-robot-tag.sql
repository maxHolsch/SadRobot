-- Database Migration: Add robot_tag column
-- This migration adds a robot_tag column to track which version of the robot (sad/happy) was used
-- Run this script in your Supabase SQL Editor after running database-setup.sql

-- Add robot_tag to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS robot_tag VARCHAR(50) DEFAULT 'sad';

-- Add robot_tag to pre_survey_submissions table
ALTER TABLE pre_survey_submissions 
ADD COLUMN IF NOT EXISTS robot_tag VARCHAR(50) DEFAULT 'sad';

-- Add robot_tag to post_survey_submissions table
ALTER TABLE post_survey_submissions 
ADD COLUMN IF NOT EXISTS robot_tag VARCHAR(50) DEFAULT 'sad';

-- Create index on robot_tag for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_robot_tag ON user_sessions(robot_tag);
CREATE INDEX IF NOT EXISTS idx_pre_survey_submissions_robot_tag ON pre_survey_submissions(robot_tag);
CREATE INDEX IF NOT EXISTS idx_post_survey_submissions_robot_tag ON post_survey_submissions(robot_tag);

-- Update existing records to have 'sad' as default (if any exist)
UPDATE user_sessions SET robot_tag = 'sad' WHERE robot_tag IS NULL;
UPDATE pre_survey_submissions SET robot_tag = 'sad' WHERE robot_tag IS NULL;
UPDATE post_survey_submissions SET robot_tag = 'sad' WHERE robot_tag IS NULL;

-- Optional: Add comment to document the column
COMMENT ON COLUMN user_sessions.robot_tag IS 'Tag to identify robot version: "sad" or "happy" (control group)';
COMMENT ON COLUMN pre_survey_submissions.robot_tag IS 'Tag to identify robot version: "sad" or "happy" (control group)';
COMMENT ON COLUMN post_survey_submissions.robot_tag IS 'Tag to identify robot version: "sad" or "happy" (control group)';

