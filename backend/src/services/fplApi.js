const axios = require('axios');
const redisClient = require('../config/redis');

const FPL_BASE_URL = process.env.FPL_API_BASE_URL || 'https://fantasy.premierleague.com/api';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default

class FPLApiService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: FPL_BASE_URL,
      timeout: 10000,
      headers: {
        'User-Agent': 'FPL-Companion/1.0'
      }
    });
  }

  /**
   * Generic method to fetch data with caching
   */
  async fetchWithCache(endpoint, cacheKey, ttl = CACHE_TTL) {
    try {
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Cache HIT: ${cacheKey}`);
        return JSON.parse(cached);
      }

      console.log(`Cache MISS: ${cacheKey}`);
      // Fetch from FPL API
      const response = await this.axiosInstance.get(endpoint);
      const data = response.data;

      // Store in cache
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));

      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      throw new Error(`Failed to fetch data from FPL API: ${error.message}`);
    }
  }

  /**
   * Get bootstrap-static data (all players, teams, gameweeks, etc.)
   */
  async getBootstrapStatic() {
    return this.fetchWithCache('/bootstrap-static/', 'fpl:bootstrap', 600); // 10 min cache
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId) {
    return this.fetchWithCache(`/entry/${teamId}/`, `fpl:team:${teamId}`, 300);
  }

  /**
   * Get team history (season and past seasons)
   */
  async getTeamHistory(teamId) {
    return this.fetchWithCache(`/entry/${teamId}/history/`, `fpl:team:${teamId}:history`, 300);
  }

  /**
   * Get team picks for a specific gameweek
   */
  async getTeamPicks(teamId, gameweek) {
    return this.fetchWithCache(
      `/entry/${teamId}/event/${gameweek}/picks/`,
      `fpl:team:${teamId}:gw:${gameweek}:picks`,
      120
    );
  }

  /**
   * Get live gameweek data
   */
  async getLiveGameweekData(gameweek) {
    return this.fetchWithCache(`/event/${gameweek}/live/`, `fpl:gw:${gameweek}:live`, 60); // 1 min cache for live data
  }

  /**
   * Get classic league standings
   */
  async getClassicLeague(leagueId, page = 1) {
    return this.fetchWithCache(
      `/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
      `fpl:league:classic:${leagueId}:page:${page}`,
      300
    );
  }

  /**
   * Get H2H league standings
   */
  async getHeadToHeadLeague(leagueId, page = 1) {
    return this.fetchWithCache(
      `/leagues-h2h/${leagueId}/standings/?page_standings=${page}`,
      `fpl:league:h2h:${leagueId}:page:${page}`,
      300
    );
  }

  /**
   * Get fixtures (optionally filtered by gameweek)
   */
  async getFixtures(gameweek = null) {
    const endpoint = gameweek ? `/fixtures/?event=${gameweek}` : '/fixtures/';
    const cacheKey = gameweek ? `fpl:fixtures:gw:${gameweek}` : 'fpl:fixtures:all';
    return this.fetchWithCache(endpoint, cacheKey, 600);
  }

  /**
   * Get player detailed info
   */
  async getPlayerDetail(playerId) {
    return this.fetchWithCache(`/element-summary/${playerId}/`, `fpl:player:${playerId}`, 600);
  }

  /**
   * Search teams by name
   */
  async searchTeamsByName(teamName) {
    // Note: FPL API doesn't have a direct search endpoint
    // We'll need to implement this differently - possibly by maintaining a searchable index
    // For now, return a placeholder
    throw new Error('Team search not yet implemented - use exact Team ID for now');
  }

  /**
   * Get global top players of all time
   * This requires custom logic as FPL doesn't provide this directly
   */
  async getGlobalTopPlayersAllTime(limit = 20) {
    const bootstrap = await this.getBootstrapStatic();
    const players = bootstrap.elements;

    // Sort by total_points (all-time in current system)
    const topPlayers = players
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit)
      .map(player => {
        const team = bootstrap.teams.find(t => t.id === player.team);
        const position = bootstrap.element_types.find(p => p.id === player.element_type);
        return {
          id: player.id,
          name: `${player.first_name} ${player.second_name}`,
          web_name: player.web_name,
          team: team ? team.short_name : 'N/A',
          position: position ? position.singular_name_short : 'N/A',
          total_points: player.total_points,
          now_cost: player.now_cost / 10, // Convert to actual price
          selected_by_percent: parseFloat(player.selected_by_percent)
        };
      });

    return topPlayers;
  }

  /**
   * Get top players for a specific gameweek
   */
  async getGameweekTopPlayers(gameweek, limit = 20) {
    const liveData = await this.getLiveGameweekData(gameweek);
    const bootstrap = await this.getBootstrapStatic();

    const playerScores = [];

    for (const [elementId, elementData] of Object.entries(liveData.elements)) {
      const player = bootstrap.elements.find(p => p.id === parseInt(elementId));
      if (!player) continue;

      const team = bootstrap.teams.find(t => t.id === player.team);
      const position = bootstrap.element_types.find(p => p.id === player.element_type);

      playerScores.push({
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        web_name: player.web_name,
        team: team ? team.short_name : 'N/A',
        position: position ? position.singular_name_short : 'N/A',
        gw_points: elementData.stats.total_points,
        selected_by_percent: parseFloat(player.selected_by_percent),
        minutes: elementData.stats.minutes,
        goals: elementData.stats.goals_scored,
        assists: elementData.stats.assists,
        clean_sheets: elementData.stats.clean_sheets,
        bonus: elementData.stats.bonus
      });
    }

    // Sort by gameweek points and return top N
    return playerScores
      .sort((a, b) => b.gw_points - a.gw_points)
      .slice(0, limit);
  }

  /**
   * Get current gameweek number
   */
  async getCurrentGameweek() {
    const bootstrap = await this.getBootstrapStatic();
    const current = bootstrap.events.find(event => event.is_current);
    return current ? current.id : null;
  }

  /**
   * Calculate live points for a team in a gameweek with detailed breakdown
   */
  async getLiveTeamPoints(teamId, gameweek) {
    const [picks, liveData, bootstrap, fixtures] = await Promise.all([
      this.getTeamPicks(teamId, gameweek),
      this.getLiveGameweekData(gameweek),
      this.getBootstrapStatic(),
      this.getFixtures(gameweek)
    ]);

    // Convert live data elements array to object for faster lookup
    const liveDataMap = {};
    if (liveData && liveData.elements) {
      liveData.elements.forEach(el => {
        liveDataMap[el.id] = el;
      });
    }

    // Enrich picks with player data, live stats, and fixtures
    const enrichedPicks = picks.picks.map(pick => {
      const player = bootstrap.elements.find(p => p.id === pick.element);
      const liveStats = liveDataMap[pick.element];
      const team = bootstrap.teams.find(t => t.id === player?.team);
      const position = bootstrap.element_types.find(p => p.id === player?.element_type);

      // Find player's fixture(s) this gameweek
      const playerFixtures = fixtures.filter(f =>
        f.team_h === player?.team || f.team_a === player?.team
      ).map(f => {
        const isHome = f.team_h === player?.team;
        const opponent = bootstrap.teams.find(t => t.id === (isHome ? f.team_a : f.team_h));
        return {
          opponent: opponent?.short_name || 'TBD',
          isHome,
          kickoff: f.kickoff_time,
          finished: f.finished,
          started: f.started,
          score: f.started ? `${f.team_h_score}-${f.team_a_score}` : null
        };
      });

      const stats = liveStats?.stats || {};
      const explain = liveStats?.explain || [];

      return {
        ...pick,
        player_name: player ? `${player.first_name} ${player.second_name}` : 'Unknown',
        web_name: player?.web_name || 'Unknown',
        team_short: team?.short_name || 'N/A',
        position_name: position?.singular_name_short || 'N/A',
        position_id: position?.id,
        now_cost: player?.now_cost / 10,
        fixtures: playerFixtures,
        live_stats: {
          minutes: stats.minutes || 0,
          goals_scored: stats.goals_scored || 0,
          assists: stats.assists || 0,
          clean_sheets: stats.clean_sheets || 0,
          goals_conceded: stats.goals_conceded || 0,
          own_goals: stats.own_goals || 0,
          penalties_saved: stats.penalties_saved || 0,
          penalties_missed: stats.penalties_missed || 0,
          yellow_cards: stats.yellow_cards || 0,
          red_cards: stats.red_cards || 0,
          saves: stats.saves || 0,
          bonus: stats.bonus || 0,
          bps: stats.bps || 0,
          total_points: stats.total_points || 0
        },
        points_breakdown: explain
      };
    });

    // Separate starting XI and bench
    const startingXI = enrichedPicks.filter(p => p.position <= 11);
    const bench = enrichedPicks.filter(p => p.position > 11);

    // Find captain and vice-captain
    const captain = enrichedPicks.find(p => p.is_captain);
    const viceCaptain = enrichedPicks.find(p => p.is_vice_captain);

    // Calculate total live points
    let totalPoints = 0;
    startingXI.forEach(player => {
      let playerPoints = player.live_stats.total_points;
      if (player.is_captain) {
        playerPoints *= player.multiplier; // Usually 2x for captain
      }
      totalPoints += playerPoints;
    });

    // Calculate points on bench
    const benchPoints = bench.reduce((sum, p) => sum + p.live_stats.total_points, 0);

    return {
      team_id: teamId,
      gameweek,
      total_live_points: totalPoints,
      bench_points: benchPoints,
      active_chip: picks.active_chip,
      starting_xi: startingXI,
      bench,
      captain: captain ? {
        id: captain.element,
        name: captain.web_name,
        points: captain.live_stats.total_points,
        multiplied_points: captain.live_stats.total_points * captain.multiplier
      } : null,
      vice_captain: viceCaptain ? {
        id: viceCaptain.element,
        name: viceCaptain.web_name,
        points: viceCaptain.live_stats.total_points
      } : null,
      transfers: {
        made: picks.entry_history.event_transfers,
        cost: picks.entry_history.event_transfers_cost
      },
      net_points: totalPoints - picks.entry_history.event_transfers_cost
    };
  }

  /**
   * Compare two teams for a specific gameweek
   */
  async compareTeams(teamId1, teamId2, gameweek) {
    const [team1Data, team2Data, team1Info, team2Info] = await Promise.all([
      this.getLiveTeamPoints(teamId1, gameweek),
      this.getLiveTeamPoints(teamId2, gameweek),
      this.getTeamById(teamId1),
      this.getTeamById(teamId2)
    ]);

    // Find shared players
    const team1PlayerIds = team1Data.starting_xi.map(p => p.element);
    const team2PlayerIds = team2Data.starting_xi.map(p => p.element);

    const sharedPlayerIds = team1PlayerIds.filter(id => team2PlayerIds.includes(id));
    const team1Differentials = team1Data.starting_xi.filter(p => !sharedPlayerIds.includes(p.element));
    const team2Differentials = team2Data.starting_xi.filter(p => !sharedPlayerIds.includes(p.element));

    const sharedPlayers = team1Data.starting_xi.filter(p => sharedPlayerIds.includes(p.element));

    // Calculate points from differentials
    const team1DiffPoints = team1Differentials.reduce((sum, p) => {
      let pts = p.live_stats.total_points;
      if (p.is_captain) pts *= p.multiplier;
      return sum + pts;
    }, 0);

    const team2DiffPoints = team2Differentials.reduce((sum, p) => {
      let pts = p.live_stats.total_points;
      if (p.is_captain) pts *= p.multiplier;
      return sum + pts;
    }, 0);

    // Captain differences
    const captainDifference = {
      team1_captain: team1Data.captain,
      team2_captain: team2Data.captain,
      same_captain: team1Data.captain?.id === team2Data.captain?.id,
      points_swing: team1Data.captain?.multiplied_points - team2Data.captain?.multiplied_points
    };

    return {
      team1: {
        id: teamId1,
        name: team1Info.name,
        manager: `${team1Info.player_first_name} ${team1Info.player_last_name}`,
        gameweek_points: team1Data.total_live_points,
        net_points: team1Data.net_points,
        overall_points: team1Info.summary_overall_points,
        overall_rank: team1Info.summary_overall_rank
      },
      team2: {
        id: teamId2,
        name: team2Info.name,
        manager: `${team2Info.player_first_name} ${team2Info.player_last_name}`,
        gameweek_points: team2Data.total_live_points,
        net_points: team2Data.net_points,
        overall_points: team2Info.summary_overall_points,
        overall_rank: team2Info.summary_overall_rank
      },
      comparison: {
        gameweek_difference: team1Data.total_live_points - team2Data.total_live_points,
        overall_difference: team1Info.summary_overall_points - team2Info.summary_overall_points,
        shared_players: sharedPlayers.map(p => ({
          id: p.element,
          name: p.web_name,
          team: p.team_short,
          points: p.live_stats.total_points
        })),
        team1_differentials: team1Differentials.map(p => ({
          id: p.element,
          name: p.web_name,
          team: p.team_short,
          position: p.position,
          points: p.live_stats.total_points,
          is_captain: p.is_captain,
          multiplied_points: p.is_captain ? p.live_stats.total_points * p.multiplier : p.live_stats.total_points
        })),
        team2_differentials: team2Differentials.map(p => ({
          id: p.element,
          name: p.web_name,
          team: p.team_short,
          position: p.position,
          points: p.live_stats.total_points,
          is_captain: p.is_captain,
          multiplied_points: p.is_captain ? p.live_stats.total_points * p.multiplier : p.live_stats.total_points
        })),
        differential_points: {
          team1: team1DiffPoints,
          team2: team2DiffPoints,
          difference: team1DiffPoints - team2DiffPoints
        },
        captain_difference: captainDifference
      },
      summary: this.generateComparisonSummary(
        team1Info,
        team2Info,
        team1Data,
        team2Data,
        team1DiffPoints,
        team2DiffPoints,
        captainDifference
      )
    };
  }

  /**
   * Generate narrative summary for team comparison
   */
  generateComparisonSummary(team1Info, team2Info, team1Data, team2Data, team1DiffPts, team2DiffPts, captainDiff) {
    const summary = [];

    const gwDiff = team1Data.total_live_points - team2Data.total_live_points;
    const leader = gwDiff > 0 ? team1Info.name : team2Info.name;
    const leaderPts = Math.abs(gwDiff);

    summary.push(`${leader} is currently leading this gameweek by ${leaderPts} points.`);

    if (!captainDiff.same_captain) {
      const captainLeader = captainDiff.points_swing > 0 ? team1Info.name : team2Info.name;
      const captainSwing = Math.abs(captainDiff.points_swing);
      if (captainSwing > 0) {
        summary.push(`${captainLeader} gained ${captainSwing} points from their captain choice.`);
      }
    } else {
      summary.push('Both managers captained the same player.');
    }

    if (Math.abs(team1DiffPts - team2DiffPts) > 10) {
      const diffLeader = team1DiffPts > team2DiffPts ? team1Info.name : team2Info.name;
      const diffPts = Math.abs(team1DiffPts - team2DiffPts);
      summary.push(`${diffLeader}'s differentials are performing ${diffPts} points better.`);
    }

    return summary;
  }
}

module.exports = new FPLApiService();
