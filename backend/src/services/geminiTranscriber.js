const fs = require('fs').promises;
const path = require('path');

class GeminiTranscriber {
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
   * Transcribe an audio file using Gemini API
   * @param {string} audioFilePath - Path to the audio file
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioFilePath) {
    console.log('[GeminiTranscriber] Reading audio file...');
    const audioBuffer = await fs.readFile(audioFilePath);
    const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`[GeminiTranscriber] Audio file size: ${fileSizeMB} MB`);

    const client = await this.getClient();
    const { createUserContent, createPartFromUri } = this.genaiModule;
    const startTime = Date.now();

    try {
      // Upload the audio file to Gemini
      console.log('[GeminiTranscriber] Uploading audio to Gemini...');
      const uploadedFile = await client.files.upload({
        file: audioFilePath,
        config: { mimeType: 'audio/mpeg' }
      });

      console.log('[GeminiTranscriber] File uploaded, generating transcript...');

      // Generate transcript
      const result = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
          'Generate a complete transcript of this podcast episode. Include all spoken words accurately. Do not summarize - transcribe everything that is said.'
        ])
      });

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[GeminiTranscriber] Transcription complete in ${elapsedTime}s`);

      // Extract text from response
      const transcript = result.text || result.response?.text();

      if (!transcript) {
        console.log('[GeminiTranscriber] Response:', JSON.stringify(result).substring(0, 500));
        throw new Error('No transcript returned from Gemini API');
      }

      console.log(`[GeminiTranscriber] Transcript length: ${transcript.length} characters`);
      return transcript;

    } catch (error) {
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[GeminiTranscriber] API error after ${elapsedTime}s:`, error.message);

      // Handle specific error cases
      if (error.message?.includes('API key')) {
        throw new Error('Invalid Google AI API key. Get one at https://aistudio.google.com/apikey');
      }
      if (error.message?.includes('quota')) {
        throw new Error('Google AI API quota exceeded. Check your usage at https://aistudio.google.com');
      }

      throw error;
    }
  }
}

module.exports = GeminiTranscriber;
