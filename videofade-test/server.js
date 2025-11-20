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

// API route to submit survey responses
app.post('/api/submit-survey', async (req, res) => {
  try {
    const surveyData = req.body;

    if (!surveyData || !surveyData.responses) {
      return res.status(400).json({ error: 'Invalid survey data' });
    }

    // Create data directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, 'data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save survey response to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `survey-${timestamp}.json`;
    const filepath = path.join(dataDir, filename);

    // Add submission timestamp
    const dataToSave = {
      ...surveyData,
      submittedAt: new Date().toISOString(),
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`
    };

    fs.writeFileSync(filepath, JSON.stringify(dataToSave, null, 2), 'utf8');

    // Also append to a master file for easy access
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

    res.json({ 
      success: true, 
      message: 'Survey submitted successfully',
      id: dataToSave.id
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ error: 'Internal server error' });
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
