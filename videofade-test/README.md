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
- **Server**: Local development server (can be deployed to any Node.js hosting)

## Future Enhancements

- [ ] Sync video emotions with conversation sentiment
- [ ] Add emotion detection from voice input
- [ ] Implement conversation history
- [ ] Add text chat alongside voice
- [ ] Deploy to production environment

## License

MIT
