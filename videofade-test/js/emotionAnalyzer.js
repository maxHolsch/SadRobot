/**
 * EmotionAnalyzer - Sentiment-based affect tracking for Sad Robot
 *
 * Uses browser-compatible sentiment analysis with custom lexicon
 * for pizza-shop employee context. Manages gradual affect transitions
 * and maps to video states.
 */

// Note: Sentiment library will be loaded via script tag in index.html
// Access it via window.Sentiment

// Custom lexicon extensions for pizza-shop context
const CUSTOM_LEXICON = {
  // Work/job related
  'work': -1,
  'job': -1,
  'shift': -1,
  'boss': -2,
  'customer': -1,
  'customers': -1,
  'pizza': 0,  // Neutral - just part of the environment
  'pizzas': 0,
  'dough': -1,
  'overtime': -2,
  'busy': -1,
  'slow': -1,
  'tips': 1,

  // Feelings about situation
  'stuck': -3,
  'trapped': -3,
  'meaningless': -3,
  'pointless': -3,
  'nowhere': -2,
  'dead-end': -3,
  'monotonous': -2,
  'repetitive': -2,
  'boring': -2,
  'unfulfilling': -2,

  // Positive improvements
  'better': 2,
  'improving': 2,
  'hopeful': 2,
  'plan': 1,
  'plans': 1,
  'change': 1,
  'different': 1,
  'new': 1,
  'opportunity': 2,
  'interesting': 2,

  // Social
  'friend': 2,
  'friends': 2,
  'lonely': -2,
  'alone': -2,
  'talking': 1,
  'chat': 1,
  'listen': 1,
  'listening': 1,

  // Intensifiers (Eric is understated)
  'kinda': 0.8,
  'sorta': 0.8,
  'maybe': 0.5,
  'guess': 0.5,
  'whatever': -1,
  'meh': -1,
};

// Phrase patterns that indicate sentiment shifts
const PHRASE_PATTERNS = [
  { pattern: /not (bad|terrible|awful|horrible)/i, modifier: 3 },  // "not bad" = positive
  { pattern: /getting better/i, modifier: 2 },
  { pattern: /things are looking up/i, modifier: 3 },
  { pattern: /same old/i, modifier: -1 },
  { pattern: /nothing new/i, modifier: -1 },
  { pattern: /another day/i, modifier: -1 },
  { pattern: /i guess|i suppose/i, modifier: -0.5 },  // Hedging = slight negative
  { pattern: /been thinking about/i, modifier: 1 },  // Reflection = slight positive
  { pattern: /dead end job/i, modifier: -3 },
  { pattern: /waste of time/i, modifier: -2 },
];

class EmotionAnalyzer {
  constructor() {
    // Initialize Sentiment with custom lexicon
    // Wait for Sentiment to be loaded from CDN
    if (typeof window.Sentiment === 'undefined') {
      console.warn('[EmotionAnalyzer] Sentiment library not loaded yet, will use fallback');
      this.sentiment = null;
    } else {
      this.sentiment = new window.Sentiment();
      this.sentiment.registerLanguage('en-pizzashop', {
        labels: CUSTOM_LEXICON
      });
    }

    // State management
    this.currentAffect = 0.0;           // Start at baseline (sad)
    this.messageHistory = [];           // Store last 5 messages with analysis
    this.maxTransitionSpeed = 0.35;     // Max change per message (prevents 1→3 jumps)
    this.minAffect = 0.0;               // Sad state
    this.maxAffect = 3.0;               // Happy state

    // Decay settings - affect slowly returns to baseline over time
    this.decayEnabled = true;
    this.decayRate = 0.02;              // Slow drift back toward baseline
    this.baselineAffect = 0.0;          // Natural baseline (very sad)
    this.lastDecayTime = Date.now();

    console.log('[EmotionAnalyzer] Initialized with Sentiment.js + custom pizza-shop lexicon');
  }

  /**
   * Fallback sentiment analyzer using simple lexicon matching
   */
  fallbackAnalyze(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let score = 0;
    const positive = [];
    const negative = [];

    // Simple lexicon (basic AFINN-like)
    const simpleLexicon = {
      ...CUSTOM_LEXICON,
      'good': 3, 'great': 3, 'happy': 3, 'love': 3, 'wonderful': 4, 'excellent': 4,
      'bad': -3, 'hate': -3, 'terrible': -4, 'awful': -3, 'horrible': -3, 'worst': -3,
      'sad': -2, 'angry': -3, 'upset': -2, 'disappointed': -2, 'frustrated': -2,
      'better': 2, 'best': 3, 'nice': 2, 'fine': 1, 'okay': 1, 'ok': 1,
      'worse': -2, 'boring': -2, 'dull': -1, 'tired': -1
    };

    words.forEach(word => {
      if (simpleLexicon[word]) {
        score += simpleLexicon[word];
        if (simpleLexicon[word] > 0) positive.push(word);
        else negative.push(word);
      }
    });

    return {
      score: score,
      comparative: words.length > 0 ? score / words.length : 0,
      tokens: words,
      positive: positive,
      negative: negative
    };
  }

  /**
   * Analyze text sentiment using OpenAI API
   */
  async analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return { score: 0, comparative: 0, wordCount: 0, tokens: [] };
    }

    try {
      // Call our server endpoint for sentiment analysis
      const response = await fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Sentiment API error: ${response.status}`);
      }

      const data = await response.json();
      const sentiment = data.sentiment; // This is already a number between -1 and 1

      // Check for phrase patterns (keep existing pattern matching as bonus)
      let phraseModifier = 0;
      for (const { pattern, modifier } of PHRASE_PATTERNS) {
        if (pattern.test(text)) {
          phraseModifier += modifier;
        }
      }

      // Combined score
      const combinedScore = sentiment + (phraseModifier * 0.05);

      const words = text.toLowerCase().match(/\b\w+\b/g) || [];

      return {
        score: sentiment * 5, // Scale to approximate -5 to +5 range
        comparative: sentiment,
        combinedScore: combinedScore,
        wordCount: words.length,
        tokens: words,
        positive: sentiment > 0 ? ['positive'] : [],
        negative: sentiment < 0 ? ['negative'] : [],
        phraseModifier: phraseModifier
      };
    } catch (error) {
      console.error('[EmotionAnalyzer] Error calling sentiment API:', error);
      // Fallback to simple analysis if API fails
      const fallbackResult = this.fallbackAnalyze(text);

      // Check for phrase patterns
      let phraseModifier = 0;
      for (const { pattern, modifier } of PHRASE_PATTERNS) {
        if (pattern.test(text)) {
          phraseModifier += modifier;
        }
      }

      const combinedScore = fallbackResult.comparative + (phraseModifier * 0.1);

      return {
        score: fallbackResult.score,
        comparative: fallbackResult.comparative,
        combinedScore: combinedScore,
        wordCount: fallbackResult.tokens.length,
        tokens: fallbackResult.tokens,
        positive: fallbackResult.positive,
        negative: fallbackResult.negative,
        phraseModifier: phraseModifier
      };
    }
  }

  /**
   * Update affect score based on new message
   * Returns: { currentAffect, targetAffect, change, videoState, analysis }
   */
  async updateAffectScore(text) {
    const analysis = await this.analyzeText(text);

    // Store in history
    this.messageHistory.push({
      text: text.substring(0, 100),
      analysis: analysis,
      timestamp: Date.now(),
      affectBefore: this.currentAffect
    });

    // Keep only last 5 messages
    if (this.messageHistory.length > 5) {
      this.messageHistory.shift();
    }

    // Calculate weighted average of recent messages
    // More recent messages have higher weight (exponential decay)
    let weightedSum = 0;
    let totalWeight = 0;

    this.messageHistory.forEach((msg, idx) => {
      const recency = idx + 1; // 1, 2, 3, 4, 5
      const weight = Math.pow(1.5, recency); // Exponential: 1.5, 2.25, 3.375, 5.06, 7.59
      weightedSum += msg.analysis.combinedScore * weight;
      totalWeight += weight;
    });

    const avgRecentSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Map sentiment comparative score to affect range (1-3)
    // Sentiment comparative is typically -0.5 to +0.5 for normal conversation
    // Map: -0.5 → 1.0 (sad), 0 → 2.0 (neutral), +0.5 → 3.0 (happy)
    const sentimentRange = 0.5; // Expected range
    const targetAffect = 2.0 + (avgRecentSentiment / sentimentRange);
    const clampedTarget = Math.max(this.minAffect, Math.min(this.maxAffect, targetAffect));

    // Apply gradual transition with max speed limit
    const difference = clampedTarget - this.currentAffect;
    const change = Math.sign(difference) * Math.min(Math.abs(difference), this.maxTransitionSpeed);

    this.currentAffect += change;
    this.currentAffect = Math.max(this.minAffect, Math.min(this.maxAffect, this.currentAffect));

    // Update decay timer
    this.lastDecayTime = Date.now();

    const videoState = this.getVideoStateIndex();

    return {
      currentAffect: this.currentAffect,
      targetAffect: clampedTarget,
      change: change,
      videoState: videoState,
      analysis: analysis,
      avgRecentSentiment: avgRecentSentiment
    };
  }

  /**
   * Apply decay - slowly drift back to baseline over time
   * Call this periodically (e.g., on video loop events)
   */
  applyDecay() {
    if (!this.decayEnabled) return;

    const now = Date.now();
    const timeSinceLastMessage = now - this.lastDecayTime;

    // Only decay if no messages for 10+ seconds
    if (timeSinceLastMessage < 10000) return;

    // Drift toward baseline
    const difference = this.baselineAffect - this.currentAffect;
    const decay = Math.sign(difference) * this.decayRate;

    this.currentAffect += decay;
    this.currentAffect = Math.max(this.minAffect, Math.min(this.maxAffect, this.currentAffect));

    console.log('[EmotionAnalyzer] Applied decay:', {
      currentAffect: this.currentAffect.toFixed(2),
      baseline: this.baselineAffect,
      timeSinceLastMessage: (timeSinceLastMessage / 1000).toFixed(1) + 's'
    });
  }

  /**
   * Map affect score to video playlist index
   * 1.0-1.5 → 0 (sad_long.mp4)
   * 1.5-2.0 → 1 (neutral)
   * 2.0-2.5 → 2 (neutral)
   * 2.5-3.0 → 3 (happier)
   */
  getVideoStateIndex() {
    const affect = this.currentAffect;

    if (affect < 1.5) return 0;      // Sad
    if (affect < 2.0) return 1;      // Slightly less sad / neutral-sad
    if (affect < 2.5) return 2;      // Neutral / slightly positive
    return 3;                         // Happy
  }

  /**
   * Main entry point - called when robot message arrives
   */
  async storeMessage(text) {
    if (!text || typeof text !== 'string') {
      console.warn('[EmotionAnalyzer] Invalid message text:', text);
      return null;
    }

    const result = await this.updateAffectScore(text);

    console.log('[EmotionAnalyzer] Message analyzed:', {
      text: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
      sentiment: result.analysis.combinedScore.toFixed(3),
      positive: result.analysis.positive,
      negative: result.analysis.negative,
      currentAffect: result.currentAffect.toFixed(2),
      targetAffect: result.targetAffect.toFixed(2),
      change: result.change.toFixed(3),
      videoState: result.videoState
    });

    // Trigger video transition if needed
    if (window.videoMixer) {
      const currentVideoState = window.videoMixer.currentIndex();
      if (currentVideoState !== result.videoState) {
        console.log(`[EmotionAnalyzer] Triggering video transition: ${currentVideoState} → ${result.videoState}`);
        window.videoMixer.goTo(result.videoState, { durationMs: 1500 });
      }
    }

    return result;
  }

  /**
   * Get current state for debugging/logging
   */
  getState() {
    return {
      currentAffect: this.currentAffect,
      videoState: this.getVideoStateIndex(),
      messageCount: this.messageHistory.length,
      recentMessages: this.messageHistory.map(m => ({
        text: m.text,
        sentiment: m.analysis.combinedScore.toFixed(3),
        timestamp: new Date(m.timestamp).toLocaleTimeString()
      }))
    };
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.currentAffect = 1.0;
    this.messageHistory = [];
    this.lastDecayTime = Date.now();
    console.log('[EmotionAnalyzer] Reset to initial state');
  }
}

export default EmotionAnalyzer;
