// Vercel Serverless Function to Update Conversation ID
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
    const { sessionId, conversationId, robotTag } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    const tag = robotTag || 'sad'; // Default to 'sad' if not provided

    console.log(`Updating conversation ID for session ${sessionId}: ${conversationId} (robot_tag: ${tag})`);

    // Update the user session with the conversation ID and robot tag
    const { data, error } = await supabase
      .from('user_sessions')
      .update({ conversation_id: conversationId, robot_tag: tag })
      .eq('session_id', sessionId)
      .select();

    if (error) {
      console.error('Error updating conversation ID:', error);
      return res.status(500).json({
        error: 'Failed to update conversation ID',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      // Session doesn't exist yet, create it with the conversation ID and robot tag
      const { data: insertData, error: insertError } = await supabase
        .from('user_sessions')
        .insert([{
          session_id: sessionId,
          conversation_id: conversationId,
          robot_tag: tag
        }])
        .select();

      if (insertError) {
        console.error('Error creating session with conversation ID:', insertError);
        return res.status(500).json({
          error: 'Failed to create session',
          details: insertError.message
        });
      }

      console.log(`Created new session ${sessionId} with conversation ID ${conversationId}`);
      return res.status(200).json({ success: true, data: insertData });
    }

    console.log(`Successfully updated conversation ID for session ${sessionId}`);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating conversation ID:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
