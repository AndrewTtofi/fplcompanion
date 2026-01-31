const PodcastDownloader = require('./podcastDownloader');
const GeminiTranscriber = require('./geminiTranscriber');
const InsightExtractor = require('./insightExtractor');
const redisClient = require('../config/redis');

class PodcastProcessor {
  constructor() {
    this.downloader = new PodcastDownloader();
    this.transcriber = new GeminiTranscriber();
    this.insightExtractor = new InsightExtractor();
    this.isProcessing = false;
    this.status = null;
  }

  /**
   * Check if we need to process a new episode
   * Returns true if there's a new episode that hasn't been transcribed
   */
  async needsProcessing() {
    try {
      const latestEpisode = await this.downloader.getLatestEpisode();
      const cachedTranscript = await redisClient.get('podcast:fpl:transcript');
      const cachedInsights = await redisClient.get('podcast:fpl:insights');

      if (!cachedTranscript || !cachedInsights) {
        return { needsProcessing: true, episode: latestEpisode };
      }

      const cachedData = JSON.parse(cachedTranscript);

      // Check if it's a different episode
      if (cachedData.episode.episodeId !== latestEpisode.episodeId) {
        return { needsProcessing: true, episode: latestEpisode };
      }

      return { needsProcessing: false, episode: latestEpisode };
    } catch (error) {
      console.error('[PodcastProcessor] Error checking for new episode:', error.message);
      return { needsProcessing: false, error: error.message };
    }
  }

  /**
   * Process the latest episode (download + transcribe + cache)
   */
  async processLatestEpisode() {
    if (this.isProcessing) {
      console.log('[PodcastProcessor] Already processing, skipping...');
      return null;
    }

    this.isProcessing = true;
    this.status = 'Starting...';

    try {
      // Step 1: Get latest episode info
      this.status = 'Fetching RSS feed...';
      const episode = await this.downloader.getLatestEpisode();
      console.log(`[PodcastProcessor] Found episode: ${episode.title}`);

      // Check if already processed
      const cachedTranscript = await redisClient.get('podcast:fpl:transcript');
      const cachedInsights = await redisClient.get('podcast:fpl:insights');
      if (cachedTranscript && cachedInsights) {
        const cachedData = JSON.parse(cachedTranscript);
        if (cachedData.episode.episodeId === episode.episodeId) {
          console.log('[PodcastProcessor] Episode already processed, skipping...');
          this.status = 'Already up to date';
          this.isProcessing = false;
          return cachedData;
        }
      }

      // Step 2: Download audio
      this.status = `Downloading: ${episode.title}`;
      console.log(`[PodcastProcessor] Downloading audio...`);
      const audioPath = await this.downloader.downloadAudio(episode.audioUrl, episode.episodeId);
      const fileSize = await this.downloader.getFileSize(audioPath);
      console.log(`[PodcastProcessor] Downloaded: ${fileSize} MB`);

      // Step 3: Transcribe
      this.status = 'Transcribing (this may take several minutes)...';
      console.log('[PodcastProcessor] Starting transcription...');
      const transcript = await this.transcriber.transcribe(audioPath);
      console.log(`[PodcastProcessor] Transcription complete: ${transcript.length} characters`);

      // Step 4: Extract insights from transcript
      this.status = 'Extracting FPL insights...';
      console.log('[PodcastProcessor] Extracting insights...');
      const insights = await this.insightExtractor.extractInsights(transcript);
      console.log(`[PodcastProcessor] Insights extracted for ${insights.presenters?.length || 0} presenter(s)`);

      // Step 5: Cleanup audio file
      await this.downloader.cleanup(audioPath);

      // Step 6: Cache transcript result (overwrite previous - only keep latest)
      const transcriptResult = {
        episode: {
          title: episode.title,
          pubDate: episode.pubDate,
          episodeId: episode.episodeId,
          duration: episode.duration
        },
        transcript: transcript,
        transcriptLength: transcript.length,
        processedAt: new Date().toISOString()
      };

      await redisClient.set(
        'podcast:fpl:transcript',
        JSON.stringify(transcriptResult),
        { EX: 604800 } // 7 days TTL
      );

      // Step 7: Cache insights result (separate key)
      const insightsResult = {
        episode: {
          title: episode.title,
          pubDate: episode.pubDate,
          episodeId: episode.episodeId,
          duration: episode.duration
        },
        insights: insights,
        processedAt: new Date().toISOString()
      };

      await redisClient.set(
        'podcast:fpl:insights',
        JSON.stringify(insightsResult),
        { EX: 604800 } // 7 days TTL
      );

      console.log('[PodcastProcessor] Processing complete, results cached');
      this.status = 'Complete';
      this.isProcessing = false;

      return transcriptResult;

    } catch (error) {
      console.error('[PodcastProcessor] Processing error:', error.message);
      this.status = `Error: ${error.message}`;
      this.isProcessing = false;
      throw error;
    }
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      status: this.status
    };
  }
}

// Singleton instance
const podcastProcessor = new PodcastProcessor();

module.exports = podcastProcessor;
