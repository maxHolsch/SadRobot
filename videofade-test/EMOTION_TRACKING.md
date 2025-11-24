# Emotion Tracking System

## Overview

This system uses **Sentiment.js** to analyze the robot's responses and gradually transition between emotional video states (sad → neutral → happy) based on the conversation content.

## How It Works

1. **Text Analysis**: When the robot responds, the text is analyzed using Sentiment.js
2. **Affect Score**: Sentiment is mapped to an affect score (1.0 = sad, 3.0 = happy)
3. **Gradual Transitions**: Score changes maximum 0.35 per message (prevents instant 1→3 jumps)
4. **Video Mapping**: Affect score determines which video plays:
   - 1.0-1.5 → sad_long.mp4
   - 1.5-2.0 → neutral (slightly sad)
   - 2.0-2.5 → neutral (slightly happy)
   - 2.5-3.0 → happier_stitched_1.mp4

## Setup

```bash
cd videofade-test
npm install
```

This will install `sentiment@5.0.2` and its dependencies (~50KB).

## Testing

Open the browser console after the page loads. You'll see a menu of debug commands:

### Basic Testing
```javascript
// Test a single message
testEmotion("I hate my job");
testEmotion("Actually had a good day today!");

// Show current state
emotionState();

// Show message history
emotionHistory();

// Visual affect meter
affectMeter();
```

### Advanced Testing
```javascript
// Run predefined message sequences
testSequence("sad");         // Test sad messages
testSequence("positive");    // Test positive messages
testSequence("verySad");     // Test very negative messages

// Test gradual progression from sad to happy
testProgression();  // Runs 10 messages over 30 seconds

// Reset to baseline
resetEmotion();
```

## Custom Lexicon (Optional)

You can extend the sentiment lexicon with pizza-shop specific words:

```javascript
// In emotionAnalyzer.js, add to CUSTOM_LEXICON:
const CUSTOM_LEXICON = {
  'pizza': 0,      // Neutral
  'boss': -2,      // Negative
  'tips': 1,       // Positive
  'stuck': -3,     // Very negative
  // ... more words
};
```

## Configuration

Key parameters in `EmotionAnalyzer` class:

```javascript
this.maxTransitionSpeed = 0.35;  // Max affect change per message
this.baselineAffect = 1.3;       // Natural baseline (slightly sad)
this.decayRate = 0.02;           // Return to baseline speed
```

## Vercel Deployment

✅ **No special configuration needed** - all processing is client-side
- Sentiment.js is bundled as a regular dependency
- No API calls or backend processing
- Works entirely in the browser

## How Sentiment.js Works

**Sentiment.js** uses the AFINN-165 lexicon (2,477 English words) with:
- Word sentiment scores (-5 to +5)
- Negation handling ("not bad" → positive)
- Booster words ("very", "really")
- Emoji support 😊😢

**Performance:**
- Analysis time: <5ms per message
- Bundle size: ~50KB minified
- No network calls

## Architecture

```
User talks → Robot responds → ElevenLabs message event
                                      ↓
                            emotionAnalyzer.storeMessage()
                                      ↓
                         Sentiment.js analysis + scoring
                                      ↓
                          Update affect score (gradual)
                                      ↓
                         Map to video state (0-3)
                                      ↓
                    videoMixer.goTo(state) if changed
```

## File Structure

```
js/
├── emotionAnalyzer.js    # Main emotion tracking logic
├── emotionDebug.js       # Testing utilities
├── videoMixer.js         # Video crossfading (existing)
└── survey.js             # Survey logic (existing)
```

## Message Flow

```javascript
// In index.html onMessage callback (line 283-292)
onMessage: (message) => {
  videoMixer.handleMessage(message);  // Handle talking animation

  if (message && message.message && window.emotionAnalyzer) {
    window.emotionAnalyzer.storeMessage(message.message);
    // Automatically triggers video transition if needed
  }
}
```

## Debugging

Enable detailed logging:

```javascript
// In browser console
window.emotionAnalyzer.messageHistory;  // See all analyzed messages
window.emotionAnalyzer.currentAffect;   // Current affect score
window.emotionAnalyzer.getState();      // Full state object
```

## Example Output

```
[EmotionAnalyzer] Message analyzed: {
  text: "I hate my job. This pizza place is killing me.",
  sentiment: -0.857,
  positive: [],
  negative: ["hate", "killing"],
  currentAffect: 1.12,
  targetAffect: 0.86,
  change: -0.350,
  videoState: 0
}

[EmotionAnalyzer] Triggering video transition: 1 → 0
```

## Troubleshooting

**Analyzer not initialized:**
```javascript
// Check if loaded
console.log(window.emotionAnalyzer);

// Manually initialize if needed
import EmotionAnalyzer from './js/emotionAnalyzer.js';
window.emotionAnalyzer = new EmotionAnalyzer();
```

**Videos not transitioning:**
- Check that `window.videoMixer` exists
- Verify `videoMixer.currentIndex()` vs `emotionAnalyzer.getVideoStateIndex()`
- Check browser console for errors

**Sentiment seems wrong:**
- Use `testEmotion("your message")` to see detailed analysis
- Check which words are being detected as positive/negative
- Adjust `CUSTOM_LEXICON` if needed

## Further Customization

### Change transition speed
```javascript
window.emotionAnalyzer.maxTransitionSpeed = 0.5; // Faster changes
```

### Change baseline
```javascript
window.emotionAnalyzer.baselineAffect = 1.5; // More neutral baseline
```

### Disable decay
```javascript
window.emotionAnalyzer.decayEnabled = false; // Stay at current affect
```
