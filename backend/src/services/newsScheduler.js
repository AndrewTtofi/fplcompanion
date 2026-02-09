const cron = require('node-cron');
const newsProcessor = require('./newsProcessor');
const articlesFetcher = require('./articlesFetcher');

class NewsScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  _getTimestamp() {
    return new Date().toISOString();
  }

  async _runScheduledCheck() {
    console.log(`[NewsScheduler] ${this._getTimestamp()} - Checking for player news changes...`);

    try {
      const result = await newsProcessor.processNewsChanges();

      if (result.isInitialRun) {
        console.log(`[NewsScheduler] ${this._getTimestamp()} - Initial snapshot saved (no events generated)`);
      } else if (result.skipped) {
        console.log(`[NewsScheduler] ${this._getTimestamp()} - Skipped (already processing)`);
      } else {
        console.log(`[NewsScheduler] ${this._getTimestamp()} - Found ${result.changesDetected} news changes`);
      }
    } catch (err) {
      console.error(`[NewsScheduler] ${this._getTimestamp()} - News check failed: ${err.message}`);
    }

    // Also refresh articles cache
    try {
      await articlesFetcher.fetchArticles();
    } catch (err) {
      console.error(`[NewsScheduler] ${this._getTimestamp()} - Articles fetch failed: ${err.message}`);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('[NewsScheduler] Scheduler already running');
      return;
    }

    // Run immediately on startup to seed the snapshot
    this._runScheduledCheck();

    // Then schedule every 15 minutes
    this.job = cron.schedule('*/15 * * * *', () => {
      this._runScheduledCheck();
    }, {
      timezone: 'Europe/London'
    });

    this.isRunning = true;
    console.log('[NewsScheduler] Scheduled news checks every 15 minutes');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    this.isRunning = false;
    console.log('[NewsScheduler] Stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: this.isRunning ? 'Every 15 minutes' : null
    };
  }
}

const newsScheduler = new NewsScheduler();
module.exports = newsScheduler;
