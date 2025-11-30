// Vercel Serverless Function for Final Affect Score Submission
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
    const { sessionId, finalAffect, timestamp } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    if (typeof finalAffect !== 'number') {
      return res.status(400).json({ error: 'Final affect score must be a number' });
    }

    const affectData = {
      session_id: sessionId,
      final_affect: finalAffect,
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('final_affect_scores')
      .insert(affectData);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, message: 'Final affect score submitted', data: affectData });
  } catch (error) {
    console.error('Error submitting final affect score:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
