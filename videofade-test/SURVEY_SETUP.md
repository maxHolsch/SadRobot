# Survey Setup Guide

## Overview
The survey system has been integrated into the Sad Robot application. Users must complete a 5-page survey before accessing the main robot animation page.

## Survey Structure
- **5 Pages** with multiple statements each
- **5 Response Options**: Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree
- Responses are stored locally in development and should be stored in a database for production

## Local Development
The survey responses are saved to the `data/` directory:
- Individual responses: `data/survey-{timestamp}.json`
- All responses: `data/survey-responses.json`

## Production Deployment (Vercel)
**Important**: Vercel serverless functions have a read-only file system. For production, you need to integrate with a database service.

### Recommended Database Options:
1. **MongoDB Atlas** (Free tier available)
2. **Supabase** (PostgreSQL, free tier available)
3. **Firebase Firestore** (Free tier available)
4. **Vercel KV** (Redis-based, built for Vercel)

### Integration Steps:
1. Choose a database service
2. Update `api/submit-survey.js` to save to your database instead of files
3. Set up environment variables for database connection
4. Test the integration

### Example: MongoDB Integration
```javascript
// In api/submit-survey.js
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('sadrobot');
const collection = db.collection('survey-responses');
await collection.insertOne(dataToSave);
```

## Survey Data Structure
Each survey response includes:
- `responses`: Object mapping statement keys to response values (1-5)
- `timestamp`: ISO timestamp of submission
- `duration`: Time taken to complete survey (ms)
- `userAgent`: Browser user agent
- `pageData`: Array of pages with statements and responses
- `submittedAt`: Submission timestamp
- `id`: Unique response ID

## Testing
1. Start the local server: `npm start`
2. Visit `http://localhost:3000`
3. Complete the survey
4. Check `data/survey-responses.json` for stored responses

## Resetting Survey
To allow users to retake the survey, clear localStorage:
```javascript
localStorage.removeItem('surveyCompleted');
localStorage.removeItem('surveyCompletionTime');
```

