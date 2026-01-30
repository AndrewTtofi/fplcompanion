class InsightExtractor {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
    this.client = null;
    this.genaiModule = null;
  }

  /**
   * Initialize the Google AI client (lazy load ES module)
   */
  async getClient() {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
      }
      // Dynamic import for ES module
      if (!this.genaiModule) {
        this.genaiModule = await import('@google/genai');
      }
      const { GoogleGenAI } = this.genaiModule;
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  /**
   * Extract structured insights from podcast transcript using Gemini
   * @param {string} transcript - The podcast transcript
   * @returns {Promise<Object>} - Structured insights
   */
  async extractInsights(transcript) {
    console.log('[InsightExtractor] Extracting insights from transcript...');
    const startTime = Date.now();

    const client = await this.getClient();
    const { createUserContent } = this.genaiModule;

    const prompt = `You are an FPL (Fantasy Premier League) expert assistant. Analyze this podcast transcript and extract actionable insights.

INSTRUCTIONS:
1. Identify all presenters/hosts dynamically (don't assume names, extract them from the transcript)
2. For each presenter, extract:
   - Players they recommend transferring IN (with reasons)
   - Players they recommend transferring OUT or selling (with reasons)
   - Their captaincy recommendations (primary pick and differential/alternative)
   - Their chip strategy advice (wildcard, bench boost, triple captain, free hit)
3. Rate confidence level (high/medium/low) based on how strongly they recommend each transfer
4. Generate a consensus summary highlighting what multiple presenters agree on

Return ONLY valid JSON in this exact structure (no markdown, no code blocks):
{
  "presenters": [
    {
      "name": "Presenter Name",
      "insights": {
        "transfersIn": [
          {
            "playerName": "Player Full Name",
            "team": "Team Name",
            "reason": "Why they recommend this player",
            "confidence": "high|medium|low"
          }
        ],
        "transfersOut": [
          {
            "playerName": "Player Full Name",
            "team": "Team Name",
            "reason": "Why they recommend selling",
            "confidence": "high|medium|low"
          }
        ],
        "captaincy": {
          "primary": {
            "playerName": "Player Name",
            "reason": "Why this is the main captain pick"
          },
          "differential": {
            "playerName": "Player Name",
            "reason": "Alternative/differential captain choice"
          }
        },
        "chipStrategy": {
          "recommendation": "Overall chip strategy summary",
          "chips": [
            {
              "chip": "wildcard|bench_boost|triple_captain|free_hit",
              "advice": "When and how to use this chip"
            }
          ]
        }
      }
    }
  ],
  "consensus": {
    "topTransfersIn": ["Player names that multiple presenters recommend"],
    "topTransfersOut": ["Player names that multiple presenters want to sell"],
    "captainFavorite": "Most popular captain choice",
    "keyAdvice": ["Important points that multiple presenters agree on"]
  }
}

TRANSCRIPT:
${transcript}

Remember: Return ONLY the JSON object, nothing else.`;

    try {
      const result = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: createUserContent(prompt),
        config: {
          temperature: 0.2, // Lower temperature for more consistent structured output
          responseMimeType: 'application/json'
        }
      });

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[InsightExtractor] Insights extracted in ${elapsedTime}s`);

      // Extract JSON from response
      let insightsText = result.text || result.response?.text();

      if (!insightsText) {
        console.log('[InsightExtractor] Response:', JSON.stringify(result).substring(0, 500));
        throw new Error('No insights returned from Gemini API');
      }

      // Clean up response - remove markdown code blocks if present
      insightsText = insightsText.trim();
      if (insightsText.startsWith('```json')) {
        insightsText = insightsText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (insightsText.startsWith('```')) {
        insightsText = insightsText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      // Parse JSON
      const insights = JSON.parse(insightsText);

      // Validate structure
      if (!insights.presenters || !Array.isArray(insights.presenters)) {
        throw new Error('Invalid insights structure: missing presenters array');
      }

      console.log(`[InsightExtractor] Extracted insights for ${insights.presenters.length} presenter(s)`);
      return insights;

    } catch (error) {
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[InsightExtractor] Error after ${elapsedTime}s:`, error.message);

      // Handle specific error cases
      if (error.message?.includes('API key')) {
        throw new Error('Invalid Google AI API key. Get one at https://aistudio.google.com/apikey');
      }
      if (error.message?.includes('quota')) {
        throw new Error('Google AI API quota exceeded. Check your usage at https://aistudio.google.com');
      }
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse insights JSON from Gemini response');
      }

      throw error;
    }
  }
}

module.exports = InsightExtractor;
