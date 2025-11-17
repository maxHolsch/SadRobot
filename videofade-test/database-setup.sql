-- PostgreSQL Database Schema for Survey System
-- Run this script in your Vercel Postgres database to create the required tables

-- User sessions table to link pre and post surveys from the same user
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pre_survey_id VARCHAR(255),
  post_survey_id VARCHAR(255)
);

-- Pre-survey submissions table
CREATE TABLE IF NOT EXISTS pre_survey_submissions (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- Duration in milliseconds
  user_agent TEXT,
  responses JSONB NOT NULL, -- All responses as JSON object
  page_data JSONB, -- Page data with statements and responses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-survey individual responses table
CREATE TABLE IF NOT EXISTS pre_survey_responses (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL REFERENCES pre_survey_submissions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  statement TEXT NOT NULL,
  response_value INTEGER NOT NULL CHECK (response_value >= 1 AND response_value <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-survey submissions table
CREATE TABLE IF NOT EXISTS post_survey_submissions (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- Duration in milliseconds
  user_agent TEXT,
  responses JSONB NOT NULL, -- All responses as JSON object (includes qualitative text responses)
  page_data JSONB, -- Page data with statements and responses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-survey individual responses table (for scale responses only)
CREATE TABLE IF NOT EXISTS post_survey_responses (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL REFERENCES post_survey_submissions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  statement TEXT NOT NULL,
  response_value INTEGER NOT NULL CHECK (response_value >= 1 AND response_value <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_pre_survey_id ON user_sessions(pre_survey_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_post_survey_id ON user_sessions(post_survey_id);

CREATE INDEX IF NOT EXISTS idx_pre_survey_submissions_session_id ON pre_survey_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_pre_survey_submissions_submitted_at ON pre_survey_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_pre_survey_submissions_created_at ON pre_survey_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_pre_survey_responses_submission_id ON pre_survey_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_pre_survey_responses_page_number ON pre_survey_responses(page_number);
CREATE INDEX IF NOT EXISTS idx_pre_survey_responses_response_value ON pre_survey_responses(response_value);

CREATE INDEX IF NOT EXISTS idx_post_survey_submissions_session_id ON post_survey_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_post_survey_submissions_submitted_at ON post_survey_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_post_survey_submissions_created_at ON post_survey_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_post_survey_responses_submission_id ON post_survey_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_post_survey_responses_page_number ON post_survey_responses(page_number);
CREATE INDEX IF NOT EXISTS idx_post_survey_responses_response_value ON post_survey_responses(response_value);

-- Optional: Create views for easier data analysis
CREATE OR REPLACE VIEW pre_survey_summary AS
SELECT 
  s.id,
  s.session_id,
  s.submitted_at,
  s.duration,
  s.user_agent,
  COUNT(r.id) as total_responses,
  AVG(r.response_value) as average_response,
  MIN(r.response_value) as min_response,
  MAX(r.response_value) as max_response,
  s.created_at
FROM pre_survey_submissions s
LEFT JOIN pre_survey_responses r ON s.id = r.submission_id
GROUP BY s.id, s.session_id, s.submitted_at, s.duration, s.user_agent, s.created_at;

CREATE OR REPLACE VIEW post_survey_summary AS
SELECT 
  s.id,
  s.session_id,
  s.submitted_at,
  s.duration,
  s.user_agent,
  COUNT(r.id) as total_scale_responses,
  AVG(r.response_value) as average_response,
  MIN(r.response_value) as min_response,
  MAX(r.response_value) as max_response,
  s.created_at
FROM post_survey_submissions s
LEFT JOIN post_survey_responses r ON s.id = r.submission_id
GROUP BY s.id, s.session_id, s.submitted_at, s.duration, s.user_agent, s.created_at;

-- View to link pre and post surveys for the same user
CREATE OR REPLACE VIEW user_survey_pairs AS
SELECT 
  us.session_id,
  pre.id as pre_survey_id,
  pre.submitted_at as pre_submitted_at,
  post.id as post_survey_id,
  post.submitted_at as post_submitted_at,
  EXTRACT(EPOCH FROM (post.submitted_at - pre.submitted_at)) / 60 as minutes_between_surveys
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE pre.id IS NOT NULL;

