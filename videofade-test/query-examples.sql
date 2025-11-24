-- SQL Query Examples for Linked Conversation and Survey Data
-- Use these queries to analyze the relationship between ElevenLabs conversations and survey responses

-- =============================================================================
-- BASIC QUERIES
-- =============================================================================

-- 1. Get all sessions with their conversation IDs and survey completions
SELECT
  us.session_id,
  us.conversation_id,
  us.pre_survey_id,
  us.post_survey_id,
  us.created_at,
  CASE
    WHEN us.pre_survey_id IS NOT NULL AND us.post_survey_id IS NOT NULL THEN 'Complete'
    WHEN us.pre_survey_id IS NOT NULL THEN 'Pre-survey only'
    WHEN us.post_survey_id IS NOT NULL THEN 'Post-survey only'
    ELSE 'No surveys'
  END as survey_status
FROM user_sessions us
ORDER BY us.created_at DESC;

-- 2. Get complete user journeys (pre-survey, conversation, post-survey)
SELECT
  us.session_id,
  us.conversation_id,
  pre.submitted_at as pre_survey_time,
  post.submitted_at as post_survey_time,
  EXTRACT(EPOCH FROM (post.submitted_at - pre.submitted_at)) / 60 as minutes_between_surveys
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.conversation_id IS NOT NULL
ORDER BY pre.submitted_at DESC;

-- =============================================================================
-- DETAILED RESPONSE QUERIES
-- =============================================================================

-- 3. Get all survey responses for a specific conversation
-- Replace 'YOUR_CONVERSATION_ID' with an actual conversation ID
SELECT
  us.session_id,
  us.conversation_id,
  'pre' as survey_type,
  pre.submitted_at,
  pre.duration as duration_ms,
  pre.responses as all_responses,
  pre.page_data
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
WHERE us.conversation_id = 'YOUR_CONVERSATION_ID'

UNION ALL

SELECT
  us.session_id,
  us.conversation_id,
  'post' as survey_type,
  post.submitted_at,
  post.duration as duration_ms,
  post.responses as all_responses,
  post.page_data
FROM user_sessions us
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY submitted_at;

-- 4. Get detailed scale responses (1-5 ratings) for a specific conversation
SELECT
  us.conversation_id,
  us.session_id,
  'pre' as survey_type,
  pr.page_number,
  pr.statement,
  pr.response_value,
  pr.created_at
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
INNER JOIN pre_survey_responses pr ON pre.id = pr.submission_id
WHERE us.conversation_id = 'YOUR_CONVERSATION_ID'

UNION ALL

SELECT
  us.conversation_id,
  us.session_id,
  'post' as survey_type,
  por.page_number,
  por.statement,
  por.response_value,
  por.created_at
FROM user_sessions us
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
INNER JOIN post_survey_responses por ON post.id = por.submission_id
WHERE us.conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY survey_type, page_number;

-- =============================================================================
-- ANALYSIS QUERIES
-- =============================================================================

-- 5. Compare pre and post survey averages by conversation
SELECT
  us.conversation_id,
  us.session_id,
  AVG(pr.response_value) as pre_survey_avg,
  AVG(por.response_value) as post_survey_avg,
  AVG(por.response_value) - AVG(pr.response_value) as change_in_sentiment
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
INNER JOIN pre_survey_responses pr ON pre.id = pr.submission_id
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
INNER JOIN post_survey_responses por ON post.id = por.submission_id
WHERE us.conversation_id IS NOT NULL
GROUP BY us.conversation_id, us.session_id
ORDER BY change_in_sentiment DESC;

-- 6. Get text responses from post-survey for each conversation
-- (These are stored in the JSONB responses field)
SELECT
  us.conversation_id,
  us.session_id,
  post.submitted_at,
  post.responses
FROM user_sessions us
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.conversation_id IS NOT NULL
ORDER BY post.submitted_at DESC;

-- 7. Sessions with conversation but missing surveys (data quality check)
SELECT
  us.session_id,
  us.conversation_id,
  us.created_at,
  CASE
    WHEN us.pre_survey_id IS NULL THEN 'Missing pre-survey'
    WHEN us.post_survey_id IS NULL THEN 'Missing post-survey'
    ELSE 'Complete'
  END as missing_data
FROM user_sessions us
WHERE us.conversation_id IS NOT NULL
  AND (us.pre_survey_id IS NULL OR us.post_survey_id IS NULL)
ORDER BY us.created_at DESC;

-- =============================================================================
-- AGGREGATE ANALYSIS
-- =============================================================================

-- 8. Overall statistics by conversation ID
SELECT
  us.conversation_id,
  COUNT(DISTINCT us.session_id) as session_count,
  COUNT(DISTINCT us.pre_survey_id) as pre_surveys_completed,
  COUNT(DISTINCT us.post_survey_id) as post_surveys_completed,
  MIN(pre.submitted_at) as first_survey_time,
  MAX(post.submitted_at) as last_survey_time
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.conversation_id IS NOT NULL
GROUP BY us.conversation_id
ORDER BY session_count DESC;

-- 9. Response distribution for specific statements across all conversations
-- Useful for analyzing specific questions
SELECT
  pr.statement,
  pr.response_value,
  COUNT(*) as response_count,
  ROUND(AVG(pr.response_value), 2) as avg_rating
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
INNER JOIN pre_survey_responses pr ON pre.id = pr.submission_id
WHERE us.conversation_id IS NOT NULL
GROUP BY pr.statement, pr.response_value
ORDER BY pr.statement, pr.response_value;

-- =============================================================================
-- EXPORT-READY QUERIES
-- =============================================================================

-- 10. Full dataset export: One row per session with all data
SELECT
  us.session_id,
  us.conversation_id,
  us.created_at as session_created,
  pre.submitted_at as pre_survey_time,
  pre.duration as pre_survey_duration_ms,
  pre.responses as pre_survey_responses,
  post.submitted_at as post_survey_time,
  post.duration as post_survey_duration_ms,
  post.responses as post_survey_responses,
  EXTRACT(EPOCH FROM (post.submitted_at - pre.submitted_at)) / 60 as minutes_between_surveys
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.conversation_id IS NOT NULL
ORDER BY us.created_at DESC;

-- 11. Export for statistical analysis: Pre/Post comparison with scale responses
WITH pre_averages AS (
  SELECT
    us.session_id,
    us.conversation_id,
    AVG(pr.response_value) as pre_avg,
    STDDEV(pr.response_value) as pre_stddev,
    COUNT(pr.id) as pre_response_count
  FROM user_sessions us
  INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
  INNER JOIN pre_survey_responses pr ON pre.id = pr.submission_id
  GROUP BY us.session_id, us.conversation_id
),
post_averages AS (
  SELECT
    us.session_id,
    us.conversation_id,
    AVG(por.response_value) as post_avg,
    STDDEV(por.response_value) as post_stddev,
    COUNT(por.id) as post_response_count
  FROM user_sessions us
  INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
  INNER JOIN post_survey_responses por ON post.id = por.submission_id
  GROUP BY us.session_id, us.conversation_id
)
SELECT
  pa.session_id,
  pa.conversation_id,
  pa.pre_avg,
  pa.pre_stddev,
  pa.pre_response_count,
  poa.post_avg,
  poa.post_stddev,
  poa.post_response_count,
  poa.post_avg - pa.pre_avg as sentiment_change,
  CASE
    WHEN poa.post_avg > pa.pre_avg THEN 'Improved'
    WHEN poa.post_avg < pa.pre_avg THEN 'Declined'
    ELSE 'No Change'
  END as sentiment_direction
FROM pre_averages pa
INNER JOIN post_averages poa ON pa.session_id = poa.session_id
WHERE pa.conversation_id IS NOT NULL
ORDER BY sentiment_change DESC;

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- Using these queries with the ElevenLabs API:
-- 1. Use conversation_id from these queries to fetch conversation details from ElevenLabs
-- 2. ElevenLabs API endpoint: GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}
-- 3. You'll need your ELEVENLABS_API_KEY in the request headers as 'xi-api-key'
-- 4. The API will return full conversation transcript, metadata, and analytics
--
-- Example Node.js code to fetch conversation data:
--
-- const response = await fetch(
--   `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
--   {
--     method: 'GET',
--     headers: {
--       'xi-api-key': process.env.ELEVENLABS_API_KEY,
--     },
--   }
-- );
-- const conversationData = await response.json();
--
-- This will give you:
-- - Full transcript of user and AI messages
-- - Conversation duration and timing
-- - Turn count and interaction metrics
-- - Audio recordings (if enabled)
-- - Any custom metadata
--
