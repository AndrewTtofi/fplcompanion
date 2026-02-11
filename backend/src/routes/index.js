const express = require('express');
const router = express.Router();
const fplApi = require('../services/fplApi');
const podcastProcessor = require('../services/podcastProcessor');
const redisClient = require('../config/redis');

/**
 * GET /api/bootstrap
 * Get all bootstrap data (players, teams, gameweeks)
 */
router.get('/bootstrap', async (req, res, next) => {
  try {
    const data = await fplApi.getBootstrapStatic();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/team/:id
 * Get team details by ID
 */
router.get('/team/:id', async (req, res, next) => {
  try {
    const teamId = req.params.id;
    const data = await fplApi.getTeamById(teamId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/team/:id/history
 * Get team history (current season and past seasons)
 */
router.get('/team/:id/history', async (req, res, next) => {
  try {
    const teamId = req.params.id;
    const data = await fplApi.getTeamHistory(teamId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/team/:id/picks/:gameweek
 * Get team picks for specific gameweek
 */
router.get('/team/:id/picks/:gameweek', async (req, res, next) => {
  try {
    const { id: teamId, gameweek } = req.params;
    const data = await fplApi.getTeamPicks(teamId, gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gameweek/:id/live
 * Get live gameweek data
 */
router.get('/gameweek/:id/live', async (req, res, next) => {
  try {
    const gameweek = req.params.id;
    const data = await fplApi.getLiveGameweekData(gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gameweek/current
 * Get current gameweek number
 */
router.get('/gameweek/current', async (req, res, next) => {
  try {
    const currentGW = await fplApi.getCurrentGameweek();
    res.json({ current_gameweek: currentGW });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/league/classic/:id
 * Get classic league standings
 */
router.get('/league/classic/:id', async (req, res, next) => {
  try {
    const leagueId = req.params.id;
    const page = req.query.page || 1;
    const data = await fplApi.getClassicLeague(leagueId, page);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/league/classic/:id/live/:gameweek
 * Get live GW points for all teams in a classic league
 */
router.get('/league/classic/:id/live/:gameweek', async (req, res, next) => {
  try {
    const { id: leagueId, gameweek } = req.params;
    const page = req.query.page || 1;
    const data = await fplApi.getLeagueLivePoints(leagueId, gameweek, page);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/league/h2h/:id
 * Get H2H league standings
 */
router.get('/league/h2h/:id', async (req, res, next) => {
  try {
    const leagueId = req.params.id;
    const page = req.query.page || 1;
    const data = await fplApi.getHeadToHeadLeague(leagueId, page);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fixtures
 * GET /api/fixtures?gameweek=X
 * Get fixtures (optionally filtered by gameweek)
 */
router.get('/fixtures', async (req, res, next) => {
  try {
    const gameweek = req.query.gameweek || null;
    const data = await fplApi.getFixtures(gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/player/:id
 * Get player detailed information enriched with bootstrap data
 */
router.get('/player/:id', async (req, res, next) => {
  try {
    const playerId = req.params.id;
    const [detail, bootstrap] = await Promise.all([
      fplApi.getPlayerDetail(playerId),
      fplApi.getBootstrapStatic()
    ]);

    const player = bootstrap.elements.find(p => p.id === parseInt(playerId));
    const team = player ? bootstrap.teams.find(t => t.id === player.team) : null;
    const position = player ? bootstrap.element_types.find(p => p.id === player.element_type) : null;

    const teamMap = {};
    bootstrap.teams.forEach(t => { teamMap[t.id] = t.short_name; });

    // Enrich history with opponent team short names
    const history = (detail.history || []).map(h => ({
      ...h,
      opponent_team_short: teamMap[h.opponent_team] || `T${h.opponent_team}`,
    }));

    // Enrich upcoming fixtures with opponent info
    const playerTeamId = player?.team;
    const fixtures = (detail.fixtures || []).map(f => {
      const isHome = f.team_h === playerTeamId;
      const opponentId = isHome ? f.team_a : f.team_h;
      return {
        ...f,
        is_home: isHome,
        opponent_short: teamMap[opponentId] || `T${opponentId}`,
      };
    });

    res.json({
      ...detail,
      history,
      fixtures,
      player_info: player ? {
        id: player.id,
        web_name: player.web_name,
        first_name: player.first_name,
        second_name: player.second_name,
        team_name: team?.name || '',
        team_short: team?.short_name || '',
        position_name: position?.singular_name_short || '',
        now_cost: player.now_cost / 10,
        selected_by_percent: player.selected_by_percent,
        form: player.form,
        points_per_game: player.points_per_game,
        total_points: player.total_points,
        minutes: player.minutes,
        goals_scored: player.goals_scored,
        assists: player.assists,
        clean_sheets: player.clean_sheets,
        starts: player.starts,
        status: player.status,
        news: player.news,
        chance_of_playing_next_round: player.chance_of_playing_next_round,
        photo: player.photo || null,
        team_code: team?.code || null,
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/player/:playerId/league/:leagueId/ownership
 * Get league ownership data for a player (who owns, starts, benches them)
 */
router.get('/player/:playerId/league/:leagueId/ownership', async (req, res, next) => {
  try {
    const { playerId, leagueId } = req.params;
    const gameweek = req.query.gameweek;
    if (!gameweek) {
      const currentGW = await fplApi.getCurrentGameweek();
      const data = await fplApi.getPlayerLeagueOwnership(playerId, leagueId, currentGW);
      return res.json(data);
    }
    const data = await fplApi.getPlayerLeagueOwnership(playerId, leagueId, gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/players/top/alltime
 * Get highest FPL scorers of all time
 */
router.get('/players/top/alltime', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await fplApi.getGlobalTopPlayersAllTime(limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/players/top/gameweek/:gameweek
 * Get top scorers for a specific gameweek
 */
router.get('/players/top/gameweek/:gameweek', async (req, res, next) => {
  try {
    const gameweek = req.params.gameweek;
    const limit = parseInt(req.query.limit) || 20;
    const data = await fplApi.getGameweekTopPlayers(gameweek, limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/team/:id/overview
 * Get comprehensive team overview with enriched data
 */
router.get('/team/:id/overview', async (req, res, next) => {
  try {
    const teamId = req.params.id;

    // Fetch all required data
    const [team, history, bootstrap] = await Promise.all([
      fplApi.getTeamById(teamId),
      fplApi.getTeamHistory(teamId),
      fplApi.getBootstrapStatic()
    ]);

    const currentGW = bootstrap.events.find(e => e.is_current);

    // Get current gameweek picks if available
    let currentPicks = null;
    if (currentGW) {
      try {
        currentPicks = await fplApi.getTeamPicks(teamId, currentGW.id);
      } catch (error) {
        console.log('Could not fetch current picks:', error.message);
      }
    }

    // Calculate real-time team value from current player prices
    let currentTeamValue = team.last_deadline_value / 10;
    let currentBank = team.last_deadline_bank / 10;

    if (currentPicks?.picks && bootstrap.elements) {
      // Sum up the current price of all 15 squad players
      const squadValue = currentPicks.picks.reduce((total, pick) => {
        const player = bootstrap.elements.find(p => p.id === pick.element);
        return total + (player?.now_cost || 0);
      }, 0);

      // Convert from tenths to millions and add bank
      currentTeamValue = squadValue / 10;
      currentBank = (currentPicks.entry_history?.bank || 0) / 10;
    }

    // Enrich team data
    const overview = {
      team: {
        id: team.id,
        name: team.name,
        player_first_name: team.player_first_name,
        player_last_name: team.player_last_name,
        summary_overall_points: team.summary_overall_points,
        summary_overall_rank: team.summary_overall_rank,
        summary_event_points: team.summary_event_points,
        summary_event_rank: team.summary_event_rank,
        current_event: team.current_event,
        started_event: team.started_event,
        favourite_team: team.favourite_team,
        leagues: team.leagues
      },
      performance: {
        overall_points: team.summary_overall_points,
        overall_rank: team.summary_overall_rank,
        last_gw_points: team.summary_event_points,
        last_gw_rank: team.summary_event_rank,
        // Real-time team value based on current player prices
        team_value: currentTeamValue,
        bank: currentBank,
        total_transfers: team.last_deadline_total_transfers
      },
      history: {
        current: history.current,
        past: history.past,
        chips: history.chips
      },
      current_gameweek: currentGW ? currentGW.id : null,
      current_picks: currentPicks
    };

    res.json(overview);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/team/:id/live/:gameweek
 * Get live points breakdown for team in specific gameweek
 */
router.get('/team/:id/live/:gameweek', async (req, res, next) => {
  try {
    const { id: teamId, gameweek } = req.params;
    const data = await fplApi.getLiveTeamPoints(teamId, gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compare/:teamId1/:teamId2/:gameweek
 * Compare two teams for a specific gameweek
 */
router.get('/compare/:teamId1/:teamId2/:gameweek', async (req, res, next) => {
  try {
    const { teamId1, teamId2, gameweek } = req.params;
    const data = await fplApi.compareTeams(teamId1, teamId2, gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feeds/double-blank-gameweeks
 * Get upcoming double and blank gameweeks
 */
router.get('/feeds/double-blank-gameweeks', async (req, res, next) => {
  try {
    const lookahead = parseInt(req.query.lookahead) || 8;
    const data = await fplApi.getDoubleAndBlankGameweeks(lookahead);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feeds/team/:teamId
 * GET /api/feeds/team/:teamId?gameweek=X
 * Get personalized feed for a team
 */
router.get('/feeds/team/:teamId', async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const gameweek = req.query.gameweek || null;
    const data = await fplApi.getTeamFeed(teamId, gameweek);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============================================
// News Routes
// ============================================

/**
 * GET /api/news/events
 * GET /api/news/events?since=ISO_TIMESTAMP
 * Get all player news change events
 */
router.get('/news/events', async (req, res, next) => {
  try {
    const newsProcessor = require('../services/newsProcessor');
    const since = req.query.since || null;
    const events = await newsProcessor.getNewsEvents(since);
    const lastChecked = await newsProcessor.getLastChecked();
    res.json({
      events,
      total: events.length,
      last_checked: lastChecked,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/news/status
 * Get news scheduler status
 */
router.get('/news/status', async (req, res, next) => {
  try {
    const newsScheduler = require('../services/newsScheduler');
    const newsProcessor = require('../services/newsProcessor');
    const lastChecked = await newsProcessor.getLastChecked();
    res.json({
      ...newsScheduler.getStatus(),
      lastChecked,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Articles Routes
// ============================================

/**
 * GET /api/articles/team/:teamId
 * Get articles relevant to a team's squad (filtered by squad teams)
 */
router.get('/articles/team/:teamId', async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const articlesFetcher = require('../services/articlesFetcher');

    // Get squad team short names for highlighting
    const bootstrap = await fplApi.getBootstrapStatic();
    const currentGW = bootstrap.events.find(e => e.is_current);

    let squadTeams = [];
    if (currentGW) {
      const picks = await fplApi.getTeamPicks(teamId, currentGW.id);
      const playerIds = picks.picks.map(p => p.element);
      const teamIds = [...new Set(
        playerIds.map(pid => {
          const player = bootstrap.elements.find(e => e.id === pid);
          return player?.team;
        }).filter(Boolean)
      )];
      squadTeams = teamIds.map(tid => {
        const team = bootstrap.teams.find(t => t.id === tid);
        return team?.short_name;
      }).filter(Boolean);
    }

    // Match against ALL 20 PL teams
    const articles = await articlesFetcher.getArticlesAllTeams();

    res.json({
      articles,
      total: articles.length,
      allTeams: articlesFetcher.ALL_TEAMS,
      squadTeams,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Podcast Transcript Routes
// ============================================

/**
 * GET /api/podcast/transcript
 * Get the latest FPL Podcast transcript (auto-processed on startup)
 */
router.get('/podcast/transcript', async (req, res, next) => {
  try {
    // Check if feature is enabled
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(503).json({
        disabled: true,
        error: 'Podcast feature disabled',
        message: 'Podcast transcription is not configured. Set GOOGLE_AI_API_KEY to enable.'
      });
    }

    const cached = await redisClient.get('podcast:fpl:transcript');

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Check if still processing
    const status = podcastProcessor.getStatus();
    if (status.isProcessing) {
      return res.status(202).json({
        processing: true,
        status: status.status,
        message: 'Podcast is being processed. Please check back shortly.'
      });
    }

    return res.status(404).json({
      error: 'No transcript available',
      message: 'Podcast transcript is not available yet.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/podcast/insights
 * Get the latest FPL Podcast structured insights
 */
router.get('/podcast/insights', async (req, res, next) => {
  try {
    // Check if feature is enabled
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(503).json({
        disabled: true,
        error: 'Podcast feature disabled',
        message: 'Podcast insights are not configured. Set GOOGLE_AI_API_KEY to enable.'
      });
    }

    const cached = await redisClient.get('podcast:fpl:insights');

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Check if still processing
    const status = podcastProcessor.getStatus();
    if (status.isProcessing) {
      return res.status(202).json({
        processing: true,
        status: status.status,
        message: 'Podcast is being processed. Please check back shortly.'
      });
    }

    return res.status(404).json({
      error: 'No insights available',
      message: 'Podcast insights are not available yet.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/podcast/status
 * Get podcast processing status
 */
router.get('/podcast/status', async (req, res, next) => {
  try {
    // Check if feature is enabled
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const featureEnabled = apiKey && apiKey !== 'your_api_key_here';

    const cachedTranscript = await redisClient.get('podcast:fpl:transcript');
    const cachedInsights = await redisClient.get('podcast:fpl:insights');
    const status = podcastProcessor.getStatus();

    res.json({
      ...status,
      featureEnabled,
      hasTranscript: !!cachedTranscript,
      hasInsights: !!cachedInsights,
      lastProcessed: cachedTranscript ? JSON.parse(cachedTranscript).processedAt : null,
      episode: cachedTranscript ? JSON.parse(cachedTranscript).episode : null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
