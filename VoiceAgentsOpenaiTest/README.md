# Flask Voice Agent - Talk to Eric 🎙️

A web-based voice conversation app featuring Eric, a depressed pizza shop employee. Uses browser Web Speech API for speech recognition and OpenAI for chat and text-to-speech.

## Features

- **Push-to-talk interface** - Press and hold spacebar to record
- **Real-time transcription** - See your words appear as you speak
- **AI conversation** - Chat with Eric's unique personality
- **Natural voice responses** - Hear AI responses with OpenAI TTS
- **Conversation memory** - Maintains context throughout the chat

## Quick Start

### Prerequisites

- Python 3.9+
- OpenAI API key
- Chrome or Edge browser (for Web Speech API)

### Installation

1. **Clone or navigate to this directory**

2. **Create virtual environment and install dependencies**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

   Or, if you're using `uv` for package management, run
   ```bash
   uv sync
   ```
   and you should be good to go.

3. **Configure environment variables**

   Create a `.env` file:
   ```env
   OPENAI_API_KEY=sk-...

   # Optional overrides
   # LLM_MODEL=gpt-4.1
   # TTS_MODEL=gpt-4o-mini-tts
   # TTS_VOICE=alloy
   ```

4. **Run the server**
   ```bash
   python app.py
   ```

   or

   ```bash
   uv run app.py
   ```

5. **Open in browser**

   Visit http://localhost:3005

## Usage

1. **Press and hold SPACE** to start recording
2. **Speak your message** (you'll see live transcription)
3. **Release SPACE** to send
4. Eric will respond in text and voice
5. Click **Reset Conversation** to start fresh

## How It Works

### Architecture

```
Browser (Web Speech API)
    ↓ transcribed text
Flask Server (app.py)
    ↓ chat request
OpenAI Chat API
    ↓ AI response
OpenAI TTS API
    ↓ audio
Browser (auto-play)
```

### Components

- **Frontend** (`templates/index.html`)
  - Web Speech API for speech-to-text
  - Clean UI with status indicators
  - Auto-plays voice responses

- **Backend** (`app.py`)
  - Flask server on port 3005
  - Routes: `/`, `/chat`, `/speak`, `/reset`
  - Maintains conversation state

- **OpenAI Integration**
  - Chat: `gpt-4o-mini` (configurable)
  - TTS: `gpt-4o-mini-tts` with alloy voice

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Serve UI |
| `/chat` | POST | Get AI response |
| `/speak` | POST | Text-to-speech |
| `/reset` | POST | Clear conversation |

## Character: Eric

Eric is a pizza shop employee who's been working there for 3 years. He's:
- Nice but a bit depressed
- Self-centered (focused on his own life)
- Only asks surface-level questions
- Gradually opens up if you engage him

## Configuration

Environment variables (all optional except API key):

```env
OPENAI_API_KEY=sk-...         # Required
LLM_MODEL=gpt-4o-mini         # Chat model (default: gpt-4o-mini)
TTS_MODEL=gpt-4o-mini-tts     # Voice model (default: gpt-4o-mini-tts)
TTS_VOICE=alloy               # Voice: alloy|echo|fable|onyx|nova|shimmer
```

## Troubleshooting

**Speech recognition not working?**
- Use Chrome or Edge (Web Speech API required)
- Check microphone permissions
- Ensure you're on HTTPS or localhost

**No audio playback?**
- Check browser audio permissions
- Try clicking the page first (some browsers require user interaction)
- Check system audio settings

**Server errors?**
- Verify OpenAI API key is valid
- Check `.env` file is loaded
- Ensure port 3005 is available

**Conversation doesn't make sense?**
- Click "Reset Conversation" to clear state
- Check if server restarted (state is in-memory)

## Development

### Project Structure

```
VoiceAgentsOpenaiTest/
├── app.py                 # Flask server
├── templates/
│   └── index.html         # Frontend UI
├── .env                   # Environment config
├── requirements.txt       # Python dependencies
├── README.md              # This file
└── ARCHITECTURE.md        # Technical details
```

### Running in Debug Mode

The app runs in debug mode by default:
```python
app.run(host='0.0.0.0', port=3005, debug=True)
```

Changes to `app.py` will auto-reload the server.

### Modifying Eric's Personality

Edit the system prompt in `app.py`:
```python
VOICE_AGENT_SYSTEM_PROMPT = """
Your custom personality here...
"""
```

## Technical Details

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)

## Production Deployment

⚠️ This app is configured for development. For production:

1. **Disable debug mode**
   ```python
   app.run(host='0.0.0.0', port=3005, debug=False)
   ```

2. **Use production WSGI server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:3005 app:app
   ```

3. **Secure CORS**
   ```python
   CORS(app, origins=['https://yourdomain.com'])
   ```

4. **Add authentication**
   - Implement user sessions
   - Per-user conversation state
   - Rate limiting

5. **Use environment variables**
   - Never commit `.env` to version control
   - Use secure secrets management

## Dependencies

**Python** (see `requirements.txt`):
- `flask` - Web framework
- `flask-cors` - CORS support
- `openai` - OpenAI Python SDK
- `python-dotenv` - Environment variables

**Browser**:
- Web Speech API (Chrome/Edge)
- Audio API for playback

## License

MIT

## Credits

Built with OpenAI APIs (Chat Completions, Text-to-Speech) and Web Speech API.
