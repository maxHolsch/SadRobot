/**
 * Emotion Analyzer Debug Utilities
 *
 * Provides testing and visualization tools for the emotion tracking system
 * Usage in browser console:
 *   testEmotion("I'm feeling great today!")
 *   emotionState()
 *   emotionHistory()
 */

// Test messages for different emotional states
export const TEST_MESSAGES = {
  verySad: [
    "I hate my job. This pizza place is killing me.",
    "I feel so stuck here. Three years of my life wasted.",
    "Every day is the same meaningless routine. I'm so tired.",
    "Nobody understands how empty I feel. This is pointless."
  ],

  sad: [
    "Work was rough today. Same old same old.",
    "I don't know, just another day I guess.",
    "Nothing really new. Just tired.",
    "I suppose it's okay. Kinda boring though."
  ],

  neutral: [
    "It's alright. Had some okay customers today.",
    "Not bad I guess. Made some decent tips.",
    "Work was fine. Nothing special.",
    "Just a normal shift, you know?"
  ],

  slightlyPositive: [
    "Actually had a pretty good day today.",
    "Met some interesting people at work.",
    "Been thinking about some new plans.",
    "Things are getting a bit better, I think."
  ],

  positive: [
    "I'm feeling really hopeful about things!",
    "Had a great conversation with a customer today. Made me think.",
    "I've been looking into some new opportunities. Excited!",
    "Things are really looking up. I'm proud of myself."
  ]
};

/**
 * Test the emotion analyzer with a custom message
 */
export function testEmotion(message) {
  if (!window.emotionAnalyzer) {
    console.error('❌ EmotionAnalyzer not initialized. Make sure page is fully loaded.');
    return null;
  }

  console.log('\n🧪 Testing emotion analysis...');
  console.log('📝 Message:', message);

  const result = window.emotionAnalyzer.storeMessage(message);

  if (!result) {
    console.error('❌ Analysis failed');
    return null;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results:');
  console.log('  Sentiment Score:', result.analysis.combinedScore.toFixed(3));
  console.log('  Positive words:', result.analysis.positive.join(', ') || 'none');
  console.log('  Negative words:', result.analysis.negative.join(', ') || 'none');
  console.log('  Current Affect:', result.currentAffect.toFixed(2), '/', '3.00');
  console.log('  Target Affect:', result.targetAffect.toFixed(2));
  console.log('  Change:', result.change >= 0 ? '+' + result.change.toFixed(3) : result.change.toFixed(3));
  console.log('  Video State:', result.videoState, '→', ['Sad', 'Neutral-Sad', 'Neutral', 'Happy'][result.videoState]);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return result;
}

/**
 * Show current emotion state
 */
export function emotionState() {
  if (!window.emotionAnalyzer) {
    console.error('❌ EmotionAnalyzer not initialized');
    return;
  }

  const state = window.emotionAnalyzer.getState();

  console.log('\n🎭 Current Emotion State');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Affect Level:', state.currentAffect.toFixed(2), '/', '3.00');
  console.log('  Video State:', state.videoState, '→', ['Sad', 'Neutral-Sad', 'Neutral', 'Happy'][state.videoState]);
  console.log('  Messages Analyzed:', state.messageCount);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return state;
}

/**
 * Show message history with sentiment
 */
export function emotionHistory() {
  if (!window.emotionAnalyzer) {
    console.error('❌ EmotionAnalyzer not initialized');
    return;
  }

  const state = window.emotionAnalyzer.getState();

  console.log('\n📜 Message History');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (state.recentMessages.length === 0) {
    console.log('  No messages yet');
  } else {
    state.recentMessages.forEach((msg, idx) => {
      const emoji = parseFloat(msg.sentiment) < -0.1 ? '😢' :
                    parseFloat(msg.sentiment) > 0.1 ? '😊' : '😐';
      console.log(`  ${idx + 1}. [${msg.timestamp}] ${emoji} ${msg.sentiment}`);
      console.log(`     "${msg.text}"`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return state.recentMessages;
}

/**
 * Run a sequence of test messages
 */
export function testSequence(category = 'sad', delayMs = 2000) {
  if (!window.emotionAnalyzer) {
    console.error('❌ EmotionAnalyzer not initialized');
    return;
  }

  const messages = TEST_MESSAGES[category];
  if (!messages) {
    console.error(`❌ Unknown category: ${category}`);
    console.log('Available categories:', Object.keys(TEST_MESSAGES).join(', '));
    return;
  }

  console.log(`\n🎬 Running test sequence: "${category}"`);
  console.log(`   ${messages.length} messages with ${delayMs}ms delay\n`);

  messages.forEach((msg, idx) => {
    setTimeout(() => {
      console.log(`\n[${idx + 1}/${messages.length}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      testEmotion(msg);
    }, idx * delayMs);
  });
}

/**
 * Test gradual progression from sad to happy
 */
export function testProgression(delayMs = 3000) {
  console.log('\n🌈 Testing gradual emotion progression...\n');

  const sequence = [
    ...TEST_MESSAGES.verySad.slice(0, 2),
    ...TEST_MESSAGES.sad.slice(0, 2),
    ...TEST_MESSAGES.neutral.slice(0, 2),
    ...TEST_MESSAGES.slightlyPositive.slice(0, 2),
    ...TEST_MESSAGES.positive.slice(0, 2)
  ];

  sequence.forEach((msg, idx) => {
    setTimeout(() => {
      console.log(`\n[Step ${idx + 1}/${sequence.length}] ━━━━━━━━━━━━━━━━━━━━━━━━`);
      testEmotion(msg);
    }, idx * delayMs);
  });
}

/**
 * Reset emotion state
 */
export function resetEmotion() {
  if (!window.emotionAnalyzer) {
    console.error('❌ EmotionAnalyzer not initialized');
    return;
  }

  window.emotionAnalyzer.reset();
  console.log('✅ Emotion state reset to baseline (1.0)');
}

/**
 * Show visual affect meter
 */
export function affectMeter() {
  if (!window.emotionAnalyzer) {
    console.error('❌ EmotionAnalyzer not initialized');
    return;
  }

  const affect = window.emotionAnalyzer.currentAffect;
  const percentage = ((affect - 1.0) / 2.0) * 100; // Map 1-3 to 0-100%
  const filledBlocks = Math.round(percentage / 5); // 20 blocks total
  const emptyBlocks = 20 - filledBlocks;

  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  const emoji = affect < 1.5 ? '😢' : affect < 2.0 ? '😐' : affect < 2.5 ? '🙂' : '😊';

  console.log('\n📊 Affect Meter');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${emoji} ${bar} ${affect.toFixed(2)}/3.00`);
  console.log(`  Sad ←                    → Happy`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Expose utilities globally for console access
if (typeof window !== 'undefined') {
  window.testEmotion = testEmotion;
  window.emotionState = emotionState;
  window.emotionHistory = emotionHistory;
  window.testSequence = testSequence;
  window.testProgression = testProgression;
  window.resetEmotion = resetEmotion;
  window.affectMeter = affectMeter;
  window.TEST_MESSAGES = TEST_MESSAGES;

  // console.log(`
  // ╔════════════════════════════════════════════════╗
  // ║   🎭 Emotion Analyzer Debug Tools Loaded      ║
  // ╠════════════════════════════════════════════════╣
  // ║                                                ║
  // ║  testEmotion("message")  - Test single message ║
  // ║  emotionState()          - Show current state  ║
  // ║  emotionHistory()        - Show message log    ║
  // ║  affectMeter()           - Visual affect bar   ║
  // ║  testSequence("sad")     - Test message series ║
  // ║  testProgression()       - Test sad→happy flow ║
  // ║  resetEmotion()          - Reset to baseline   ║
  // ║                                                ║
  // ║  Categories: verySad, sad, neutral,            ║
  // ║              slightlyPositive, positive        ║
  // ╚════════════════════════════════════════════════╝
  // `);
}

export default {
  testEmotion,
  emotionState,
  emotionHistory,
  testSequence,
  testProgression,
  resetEmotion,
  affectMeter,
  TEST_MESSAGES
};
