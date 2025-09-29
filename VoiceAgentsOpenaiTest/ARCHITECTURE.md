# Flask Voice Agent Architecture

## Overview

A web-based voice agent application that allows real-time voice conversations with an AI character (Eric, a depressed pizza shop employee). Uses browser Web Speech API for speech recognition and OpenAI APIs for chat and text-to-speech.

## System Architecture

```
┌─────────────────┐
│   Browser UI    │  ← User speaks & listens
│  (index.html)   │
└────────┬────────┘
         │ Web Speech API (STT)
         │ Fetch API calls
         │
┌────────▼────────┐
│  Flask Server   │  ← Python backend (app.py)
│   Port 3005     │
└────────┬────────┘
         │ OpenAI SDK
         │
┌────────▼────────────┐
│   OpenAI APIs       │
│  - Chat Completion  │
│  - Text-to-Speech   │
└─────────────────────┘
```

## Component Breakdown

### 1. Frontend (`templates/index.html`)

**Purpose**: Provides user interface and handles speech recognition

**Key Features**:
- Press-and-hold spacebar to record audio
- Live transcription display with interim results
- Chat message history display
- Auto-play of AI responses
- Conversation reset button

**Technologies**:
- Web Speech API (`webkitSpeechRecognition`)
- Vanilla JavaScript for UI interactions
- CSS with gradient design and animations

**Flow**:
1. User presses Space → Start recording
2. Browser transcribes speech in real-time (Web Speech API)
3. User releases Space → Send transcript to backend
4. Display responses and play audio

### 2. Backend (`app.py`)

**Purpose**: Flask server that bridges frontend and OpenAI APIs

**Endpoints**:

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/` | GET | Serve HTML UI | - | index.html |
| `/transcribe` | POST | Transcribe audio (unused in current flow) | Audio file | JSON with text |
| `/chat` | POST | Get AI response | User text | JSON with response |
| `/speak` | POST | Convert text to speech | AI text | WAV audio file |
| `/reset` | POST | Reset conversation | - | Status confirmation |

**Key Features**:
- Maintains conversation state in memory
- System prompt defines Eric's personality
- Error handling with fallback strategies
- CORS enabled for cross-origin requests

**Environment Variables**:
```env
OPENAI_API_KEY=sk-...         # Required
STT_MODEL=gpt-4o-transcribe   # Optional
LLM_MODEL=gpt-4o-mini         # Optional
TTS_MODEL=gpt-4o-mini-tts     # Optional
TTS_VOICE=alloy               # Optional
```

### 3. OpenAI Integration

**Models Used**:
1. **Chat Model** (`gpt-4o-mini` or `gpt-4.1`)
   - Generates conversational responses
   - Maintains context through conversation history
   - Custom system prompt for character personality

2. **TTS Model** (`gpt-4o-mini-tts`)
   - Converts AI text to speech
   - Returns WAV audio format
   - Voice: alloy (configurable)

## Data Flow

### Complete Conversation Cycle

```
1. USER SPEAKS
   ├─→ Browser captures audio via microphone
   └─→ Web Speech API transcribes to text locally

2. SEND TO BACKEND
   ├─→ POST /chat with user text
   └─→ Flask adds to conversation_messages array

3. AI GENERATES RESPONSE
   ├─→ OpenAI Chat API called with full conversation
   ├─→ Response generated based on Eric's personality
   └─→ Response added to conversation_messages

4. TEXT-TO-SPEECH
   ├─→ POST /speak with AI response text
   ├─→ OpenAI TTS API generates audio
   └─→ Returns WAV audio file

5. PLAYBACK
   ├─→ Browser receives audio blob
   ├─→ Creates Audio object and auto-plays
   └─→ User hears Eric's voice response
```

## Character Design

**Eric's Personality** (defined in system prompt):
- Pizza shop employee, 3 years on the job
- Depressed, feels in a dead-end situation
- Nice but self-centered
- Only asks surface-level questions
- Gradually opens up if prompted
- Focused on own life, not the user's

## Key Technical Decisions

### Why Web Speech API for STT?
- No need to send audio files to backend
- Lower latency (transcription happens in browser)
- No OpenAI STT API costs
- Real-time interim results for better UX

### Why OpenAI APIs for Chat/TTS?
- High-quality conversational AI
- Natural-sounding voice synthesis
- Reliable and well-documented
- Easy to customize model parameters

### Why Flask?
- Lightweight Python web framework
- Simple routing and request handling
- Easy integration with OpenAI Python SDK
- Minimal boilerplate for this use case

## State Management

**Conversation State**:
```python
conversation_messages = [
    {"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT},
    {"role": "user", "content": "..."},      # Added on each turn
    {"role": "assistant", "content": "..."}  # Added on each turn
]
```

- Stored in-memory (resets on server restart)
- Maintains full conversation history
- Can be reset via `/reset` endpoint
- Single global state (all users share same conversation in this implementation)

## Error Handling

**Frontend**:
- Speech recognition errors → Display error message
- No speech detected → Prompt user to try again
- Network errors → Show error notification

**Backend**:
- Missing audio file → 400 Bad Request
- Empty transcription → 400 Bad Request
- OpenAI API errors → 500 with error details
- TTS parameter fallbacks for API version compatibility

## Performance Considerations

**Latency Sources**:
1. Speech recognition: <1s (browser-side)
2. Network request: 50-200ms
3. OpenAI Chat API: 1-3s
4. OpenAI TTS API: 1-2s
5. Audio playback: Depends on response length

**Optimization Opportunities**:
- Stream audio chunks for faster perceived response
- Cache common responses
- Use lighter models (gpt-4o-mini instead of gpt-4.1)
- Implement WebSocket for lower latency

## Security Notes

**Current Implementation**:
- OpenAI API key stored server-side (✓)
- CORS enabled for all origins (⚠️ development only)
- No authentication (⚠️ single-user assumption)
- Conversation state shared globally (⚠️ not production-ready)

**Production Recommendations**:
- Restrict CORS to specific domains
- Add user authentication
- Implement per-user conversation state
- Rate limiting on endpoints
- Use environment-based configuration

## Dependencies

**Backend** (`requirements.txt`):
```
openai>=1.40.0      # OpenAI Python SDK
flask>=3.0.0        # Web framework
flask-cors>=4.0.0   # CORS support
python-dotenv>=1.0.1 # Environment variables
sounddevice>=0.4.6   # Audio I/O (unused in web version)
soundfile>=0.12.1    # Audio file handling (unused)
numpy>=1.24.0        # Audio processing (unused)
rich>=13.7.0         # Terminal UI (unused)
```

**Frontend**:
- No external dependencies
- Uses browser-native Web Speech API
- Vanilla JavaScript, no frameworks

## File Structure

```
VoiceAgentsOpenaiTest/
├── app.py                 # Flask backend server
├── templates/
│   └── index.html         # Frontend UI
├── .env                   # Environment variables (API keys)
├── requirements.txt       # Python dependencies
└── ARCHITECTURE.md        # This file
```

## Running the Application

1. **Setup**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure**:
   Create `.env` file with your OpenAI API key

3. **Run**:
   ```bash
   python app.py
   ```

4. **Use**:
   Open http://localhost:3005 in Chrome/Edge
   Press and hold Space to talk

## Future Enhancements

- [ ] Streaming audio response (chunk by sentence)
- [ ] Per-user conversation state with sessions
- [ ] WebSocket for lower latency
- [ ] Voice activity detection (hands-free mode)
- [ ] Multiple character personalities
- [ ] Conversation export/save
- [ ] Mobile-friendly UI with touch controls