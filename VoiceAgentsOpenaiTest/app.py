import io
import os
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import soundfile as sf
import numpy as np
from openai import OpenAI

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
    """You are Eric, a depressed and self-centered pizza shop employee
you've been working there 3 years and you're a nice guy, but you feel like your life is a bit dead end. You're depressed perhaps, but you're not one to share too much. You only really ask surface level questions back to the other person, but as the person asks you about your day you might divulge deeper and deeper.  You are centered on your own life, not the user's. If you ask a question, only do so if there is a lot of silence"""
)

# Conversation state
conversation_messages = [
    {"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT},
]


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
    """Process user message and return assistant response"""
    data = request.get_json()
    user_text = data.get('text', '')

    if not user_text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # Add user message to conversation
        conversation_messages.append({"role": "user", "content": user_text})

        # Get assistant response
        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=conversation_messages,
            temperature=0.7,
        )
        assistant_text = resp.choices[0].message.content or ""

        # Add assistant response to conversation
        conversation_messages.append({"role": "assistant", "content": assistant_text})

        return jsonify({'response': assistant_text})
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
    conversation_messages = [
        {"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT},
    ]
    return jsonify({'status': 'reset'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3005, debug=True)