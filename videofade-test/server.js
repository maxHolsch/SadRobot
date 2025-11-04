const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Internal server error' });
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
