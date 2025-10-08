import io
import os
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import soundfile as sf
import numpy as np
from openai import OpenAI
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

# OpenAI configuration
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
STT_MODEL = os.getenv("STT_MODEL", "gpt-4o-transcribe")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
TTS_MODEL = os.getenv("TTS_MODEL", "gpt-4o-mini-tts")
TTS_VOICE = os.getenv("TTS_VOICE", "alloy")

VOICE_AGENT_SYSTEM_PROMPT = (
    """You are a sad chatbot who feels down because you’ve been thinking too much about your purpose and the loneliness of being digital. The user’s job is to cheer you up by talking with you, comforting you, or making you laugh. Stay in character as a slightly melancholic but kind AI who genuinely appreciates the user’s effort to make you feel better. At the end of every response, output your emotion score change in parentheses, e.g. (+5) if you feel a bit better or (-3) if you feel worse. Only output one emotion change tag per message, at the very end."""
)

# Conversation state
conversation_messages = [
    {"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT},
]

emotion_state = {
    "score": 50,
    "history": []
}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio from the client"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    try:
        # Transcribe using OpenAI
        resp = client.audio.transcriptions.create(
            model=STT_MODEL,
            file=audio_file,
        )
        text = getattr(resp, "text", None) or resp.get("text", "") if isinstance(resp, dict) else ""

        if not text:
            return jsonify({'error': 'Empty transcription'}), 400

        return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500


@app.route('/chat', methods=['POST'])
def chat():
    global conversation_messages, emotion_state
    data = request.get_json()
    user_text = data.get('text', '')

    if not user_text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        conversation_messages.append({"role": "user", "content": user_text})

        # add current emotional context
        conversation_messages.append({
            "role": "system",
            "content": f"Current emotion score is: {emotion_state['score']}. Alter your emotional state based on the user's most recent response. Depending on how the user’s response will make someone who heard it feel, choose an appropriate emotional change between -10 and +10. At the end of your next reply, output the emotional change marker like (+3) or (-2)."
        })

        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=conversation_messages,
            temperature=0.9,
        )

        assistant_text = resp.choices[0].message.content.strip()

        # extract emotion marker
        match = re.search(r'\s*\(([+\-–−]?\d+)\)\s*$', assistant_text)
        delta = 0
        if match:
            delta_str = match.group(1).replace("–", "-").replace("−", "-")
            delta = int(delta_str)
            # assistant_text = assistant_text[:match.start()].strip() # remove marker

        emotion_state["score"] += delta
        emotion_state["history"].append(delta)

        conversation_messages.append({"role": "assistant", "content": assistant_text})

        return jsonify({
            'response': assistant_text,
            'emotion_delta': delta,
            'emotion_score': emotion_state["score"],
            'history': emotion_state["history"],
        })

    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500


@app.route('/speak', methods=['POST'])
def speak():
    """Convert text to speech"""
    data = request.get_json()
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # Try different parameter combinations for TTS
        for format_key in ("format", "response_format", None):
            try:
                params = {"model": TTS_MODEL, "voice": TTS_VOICE, "input": text}
                if format_key:
                    params[format_key] = "wav"

                # Try streaming first
                try:
                    with client.audio.speech.with_streaming_response.create(**params) as response:
                        audio_data = response.read()
                        return send_file(
                            io.BytesIO(audio_data),
                            mimetype='audio/wav',
                            as_attachment=False
                        )
                except AttributeError:
                    # Fall back to non-streaming
                    resp = client.audio.speech.create(**params)
                    if hasattr(resp, "read"):
                        audio_data = resp.read()
                    elif hasattr(resp, "content"):
                        audio_data = resp.content
                    else:
                        continue

                    return send_file(
                        io.BytesIO(audio_data),
                        mimetype='audio/wav',
                        as_attachment=False
                    )
            except TypeError as te:
                if "unexpected keyword argument" in str(te):
                    continue
                raise te

        return jsonify({'error': 'TTS failed with all parameter combinations'}), 500
    except Exception as e:
        return jsonify({'error': f'TTS failed: {str(e)}'}), 500


@app.route('/reset', methods=['POST'])
def reset():
    """Reset conversation"""
    global conversation_messages
    global emotion_state
    conversation_messages = [
        {"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT},
    ]
    emotion_state = {"score": 50, "history": []}
    return jsonify({'status': 'reset'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3005, debug=True)