const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

class PodcastDownloader {
  constructor() {
    this.parser = new Parser();
    this.rssUrl = 'https://audioboom.com/channels/5001585.rss';
    this.tempDir = path.join(__dirname, '../../temp/audio');
  }

  /**
   * Get the latest FPL Podcast episode from Audioboom RSS feed
   */
  async getLatestEpisode() {
    console.log('[PodcastDownloader] Fetching RSS feed...');
    const feed = await this.parser.parseURL(this.rssUrl);

    if (!feed.items || feed.items.length === 0) {
      throw new Error('No episodes found in RSS feed');
    }

    // Get the first (latest) episode
    const episode = feed.items[0];

    const audioUrl = episode.enclosure?.url;
    if (!audioUrl) {
      throw new Error('No audio URL found for episode');
    }

    return {
      title: episode.title,
      pubDate: episode.pubDate,
      audioUrl: audioUrl,
      duration: episode.itunes?.duration || null,
      episodeId: this.generateEpisodeId(episode)
    };
  }

  /**
   * Generate a unique episode ID from the episode data
   */
  generateEpisodeId(episode) {
    // Use guid if available, otherwise create from title and date
    if (episode.guid) {
      // Extract just the numeric part if it's a URL
      const match = episode.guid.match(/(\d+)/);
      return match ? match[1] : episode.guid.replace(/[^a-zA-Z0-9]/g, '_');
    }
    const dateStr = new Date(episode.pubDate).toISOString().split('T')[0];
    return `${dateStr}_${episode.title.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * Download audio file from URL
   */
  async downloadAudio(audioUrl, episodeId) {
    console.log(`[PodcastDownloader] Downloading audio for episode ${episodeId}...`);

    // Ensure temp directory exists
    await fsPromises.mkdir(this.tempDir, { recursive: true });

    const filePath = path.join(this.tempDir, `${episodeId}.mp3`);

    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
      timeout: 300000 // 5 minute timeout for large files
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`[PodcastDownloader] Download complete: ${filePath}`);
        resolve(filePath);
      });
      writer.on('error', (err) => {
        console.error('[PodcastDownloader] Download failed:', err.message);
        reject(err);
      });
    });
  }

  /**
   * Clean up downloaded audio file
   */
  async cleanup(filePath) {
    try {
      await fsPromises.unlink(filePath);
      console.log(`[PodcastDownloader] Cleaned up: ${filePath}`);
    } catch (err) {
      // File may already be removed
      console.log('[PodcastDownloader] Cleanup: file already removed or not found');
    }
  }

  /**
   * Get file size in MB
   */
  async getFileSize(filePath) {
    const stats = await fsPromises.stat(filePath);
    return (stats.size / (1024 * 1024)).toFixed(2);
  }
}

module.exports = PodcastDownloader;
