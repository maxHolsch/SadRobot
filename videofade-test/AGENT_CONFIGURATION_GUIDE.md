# Guide: Changing Robot Personality and Voice

This guide explains how to change the robot from a finetuned model to a normal ChatGPT model and update the voice from sad to happy in ElevenLabs.

## Overview

The ElevenLabs agent configuration (model, voice, and personality) is managed in the **ElevenLabs Dashboard**, not in the code. The code only uses the `ELEVENLABS_AGENT_ID` to connect to the agent.

## Steps to Change Configuration

### 1. Change Model from Finetuned to Normal ChatGPT

**In ElevenLabs Dashboard:**

1. Go to your ElevenLabs dashboard: https://elevenlabs.io/app/conversational-ai
2. Find your current agent (ID: `agent_3301k95q5ex8fqbbqaqcge1n3bgd` or check your `.env` file)
3. Click on the agent to edit it
4. Navigate to the **Model Settings** or **LLM Configuration** section
5. Change from your finetuned model to a standard ChatGPT model:
   - **Option 1**: Use `gpt-4o` or `gpt-4o-mini` (recommended)
   - **Option 2**: Use `gpt-4-turbo` or `gpt-3.5-turbo`
6. Save the changes

**Note**: The agent will now use the standard ChatGPT model instead of your finetuned version.

### 2. Change Voice from Sad to Happy

**In ElevenLabs Dashboard:**

1. In the same agent configuration page
2. Navigate to the **Voice Settings** section
3. You have two options:

   **Option A: Update Existing Agent Voice**
   - Click on the current voice
   - Browse available voices or use a voice library
   - Select a happier-sounding voice (e.g., voices with higher energy, more upbeat tone)
   - Preview the voice to ensure it sounds happier
   - Save the changes

   **Option B: Create New Agent with Happy Voice**
   - Create a new agent in ElevenLabs
   - Configure it with:
     - Standard ChatGPT model (as above)
     - A happier voice from the voice library
     - Updated personality/system prompt (if needed)
   - Copy the new agent ID
   - Update your `.env` file with the new `ELEVENLABS_AGENT_ID`

### 3. Update Environment Variable (If Using New Agent)

If you created a new agent, update your `.env` or `.env.local` file:

```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=agent_NEW_AGENT_ID_HERE  # Update this with new agent ID
PORT=3000
```

### 4. Update System Prompt (Optional)

If you want to change the personality beyond just the model, you can also update the system prompt in the ElevenLabs dashboard:

1. In the agent configuration, find the **System Prompt** or **Personality** section
2. Update the prompt to reflect a happier personality
3. Example change:
   - **Before**: "You are a sad robot who feels depressed..."
   - **After**: "You are a cheerful and optimistic robot who enjoys conversations..."

### 5. Test the Changes

1. Restart your server if it's running:
   ```bash
   npm start
   ```

2. Open the application in your browser
3. Click "🎤 Talk to Sad Robot" to start a conversation
4. Verify:
   - The model responds like standard ChatGPT (not finetuned)
   - The voice sounds happier/cheerful
   - The personality matches your expectations

## Code Changes (Minimal)

**No code changes are required** if you're updating the existing agent. The code automatically uses whatever agent is configured with the `ELEVENLABS_AGENT_ID`.

**Only update code if:**
- You want to support multiple agents (sad/happy) dynamically
- You want to add agent selection logic based on user preferences

## Current Code Reference

The agent is referenced in:
- `server.js` (line 221): Uses `process.env.ELEVENLABS_AGENT_ID`
- `api/get-signed-url.js` (line 20): Uses `process.env.ELEVENLABS_AGENT_ID`
- `index.html` (line 306): Calls `/api/get-signed-url` to connect

## Troubleshooting

### Agent Not Updating
- Clear browser cache
- Restart the server
- Verify the agent ID in `.env` matches the dashboard

### Voice Not Changed
- Check that you saved the voice changes in the ElevenLabs dashboard
- Verify the voice preview in the dashboard sounds correct
- Try creating a new agent if updates aren't taking effect

### Model Still Using Finetuned Version
- Double-check the model selection in the ElevenLabs dashboard
- Ensure you saved the changes
- Wait a few minutes for changes to propagate (if using cached configuration)

## Summary

**To change from finetuned to normal ChatGPT:**
1. Go to ElevenLabs Dashboard → Your Agent → Model Settings
2. Select standard ChatGPT model (gpt-4o, gpt-4o-mini, etc.)
3. Save changes

**To change voice from sad to happy:**
1. Go to ElevenLabs Dashboard → Your Agent → Voice Settings
2. Select a happier voice
3. Save changes
4. (Optional) Update `.env` if using a new agent ID

**No code changes needed** - the configuration is managed entirely in the ElevenLabs dashboard.

