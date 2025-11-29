const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { supabaseAdmin } = require('./lib/supabaseClient');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API route to submit survey responses
app.post('/api/submit-survey', async (req, res) => {
  try {
    const surveyData = req.body;

    if (!surveyData || !surveyData.responses) {
      return res.status(400).json({ error: 'Invalid survey data' });
    }

    if (!surveyData.sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const surveyType = surveyData.surveyType || surveyData.mode || 'pre';
    const isPostSurvey = surveyType === 'post';

    // Generate submission data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const submissionId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();
    const sessionId = surveyData.sessionId;

    // Try Supabase first, fallback to JSON files if it fails
    let usedSupabase = false;

    try {
      // Ensure user session exists
      const { error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .upsert(
          { session_id: sessionId, created_at: new Date().toISOString() },
          { onConflict: 'session_id', ignoreDuplicates: true }
        );

      if (sessionError && sessionError.code !== '23505') {
        console.error('Session error:', sessionError);
      }

      // Update user session with survey ID
      const updateData = isPostSurvey
        ? { post_survey_id: submissionId }
        : { pre_survey_id: submissionId };

      const { error: updateError } = await supabaseAdmin
        .from('user_sessions')
        .update(updateData)
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Session update error:', updateError);
      }

      // Insert main survey submission
      const tableName = isPostSurvey ? 'post_survey_submissions' : 'pre_survey_submissions';
      const submissionData = {
        id: submissionId,
        session_id: sessionId,
        submitted_at: submittedAt,
        duration: surveyData.duration || null,
        user_agent: surveyData.userAgent || null,
        responses: surveyData.responses,
        page_data: surveyData.pageData || [],
        created_at: new Date().toISOString()
      };

      const { error: submissionError } = await supabaseAdmin
        .from(tableName)
        .insert(submissionData);

      if (submissionError) {
        throw submissionError;
      }

      // Insert individual scale responses
      if (surveyData.pageData && Array.isArray(surveyData.pageData)) {
        const responseTableName = isPostSurvey ? 'post_survey_responses' : 'pre_survey_responses';
        const scaleResponses = [];

        for (const page of surveyData.pageData) {
          if (page.statements && Array.isArray(page.statements)) {
            for (const statement of page.statements) {
              if (statement.response !== null &&
                  statement.response !== undefined &&
                  typeof statement.response === 'number' &&
                  statement.response >= 1 &&
                  statement.response <= 5) {
                scaleResponses.push({
                  submission_id: submissionId,
                  page_number: page.page,
                  statement: statement.statement,
                  response_value: statement.response,
                  created_at: new Date().toISOString()
                });
              }
            }
          }
        }

        if (scaleResponses.length > 0) {
          const { error: responsesError } = await supabaseAdmin
            .from(responseTableName)
            .insert(scaleResponses);

          if (responsesError) {
            console.error('Error inserting individual responses:', responsesError);
          }
        }
      }

      usedSupabase = true;
      console.log('✅ Survey saved to Supabase:', submissionId);

    } catch (supabaseError) {
      console.error('Supabase error, falling back to JSON files:', supabaseError);

      // Fallback to JSON file storage
      const fs = require('fs');
      const dataDir = path.join(__dirname, 'data');

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filename = `survey-${timestamp}.json`;
      const filepath = path.join(dataDir, filename);

      const dataToSave = {
        ...surveyData,
        submittedAt,
        id: submissionId
      };

      fs.writeFileSync(filepath, JSON.stringify(dataToSave, null, 2), 'utf8');

      // Also append to master file
      const masterFile = path.join(dataDir, 'survey-responses.json');
      let allResponses = [];

      if (fs.existsSync(masterFile)) {
        try {
          const existingData = fs.readFileSync(masterFile, 'utf8');
          allResponses = JSON.parse(existingData);
        } catch (e) {
          console.warn('Could not read master file, starting fresh');
        }
      }

      allResponses.push(dataToSave);
      fs.writeFileSync(masterFile, JSON.stringify(allResponses, null, 2), 'utf8');

      console.log('📁 Survey saved to JSON file:', filename);
    }

    res.json({
      success: true,
      message: 'Survey submitted successfully',
      id: submissionId,
      storage: usedSupabase ? 'supabase' : 'json'
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// API route to update conversation ID in user session
app.post('/api/update-conversation-id', async (req, res) => {
  try {
    const { sessionId, conversationId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Update the user session with the conversation ID
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .update({ conversation_id: conversationId })
      .eq('session_id', sessionId)
      .select();

    if (error) {
      console.error('Error updating conversation ID:', error);
      return res.status(500).json({ error: 'Failed to update conversation ID', details: error.message });
    }

    console.log(`Updated conversation ID for session ${sessionId}: ${conversationId}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating conversation ID:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// API route to generate signed URL for ElevenLabs voice agent
app.get('/api/get-signed-url', async (req, res) => {
  try {
    const agentId = req.query.agent_id || process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Generate signed URL using ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to generate signed URL' });
    }

    const data = await response.json();
    console.log('ElevenLabs API response:', data);

    // Return both signed URL and any conversation ID if available
    res.json({
      signedUrl: data.signed_url,
      conversationId: data.conversation_id || data.conversationId || null
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route for sentiment analysis using OpenAI
app.post('/api/analyze-sentiment', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call OpenAI API with structured output for sentiment analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analyzer. Analyze the sentiment of the given text and return a single number between -1 and 1, where -1 is very negative, 0 is neutral, and 1 is very positive. Return ONLY the number, nothing else.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const sentimentText = completion.choices[0].message.content.trim();
    const sentiment = parseFloat(sentimentText);

    if (isNaN(sentiment)) {
      console.error('Invalid sentiment value received:', sentimentText);
      return res.status(500).json({ error: 'Invalid sentiment analysis result' });
    }

    res.json({ sentiment });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Only start server if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Voice agent demo available at http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
