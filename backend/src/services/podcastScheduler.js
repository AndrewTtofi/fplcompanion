const cron = require('node-cron');
const podcastProcessor = require('./podcastProcessor');

/**
 * Podcast Scheduler Service
 * Schedules periodic checks for new podcast episodes using node-cron.
 * Runs at 12:00 PM, 4:00 PM, and 6:00 PM daily.
 */
class PodcastScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Format current time for logging
   */
  _getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Execute a scheduled podcast check
   */
  async _runScheduledCheck(scheduleName) {
    console.log(`[PodcastScheduler] ${this._getTimestamp()} - Running ${scheduleName} check...`);

    try {
      // First check if processing is needed (avoids unnecessary work)
      const { needsProcessing, episode, error } = await podcastProcessor.needsProcessing();

      if (error) {
        console.error(`[PodcastScheduler] ${this._getTimestamp()} - Error checking for new episode: ${error}`);
        return;
      }

      if (!needsProcessing) {
        console.log(`[PodcastScheduler] ${this._getTimestamp()} - No new episode found, skipping processing`);
        return;
      }

      console.log(`[PodcastScheduler] ${this._getTimestamp()} - New episode detected: ${episode.title}`);

      // Process the new episode
      const result = await podcastProcessor.processLatestEpisode();

      if (result) {
        console.log(`[PodcastScheduler] ${this._getTimestamp()} - Successfully processed: ${result.episode.title}`);
      }
    } catch (err) {
      console.error(`[PodcastScheduler] ${this._getTimestamp()} - Scheduled check failed: ${err.message}`);
    }
  }

  /**
   * Start all scheduled cron jobs
   * Schedule: 12:00 PM, 4:00 PM, 6:00 PM daily
   */
  start() {
    if (this.isRunning) {
      console.log('[PodcastScheduler] Scheduler already running');
      return;
    }

    // Afternoon check at 4:00 PM
    const afternoonJob = cron.schedule('0 16 * * *', () => {
      this._runScheduledCheck('afternoon (4:00 PM)');
    }, {
      timezone: 'Europe/London'
    });
    this.jobs.push(afternoonJob);

    // Lunch check at 12:00 PM
    const lunchJob = cron.schedule('0 12 * * *', () => {
      this._runScheduledCheck('lunch (12:00 PM)');
    }, {
      timezone: 'Europe/London'
    });
    this.jobs.push(lunchJob);

    // Evening check at 6:00 PM
    const eveningJob = cron.schedule('0 18 * * *', () => {
      this._runScheduledCheck('evening (6:00 PM)');
    }, {
      timezone: 'Europe/London'
    });
    this.jobs.push(eveningJob);

    this.isRunning = true;
    console.log('[PodcastScheduler] Scheduled podcast checks at 12:00 PM, 4:00 PM, and 6:00 PM (Europe/London)');
  }

  /**
   * Stop all scheduled cron jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('[PodcastScheduler] Scheduler not running');
      return;
    }

    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('[PodcastScheduler] All scheduled jobs stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length,
      schedule: this.isRunning ? ['12:00 PM', '4:00 PM', '6:00 PM'] : []
    };
  }
}

// Singleton instance
const podcastScheduler = new PodcastScheduler();

module.exports = podcastScheduler;
