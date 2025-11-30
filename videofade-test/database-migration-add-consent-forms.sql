-- Database Migration: Add consent_forms table and update user_sessions
-- This migration adds a consent_forms table to store consent form submissions
-- and updates user_sessions to reference consent forms

-- Create consent_forms table
CREATE TABLE IF NOT EXISTS consent_forms (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  participant_date DATE NOT NULL,
  recording_permission BOOLEAN NOT NULL DEFAULT false,
  recording_understanding BOOLEAN NOT NULL DEFAULT false,
  robot_tag VARCHAR(50) DEFAULT 'sad',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add consent_form_id column to user_sessions table
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS consent_form_id VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consent_forms_session_id ON consent_forms(session_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_created_at ON consent_forms(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_forms_robot_tag ON consent_forms(robot_tag);
CREATE INDEX IF NOT EXISTS idx_user_sessions_consent_form_id ON user_sessions(consent_form_id);

-- Optional: Create a view for easier data analysis
CREATE OR REPLACE VIEW consent_forms_summary AS
SELECT 
  c.id,
  c.session_id,
  c.participant_name,
  c.participant_date,
  c.recording_permission,
  c.recording_understanding,
  c.robot_tag,
  c.timestamp,
  c.created_at,
  u.pre_survey_id,
  u.post_survey_id,
  u.conversation_id
FROM consent_forms c
LEFT JOIN user_sessions u ON c.session_id = u.session_id
ORDER BY c.created_at DESC;

-- Add comment to table
COMMENT ON TABLE consent_forms IS 'Stores consent form submissions with participant information, signatures, and recording permissions';
COMMENT ON COLUMN consent_forms.signature_data IS 'Base64 encoded PNG image of participant signature from canvas';
COMMENT ON COLUMN consent_forms.recording_permission IS 'Whether participant gave permission for audio recording';
COMMENT ON COLUMN consent_forms.recording_understanding IS 'Whether participant acknowledged understanding that recordings will be deleted after processing';
