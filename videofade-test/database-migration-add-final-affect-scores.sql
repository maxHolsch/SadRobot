-- Migration: Add final_affect_scores table for storing final affect scores

CREATE TABLE IF NOT EXISTS final_affect_scores (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  final_affect NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_affect_scores_session_id ON final_affect_scores(session_id);
