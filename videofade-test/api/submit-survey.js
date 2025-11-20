// Vercel Serverless Function for Survey Submission
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Add submission timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const submissionId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();
    const sessionId = surveyData.sessionId;

    // Save to Supabase database
    try {
      // Ensure user session exists
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .upsert(
          { session_id: sessionId, created_at: new Date().toISOString() },
          { onConflict: 'session_id', ignoreDuplicates: true }
        );

      if (sessionError && sessionError.code !== '23505') { // Ignore duplicate key errors
        console.error('Session error:', sessionError);
      }

      // Update user session with survey ID
      const updateData = isPostSurvey
        ? { post_survey_id: submissionId }
        : { pre_survey_id: submissionId };

      const { error: updateError } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Session update error:', updateError);
      }

      // Insert main survey submission record into appropriate table
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

      const { error: submissionError } = await supabase
        .from(tableName)
        .insert(submissionData);

      if (submissionError) {
        throw submissionError;
      }

      // Also insert individual scale responses for easier querying
      // Only insert scale responses (integers 1-5) into the appropriate responses table
      // Text responses are stored in the JSONB columns and can be queried from there
      if (surveyData.pageData && Array.isArray(surveyData.pageData)) {
        const responseTableName = isPostSurvey ? 'post_survey_responses' : 'pre_survey_responses';
        const scaleResponses = [];

        for (const page of surveyData.pageData) {
          if (page.statements && Array.isArray(page.statements)) {
            for (const statement of page.statements) {
              // Only insert if response is a number (scale response)
              // Text responses are stored in the JSONB responses column
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

        // Batch insert all scale responses
        if (scaleResponses.length > 0) {
          const { error: responsesError } = await supabase
            .from(responseTableName)
            .insert(scaleResponses);

          if (responsesError) {
            console.error('Error inserting individual responses:', responsesError);
            // Don't throw - main submission succeeded
          }
        }
      }

      res.status(200).json({ 
        success: true, 
        message: 'Survey submitted successfully',
        id: submissionId
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // If table doesn't exist, provide helpful error message
      if (dbError.message && dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return res.status(500).json({ 
          error: 'Database tables not initialized. Please run the database setup script.',
          details: dbError.message
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

