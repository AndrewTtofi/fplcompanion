const axios = require('axios');
const redisClient = require('../config/redis');

const FPL_BASE_URL = process.env.FPL_API_BASE_URL || 'https://fantasy.premierleague.com/api';
const NEWS_EVENTS_TTL_DAYS = 7;

class NewsProcessor {
  constructor() {
    this.isProcessing = false;
    this.axiosInstance = axios.create({
      baseURL: FPL_BASE_URL,
      timeout: 10000,
      headers: { 'User-Agent': 'FPL-Companion/1.0' }
    });
  }

  /**
   * Fetch fresh bootstrap data directly (bypass cache for accurate diffing)
   */
  async _fetchBootstrap() {
    const response = await this.axiosInstance.get('/bootstrap-static/');
    return response.data;
  }

  /**
   * Extract news-relevant fields from all players
   */
  _extractSnapshot(elements) {
    const snapshot = {};
    for (const player of elements) {
      if (player.news || player.chance_of_playing_next_round !== null) {
        snapshot[player.id] = {
          news: player.news || '',
          news_added: player.news_added || null,
          status: player.status,
          chance_of_playing_next_round: player.chance_of_playing_next_round,
          chance_of_playing_this_round: player.chance_of_playing_this_round,
        };
      }
    }
    return snapshot;
  }

  /**
   * Compare two snapshots and return change events
   */
  _detectChanges(prevSnapshot, currentSnapshot, elements, teams) {
    const events = [];
    const playerMap = {};
    for (const p of elements) {
      playerMap[p.id] = p;
    }

    // Check for new/updated news
    for (const [idStr, current] of Object.entries(currentSnapshot)) {
      const id = parseInt(idStr);
      const prev = prevSnapshot[id];
      const player = playerMap[id];
      if (!player) continue;

      const team = teams.find(t => t.id === player.team);
      let changeType = null;

      if (!prev && current.news) {
        changeType = 'NEW_NEWS';
      } else if (prev && current.news && (prev.news !== current.news || prev.news_added !== current.news_added)) {
        changeType = 'UPDATED_NEWS';
      } else if (prev && prev.news && !current.news) {
        changeType = 'CLEARED_NEWS';
      }

      if (changeType) {
        events.push({
          id: `${id}-${Date.now()}`,
          player_id: id,
          player_name: `${player.first_name} ${player.second_name}`,
          web_name: player.web_name,
          team_id: player.team,
          team_short: team?.short_name || 'N/A',
          change_type: changeType,
          old_news: prev?.news || '',
          new_news: current.news,
          old_status: prev?.status || null,
          new_status: current.status,
          chance_of_playing_next_round: current.chance_of_playing_next_round,
          chance_of_playing_this_round: current.chance_of_playing_this_round,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check for players who had news but are no longer in the current snapshot
    for (const [idStr, prev] of Object.entries(prevSnapshot)) {
      const id = parseInt(idStr);
      if (!currentSnapshot[id] && prev.news) {
        const player = playerMap[id];
        if (!player) continue;
        const team = teams.find(t => t.id === player.team);
        events.push({
          id: `${id}-${Date.now()}`,
          player_id: id,
          player_name: `${player.first_name} ${player.second_name}`,
          web_name: player.web_name,
          team_id: player.team,
          team_short: team?.short_name || 'N/A',
          change_type: 'CLEARED_NEWS',
          old_news: prev.news,
          new_news: '',
          old_status: prev.status,
          new_status: player.status,
          chance_of_playing_next_round: player.chance_of_playing_next_round,
          chance_of_playing_this_round: player.chance_of_playing_this_round,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return events;
  }

  /**
   * Main processing method — fetch, diff, store
   */
  async processNewsChanges() {
    if (this.isProcessing) {
      return { changesDetected: 0, skipped: true };
    }

    this.isProcessing = true;
    try {
      const bootstrap = await this._fetchBootstrap();
      const currentSnapshot = this._extractSnapshot(bootstrap.elements);

      // Load previous snapshot
      const prevRaw = await redisClient.get('fpl:news:snapshot');
      const prevSnapshot = prevRaw ? JSON.parse(prevRaw) : null;

      // First run — seed snapshot silently
      if (!prevSnapshot) {
        await redisClient.set('fpl:news:snapshot', JSON.stringify(currentSnapshot));
        await redisClient.set('fpl:news:last_checked', new Date().toISOString());
        return { changesDetected: 0, isInitialRun: true };
      }

      // Detect changes
      const events = this._detectChanges(prevSnapshot, currentSnapshot, bootstrap.elements, bootstrap.teams);

      // Store events in sorted set
      if (events.length > 0) {
        const members = events.map(event => ({
          score: Date.now(),
          value: JSON.stringify(event),
        }));
        await redisClient.zAdd('fpl:news:events', members);
      }

      // Prune old events (older than 7 days)
      const cutoff = Date.now() - (NEWS_EVENTS_TTL_DAYS * 24 * 60 * 60 * 1000);
      await redisClient.zRemRangeByScore('fpl:news:events', '-inf', cutoff);

      // Save new snapshot
      await redisClient.set('fpl:news:snapshot', JSON.stringify(currentSnapshot));
      await redisClient.set('fpl:news:last_checked', new Date().toISOString());

      return { changesDetected: events.length };
    } catch (error) {
      console.error(`[NewsProcessor] Error processing news changes: ${error.message}`);
      // Update last_checked even on error so the UI knows we tried
      try {
        await redisClient.set('fpl:news:last_checked', new Date().toISOString());
      } catch (_) { /* ignore */ }
      return { changesDetected: 0, error: error.message };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all news events, optionally since a timestamp
   */
  async getNewsEvents(sinceTimestamp = null) {
    const min = sinceTimestamp ? new Date(sinceTimestamp).getTime().toString() : '-inf';
    const raw = await redisClient.zRangeByScore('fpl:news:events', min, '+inf');
    return (raw || []).map(e => JSON.parse(e)).reverse(); // newest first
  }

  /**
   * Get news events filtered to specific player IDs
   */
  async getNewsEventsForPlayers(playerIds, sinceTimestamp = null) {
    const allEvents = await this.getNewsEvents(sinceTimestamp);
    const idSet = new Set(playerIds);
    return allEvents.filter(e => idSet.has(e.player_id));
  }

  /**
   * Get the last time news was checked
   */
  async getLastChecked() {
    return await redisClient.get('fpl:news:last_checked');
  }
}

const newsProcessor = new NewsProcessor();
module.exports = newsProcessor;
