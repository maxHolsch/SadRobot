// Vercel Serverless Function for Consent Form Submission
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
    const consentData = req.body;

    // Validate required fields
    if (!consentData || !consentData.participantName) {
      return res.status(400).json({ error: 'Participant name is required' });
    }

    if (!consentData.signatureData) {
      return res.status(400).json({ error: 'Signature is required' });
    }

    if (!consentData.participantDate) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!consentData.sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Generate submission ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const submissionId = `consent-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();
    const sessionId = consentData.sessionId;
    const robotTag = consentData.robotTag || 'undefined'; // Default to 'sad' if not provided

    // Save to Supabase database
    try {
      // Ensure user session exists
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .upsert(
          { 
            session_id: sessionId,
            robot_tag: robotTag,
            created_at: new Date().toISOString() 
          },
          { onConflict: 'session_id', ignoreDuplicates: true }
        );

      if (sessionError && sessionError.code !== '23505') { // Ignore duplicate key errors
        console.error('Session error:', sessionError);
      }

      // Update user session with consent ID
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ consent_form_id: submissionId })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Session update error:', updateError);
      }

      // Insert consent form submission
      const consentSubmissionData = {
        id: submissionId,
        session_id: sessionId,
        participant_name: consentData.participantName,
        signature_data: consentData.signatureData,
        participant_date: consentData.participantDate,
        recording_permission: consentData.recordingPermission || false,
        recording_understanding: consentData.recordingUnderstanding || false,
        robot_tag: robotTag,
        timestamp: consentData.timestamp || submittedAt,
        created_at: submittedAt
      };

      const { error: consentError } = await supabase
        .from('consent_forms')
        .insert(consentSubmissionData);

      if (consentError) {
        throw consentError;
      }

      console.log('✅ Consent form saved:', submissionId);

      res.status(200).json({ 
        success: true, 
        message: 'Consent form submitted successfully',
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
    console.error('Error submitting consent form:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
