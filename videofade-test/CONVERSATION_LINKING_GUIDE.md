# ElevenLabs Conversation and Survey Linking Implementation Guide

This guide explains how ElevenLabs conversation recordings are now linked with survey responses in Supabase.

## Overview

The system now captures and stores the ElevenLabs `conversation_id` for each user session, allowing you to:
- Link survey responses to specific conversation recordings
- Retrieve full conversation transcripts from ElevenLabs API
- Analyze the relationship between conversations and survey sentiment changes
- Export complete datasets for research and analysis

## Architecture

### Data Flow

```
User Session Start
    ↓
Pre-Survey Completion → Stored in Supabase with session_id
    ↓
ElevenLabs Conversation
    ↓
Conversation ID Captured → Stored in user_sessions table
    ↓
Post-Survey Completion → Stored in Supabase with session_id
    ↓
All data linked via session_id + conversation_id
```

### Database Schema Changes

#### New Field Added to `user_sessions` Table

```sql
ALTER TABLE user_sessions
ADD COLUMN conversation_id VARCHAR(255);

CREATE INDEX idx_user_sessions_conversation_id ON user_sessions(conversation_id);
```

#### Updated View: `user_survey_pairs`

Now includes `conversation_id`:

```sql
CREATE OR REPLACE VIEW user_survey_pairs AS
SELECT
  us.session_id,
  us.conversation_id,        -- NEW: ElevenLabs conversation ID
  pre.id as pre_survey_id,
  pre.submitted_at as pre_submitted_at,
  post.id as post_survey_id,
  post.submitted_at as post_submitted_at,
  EXTRACT(EPOCH FROM (post.submitted_at - pre.submitted_at)) / 60 as minutes_between_surveys
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE pre.id IS NOT NULL;
```

## Implementation Details

### 1. Backend API Endpoint

**New Endpoint:** `POST /api/update-conversation-id`

Located in: [server.js](server.js:185-216)

**Request Body:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "conversationId": "conv_xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "session_id": "session_1234567890_abc123",
      "conversation_id": "conv_xyz789",
      "created_at": "2024-01-15T10:30:00.000Z",
      "pre_survey_id": "...",
      "post_survey_id": "..."
    }
  ]
}
```

### 2. Frontend Conversation ID Capture

**Location:** [index.html](index.html:262-306)

**Implementation:**

The conversation ID is captured in the `onConnect` callback when the ElevenLabs conversation starts:

```javascript
conversation = await Conversation.startSession({
  signedUrl: signedUrl,
  onConnect: async () => {
    // Capture conversation ID
    const conversationId = conversation.conversationId || conversation.id || null;

    if (conversationId) {
      // Get or create session ID
      let sessionId = localStorage.getItem('userSessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userSessionId', sessionId);
      }

      // Store in Supabase
      await fetch('/api/update-conversation-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, conversationId }),
      });
    }
  },
  // ... other callbacks
});
```

### 3. Session ID Management

**Location:** [js/survey.js](js/survey.js:392-396)

The same `sessionId` is used across:
1. Pre-survey submission
2. Conversation ID storage
3. Post-survey submission

This ensures all three components are linked together.

## Setup Instructions

### For Existing Databases

If you already have the database set up, run the migration script:

```bash
psql your_database_url < database-migration-add-conversation-id.sql
```

### For New Databases

Use the updated schema file:

```bash
psql your_database_url < database-setup.sql
```

## Querying Linked Data

### Basic Queries

**1. Get all sessions with conversation IDs:**

```sql
SELECT
  session_id,
  conversation_id,
  pre_survey_id,
  post_survey_id,
  created_at
FROM user_sessions
WHERE conversation_id IS NOT NULL;
```

**2. Get complete user journeys:**

```sql
SELECT
  us.session_id,
  us.conversation_id,
  pre.submitted_at as pre_survey_time,
  post.submitted_at as post_survey_time
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.conversation_id IS NOT NULL;
```

**3. Compare pre/post survey sentiment by conversation:**

```sql
SELECT
  us.conversation_id,
  AVG(pr.response_value) as pre_avg,
  AVG(por.response_value) as post_avg,
  AVG(por.response_value) - AVG(pr.response_value) as sentiment_change
FROM user_sessions us
INNER JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
INNER JOIN pre_survey_responses pr ON pre.id = pr.submission_id
INNER JOIN post_survey_submissions post ON us.post_survey_id = post.id
INNER JOIN post_survey_responses por ON post.id = por.submission_id
WHERE us.conversation_id IS NOT NULL
GROUP BY us.conversation_id;
```

See [query-examples.sql](query-examples.sql) for 11 comprehensive query examples.

## Retrieving Conversation Data from ElevenLabs

Once you have the `conversation_id`, you can fetch the full conversation transcript and metadata from the ElevenLabs API.

### API Endpoint

```
GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}
```

### Example: Node.js

```javascript
const conversationId = 'conv_xyz789'; // From your database query

const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
  {
    method: 'GET',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
  }
);

const conversationData = await response.json();
console.log(conversationData);
```

### Example: Python

```python
import requests
import os

conversation_id = 'conv_xyz789'  # From your database query

response = requests.get(
    f'https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}',
    headers={
        'xi-api-key': os.environ['ELEVENLABS_API_KEY']
    }
)

conversation_data = response.json()
print(conversation_data)
```

### Conversation Data Structure

The API returns:

```json
{
  "conversation_id": "conv_xyz789",
  "agent_id": "agent_123",
  "status": "done",
  "metadata": {
    "start_time": "2024-01-15T10:35:00Z",
    "end_time": "2024-01-15T10:40:00Z",
    "duration_seconds": 300
  },
  "transcript": [
    {
      "role": "user",
      "message": "Hello, how are you?",
      "timestamp": "2024-01-15T10:35:05Z"
    },
    {
      "role": "agent",
      "message": "I'm doing well, thank you for asking!",
      "timestamp": "2024-01-15T10:35:08Z"
    }
    // ... more messages
  ],
  "analytics": {
    "turn_count": 12,
    "user_messages": 6,
    "agent_messages": 6,
    "average_response_time": 1.2
  }
}
```

## Testing the Implementation

### Manual Testing Steps

1. **Start a new session:**
   - Open the application in a browser
   - Open browser DevTools Console

2. **Complete pre-survey:**
   - Fill out the pre-survey
   - Submit it
   - Note the `sessionId` in localStorage

3. **Start conversation:**
   - Click "Talk to Sad Robot"
   - Watch the console for:
     ```
     Voice agent connected
     Conversation ID: conv_xyz123
     Conversation ID stored successfully
     ```

4. **Verify in database:**
   ```sql
   SELECT * FROM user_sessions
   WHERE session_id = 'your_session_id';
   ```
   - Should show the `conversation_id` populated

5. **Complete post-survey:**
   - End the conversation
   - Complete the post-survey

6. **Query linked data:**
   ```sql
   SELECT * FROM user_survey_pairs
   WHERE conversation_id IS NOT NULL;
   ```

### Automated Testing

Create a test script to verify the integration:

```javascript
// test-conversation-linking.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConversationLinking() {
  // 1. Query sessions with conversation IDs
  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('*')
    .not('conversation_id', 'is', null)
    .limit(5);

  console.log('Sessions with conversations:', sessions);

  // 2. Check if surveys are linked
  for (const session of sessions) {
    const hasPreSurvey = session.pre_survey_id !== null;
    const hasPostSurvey = session.post_survey_id !== null;
    const hasConversation = session.conversation_id !== null;

    console.log(`\nSession: ${session.session_id}`);
    console.log(`  Pre-survey: ${hasPreSurvey ? '✓' : '✗'}`);
    console.log(`  Conversation: ${hasConversation ? '✓' : '✗'}`);
    console.log(`  Post-survey: ${hasPostSurvey ? '✓' : '✗'}`);
    console.log(`  Complete: ${hasPreSurvey && hasConversation && hasPostSurvey ? '✓' : '✗'}`);
  }
}

testConversationLinking();
```

### Troubleshooting

**Issue: Conversation ID not captured**

Check browser console for:
- `No conversation ID found in Conversation object`
- This means the ElevenLabs Conversation object doesn't expose the ID

Try these alternatives:
1. Check `conversation.conversationId`
2. Check `conversation.id`
3. Check `conversation._id`
4. Inspect the full conversation object: `console.log(Object.keys(conversation))`

**Issue: API endpoint returns 500 error**

Check server logs for:
- Supabase connection errors
- Missing environment variables
- Database permission issues

**Issue: Session ID mismatch**

Ensure:
- The same sessionId is used across pre-survey, conversation, and post-survey
- localStorage is not cleared between steps
- User doesn't open multiple tabs

## Data Export for Analysis

### Export Complete Dataset

```sql
-- Export to CSV (PostgreSQL)
COPY (
  SELECT
    us.session_id,
    us.conversation_id,
    pre.responses as pre_survey,
    post.responses as post_survey
  FROM user_sessions us
  LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
  LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
  WHERE us.conversation_id IS NOT NULL
) TO '/path/to/export.csv' WITH CSV HEADER;
```

### Export for Statistical Analysis

Use query #11 from [query-examples.sql](query-examples.sql) which provides:
- Pre-survey averages and standard deviations
- Post-survey averages and standard deviations
- Sentiment change calculations
- Sentiment direction labels

## API Integration Examples

### Create Backend Endpoint to Fetch Full Conversation Data

Add this to [server.js](server.js):

```javascript
// API route to get conversation details from ElevenLabs
app.get('/api/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Fetch conversation from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch conversation'
      });
    }

    const conversationData = await response.json();

    // Optionally fetch linked survey data
    const { data: session } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        *,
        pre_survey_submissions(*),
        post_survey_submissions(*)
      `)
      .eq('conversation_id', conversationId)
      .single();

    res.json({
      conversation: conversationData,
      surveys: session
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Security Considerations

1. **API Keys**: Never expose ElevenLabs API keys in client-side code
2. **CORS**: Ensure proper CORS configuration on backend endpoints
3. **Authentication**: Consider adding authentication to conversation data endpoints
4. **Data Privacy**: Ensure conversation data handling complies with privacy policies
5. **Rate Limiting**: Implement rate limiting on API endpoints

## Next Steps

1. **Run the database migration** (if updating existing database)
2. **Test the implementation** with a complete user flow
3. **Query the data** using the provided SQL examples
4. **Fetch conversation transcripts** from ElevenLabs API
5. **Analyze the relationships** between conversations and survey responses

## Support

For issues or questions:
- Check browser console for error messages
- Review server logs for backend errors
- Verify database schema matches the updated version
- Ensure environment variables are properly configured

## Files Modified/Created

- ✅ [database-setup.sql](database-setup.sql) - Updated schema with conversation_id
- ✅ [database-migration-add-conversation-id.sql](database-migration-add-conversation-id.sql) - Migration for existing DBs
- ✅ [server.js](server.js:185-216) - New API endpoint for storing conversation_id
- ✅ [index.html](index.html:262-306) - Frontend code to capture conversation_id
- ✅ [query-examples.sql](query-examples.sql) - 11 comprehensive query examples
- ✅ [CONVERSATION_LINKING_GUIDE.md](CONVERSATION_LINKING_GUIDE.md) - This guide
