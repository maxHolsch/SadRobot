// Vercel Serverless Function for Survey Submission
const { sql } = require('@vercel/postgres');

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

    // Save to PostgreSQL database
    try {
      // Ensure user session exists
      await sql`
        INSERT INTO user_sessions (session_id, created_at)
        VALUES (${sessionId}, NOW())
        ON CONFLICT (session_id) DO NOTHING
      `;

      // Update user session with survey ID
      if (isPostSurvey) {
        await sql`
          UPDATE user_sessions
          SET post_survey_id = ${submissionId}
          WHERE session_id = ${sessionId}
        `;
      } else {
        await sql`
          UPDATE user_sessions
          SET pre_survey_id = ${submissionId}
          WHERE session_id = ${sessionId}
        `;
      }

      // Insert main survey submission record into appropriate table
      if (isPostSurvey) {
        await sql`
          INSERT INTO post_survey_submissions (
            id,
            session_id,
            submitted_at,
            duration,
            user_agent,
            responses,
            page_data,
            created_at
          ) VALUES (
            ${submissionId},
            ${sessionId},
            ${submittedAt},
            ${surveyData.duration || null},
            ${surveyData.userAgent || null},
            ${JSON.stringify(surveyData.responses)},
            ${JSON.stringify(surveyData.pageData || [])},
            NOW()
          )
        `;
      } else {
        await sql`
          INSERT INTO pre_survey_submissions (
            id,
            session_id,
            submitted_at,
            duration,
            user_agent,
            responses,
            page_data,
            created_at
          ) VALUES (
            ${submissionId},
            ${sessionId},
            ${submittedAt},
            ${surveyData.duration || null},
            ${surveyData.userAgent || null},
            ${JSON.stringify(surveyData.responses)},
            ${JSON.stringify(surveyData.pageData || [])},
            NOW()
          )
        `;
      }

      // Also insert individual scale responses for easier querying
      // Only insert scale responses (integers 1-5) into the appropriate responses table
      // Text responses are stored in the JSONB columns and can be queried from there
      if (surveyData.pageData && Array.isArray(surveyData.pageData)) {
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
                if (isPostSurvey) {
                  await sql`
                    INSERT INTO post_survey_responses (
                      submission_id,
                      page_number,
                      statement,
                      response_value,
                      created_at
                    ) VALUES (
                      ${submissionId},
                      ${page.page},
                      ${statement.statement},
                      ${statement.response},
                      NOW()
                    )
                  `;
                } else {
                  await sql`
                    INSERT INTO pre_survey_responses (
                      submission_id,
                      page_number,
                      statement,
                      response_value,
                      created_at
                    ) VALUES (
                      ${submissionId},
                      ${page.page},
                      ${statement.statement},
                      ${statement.response},
                      NOW()
                    )
                  `;
                }
              }
            }
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

