/**
 * EmotionAnalyzer - Sentiment-based affect tracking for Sad Robot
 *
 * Uses browser-compatible sentiment analysis with custom lexicon
 * for pizza-shop employee context. Manages gradual affect transitions
 * and maps to video states.
 */

class EmotionAnalyzer {
  constructor() {
    // State management
    this.currentAffect = 0.0;           // Start at baseline (sad)

    console.log('[EmotionAnalyzer] Initialized with OpenAI sentiment analysis');
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
      console.log("-- OpenAI Sentiment Analysis Result:", data);

      const words = text.toLowerCase().match(/\b\w+\b/g) || [];

      return {
        score: sentiment, // Scale to approximate -5 to +5 range
        wordCount: words.length,
        tokens: words,
        positive: sentiment > 0 ? ['positive'] : [],
        negative: sentiment < 0 ? ['negative'] : []
      };
    } catch (error) {
      // No fallback - throw error to make API failures visible
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Update affect score based on new message
   * Returns: { currentAffect, targetAffect, change, videoState, analysis }
   */
  async updateAffectScore(text) {

    // Affect update algorithm has following properties:
    // - Only positive sentiment increases affect (robot gets happier)
    // - Negative sentiment does not decrease affect (robot does not get sadder)
    // - Each message influences affect by up to 0.5 (openAI score is between -1 and 1, we multiply by 0.5)
    const analysis = await this.analyzeText(text);
    this.currentAffect += Math.max(0, analysis.score * 0.5);

    return {
      currentAffect: this.currentAffect,
      analysis: analysis
    };
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
      sentiment: result.analysis.sentiment,
      positive: result.analysis.positive,
      negative: result.analysis.negative,
      currentAffect: result.currentAffect.toFixed(2),
    });

    return result;
  }

  /**
   * Get current state for debugging/logging
   */
  getState() {
    return {
      currentAffect: this.currentAffect
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
