# OpenAI Sentiment Analysis Integration

## Overview
The sentiment analysis has been updated to use OpenAI's GPT-4o-mini model instead of the local Sentiment.js library.

## Changes Made

### 1. Dependencies
- **Added**: `openai` npm package (v6.9.1)
- **Kept**: `sentiment` package (as fallback)

### 2. Environment Configuration
Added to `.env.local`:
```
OPENAI_API_KEY=your-openai-api-key-here
```

**⚠️ Important**: You need to add your actual OpenAI API key to the `.env.local` file.

### 3. Server-Side Changes ([server.js](server.js:6-14,270-312))

#### Added OpenAI Client (lines 6-14)
```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

#### New API Endpoint: `/api/analyze-sentiment` (lines 270-312)
- **Method**: POST
- **Input**: `{ text: string }`
- **Output**: `{ sentiment: number }` (between -1 and 1)
- **Model**: `gpt-4o-mini-2024-07-18`
- **Temperature**: 0.3 (for consistent results)
- **Max Tokens**: 10 (only returns a number)

The endpoint sends a system prompt asking GPT to analyze sentiment and return only a single number between -1 and 1.

### 4. Client-Side Changes ([js/emotionAnalyzer.js](js/emotionAnalyzer.js))

#### Updated `analyzeText()` Method (lines 155-226)
- Now **async** function
- Calls `/api/analyze-sentiment` endpoint
- Returns sentiment score from OpenAI
- Includes **fallback** to local analysis if API fails
- Still applies phrase pattern matching as bonus adjustment

#### Updated `updateAffectScore()` Method (line 232)
- Now **async** to await sentiment analysis

#### Updated `storeMessage()` Method (line 337)
- Now **async** to await affect score update

## How It Works

1. When a message arrives, `storeMessage(text)` is called
2. This calls `updateAffectScore(text)` which calls `analyzeText(text)`
3. `analyzeText()` sends the text to the server endpoint
4. Server calls OpenAI API with the text
5. OpenAI returns a sentiment score (-1 to 1)
6. The score is returned to the client
7. Client combines it with phrase patterns
8. Affect score is updated based on the sentiment
9. Video state changes accordingly

## Sentiment Scoring

- **OpenAI Output**: Number between -1 (very negative) and 1 (very positive)
- **Scaling**: Score is kept in -1 to 1 range for comparative value
- **Phrase Modifiers**: Additional patterns still applied (reduced weight to 0.05)
- **Affect Mapping**: Sentiment maps to affect score (0.0 = sad, 3.0 = happy)

## Error Handling

If the OpenAI API call fails:
- Catches error and logs it
- **Automatically falls back** to the local `fallbackAnalyze()` method
- Continues functioning with reduced accuracy
- No user-facing errors

## Usage

### Starting the Server
```bash
npm start
```

### Testing the Sentiment API
```bash
curl -X POST http://localhost:3000/api/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling really happy today!"}'
```

Expected response:
```json
{
  "sentiment": 0.8
}
```

## Benefits

1. **More Accurate**: LLM-based sentiment analysis understands context better
2. **Nuanced**: Captures subtle emotional tones
3. **Robust Fallback**: Still works if API is unavailable
4. **Minimal Changes**: Maintains existing architecture
5. **Async-Safe**: Properly handles asynchronous operations

## Cost Considerations

- **Model**: GPT-4o-mini (very cheap)
- **Tokens per Request**: ~50-100 input + 10 output
- **Approximate Cost**: $0.0001 - $0.0002 per sentiment analysis
- **For 1000 messages**: ~$0.10 - $0.20

## Future Improvements

1. **Caching**: Cache sentiment scores for repeated text
2. **Batch Processing**: Analyze multiple messages in one API call
3. **Fine-tuning**: Train a custom model for pizza-shop context
4. **Streaming**: Use streaming API for faster responses
5. **Local Model**: Consider using a local LLM for zero-cost operation

## Integration with Latest Code

This integration has been applied on top of the latest code from the repository (commit: a3b3430 "change page title"). The changes preserve all recent updates including:
- Robot tag functionality
- Survey improvements
- Video updates
- Database migrations
