const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
