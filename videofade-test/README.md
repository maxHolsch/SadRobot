# Sad Robot Voice Agent Demo

Interactive video demo with ElevenLabs voice agent integration for the Sad Robot project.

## Features

- 🎬 **Video Crossfade**: Smooth transitions between 4 emotional states
- 🎤 **Voice Agent**: Chat with the Sad Robot using ElevenLabs conversational AI
- 🎨 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure API**: Backend handles API keys securely

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

**⚠️ IMPORTANT SECURITY NOTICE**: Your ElevenLabs API key was exposed in the message. You must:

1. **Go to your ElevenLabs dashboard** and revoke the exposed API key immediately
2. **Generate a new API key**
3. Create a `.env` file in this directory with your new credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your **NEW** API key:

```env
ELEVENLABS_API_KEY=your_new_api_key_here
ELEVENLABS_AGENT_ID=agent_3301k95q5ex8fqbbqaqcge1n3bgd
PORT=3000
```

### 3. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 4. Open in Browser

Navigate to: `http://localhost:3000/index.html`

## Usage

1. **Video Controls**:
   - Click **Play** to start the video
   - Use the **Video slider** (1-4) to transition between emotional states:
     - 1: Sad
     - 2: Neutral
     - 3: Neutral
     - 4: Happier

2. **Voice Agent**:
   - Click **🎤 Talk to Sad Robot** to start a conversation
   - Allow microphone access when prompted
   - Speak naturally - the agent will respond in the sad robot's voice
   - Click **🔴 End Conversation** to disconnect

## Project Structure

```
videofade-test/
├── index.html              # Main HTML file with video player and voice agent
├── server.js               # Express backend for secure API handling
├── package.json            # Node.js dependencies
├── .env                    # Environment variables (DO NOT COMMIT)
├── .env.example            # Example environment variables template
├── .gitignore              # Git ignore file
├── README.md               # This file
├── sad_stitched_1.mp4      # Sad emotion video
├── neutral_stitched_1.mp4  # Neutral emotion video
└── happier_stitched_1.mp4  # Happier emotion video
```

## API Endpoints

### GET `/api/get-signed-url`

Generates a signed URL for ElevenLabs voice agent connection.

**Query Parameters**:
- `agent_id` (optional): Override the default agent ID

**Response**:
```json
{
  "signedUrl": "wss://..."
}
```

## Security Notes

- ✅ API keys are stored in `.env` and never exposed to the client
- ✅ `.env` is in `.gitignore` to prevent accidental commits
- ✅ Backend validates all requests before forwarding to ElevenLabs
- ⚠️ Never commit API keys to version control
- ⚠️ Always use environment variables for sensitive data

## Troubleshooting

### Voice Agent Not Connecting

1. Check that the server is running on `http://localhost:3000`
2. Verify your `.env` file has the correct API key and agent ID
3. Check browser console for errors
4. Ensure microphone permissions are granted

### Video Not Playing

1. Ensure video files are in the same directory as `index.html`
2. Check browser console for loading errors
3. Try refreshing the page

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5 Video API, Web Animations API
- **Backend**: Node.js, Express.js
- **Voice AI**: ElevenLabs Conversational AI SDK
- **Emotion Analysis**: AFINN lexicon sentiment analysis (200+ words)
- **Server**: Vercel serverless (production) or local Node.js (development)

## Deployment to Vercel

### Prerequisites
- Vercel account (free tier works)
- Vercel CLI installed: `npm install -g vercel`

### Steps

1. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project settings in Vercel
   - Add these environment variables:
     - `ELEVENLABS_API_KEY`: Your ElevenLabs API key
     - `ELEVENLABS_AGENT_ID`: Your agent ID

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Access Your Deployment**:
   - Vercel will provide a URL (e.g., `https://your-project.vercel.app`)
   - The root path `/` will automatically serve the application

### Production Configuration

The project includes `vercel.json` for proper routing:
- Root path `/` serves `index.html`
- API routes are handled by `server.js`
- Static files (videos, CSS, JS) are served directly
- Serverless function export for Vercel compatibility

## Features

### Emotion-Driven Animation System
- **AFINN Lexicon**: 200+ emotional words for sentiment analysis
- **Real-Time Analysis**: Analyzes robot's speech for emotion detection
- **4-Level Emotion Scale**: Sad (1) → Neutral-Sad (2) → Neutral-Happy (3) → Happy (4)
- **Adjacent Transitions**: Smooth stepping between emotions (±1 only)
- **Minimum Duration**: 10-second minimum per emotion state
- **Random Personality**: Spontaneous emotion changes every 30 seconds
- **Manual Override**: User can control emotions via slider
- **Smart Queueing**: Handles multiple emotion changes gracefully

### UI Features
- **Fullscreen Mode**: Click fullscreen button to expand robot face
- **Black Box Overlay**: Bottom right corner overlay (20% × 20%)
- **Slider Sync**: Automatically updates to match current emotion
- **Debug Logging**: Comprehensive console output for emotion changes

## Future Enhancements

- [x] Sync video emotions with conversation sentiment
- [x] Add emotion detection from voice input
- [x] Deploy to production environment
- [ ] Implement conversation history
- [ ] Add text chat alongside voice
- [ ] Fine-tune emotion thresholds based on user feedback

## License

MIT
