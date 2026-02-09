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
    return this.fetchWithCache(`/entry/${teamId}/`, `fpl:team:${teamId}`, 30); // 30s cache for fresh team data
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
    return this.fetchWithCache(`/event/${gameweek}/live/`, `fpl:gw:${gameweek}:live`, 30); // 30s cache for live data
  }

  /**
   * Get classic league standings
   * The FPL API returns league.standings.results for the requested page
   * and includes the user's own entry in new_entries.results
   */
  async getClassicLeague(leagueId, page = 1) {
    const data = await this.fetchWithCache(
      `/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
      `fpl:league:classic:${leagueId}:page:${page}`,
      30 // 30s cache for fresh league standings
    );

    // The FPL API should include new_entries which contains the user's own entry
    // This ensures we can display user rank even when they're not on page 1
    return data;
  }

  /**
   * Get live GW points for all teams in a classic league.
   * Fetches picks for each team and calculates points from the shared live data.
   */
  async getLeagueLivePoints(leagueId, gameweek, page = 1) {
    const [leagueData, liveData] = await Promise.all([
      this.getClassicLeague(leagueId, page),
      this.getLiveGameweekData(gameweek)
    ]);

    // Build a map of element id -> total_points from live data
    const livePointsMap = {};
    if (liveData?.elements) {
      liveData.elements.forEach(el => {
        livePointsMap[el.id] = el.stats?.total_points || 0;
      });
    }

    const standings = leagueData.standings?.results || [];

    // Fetch picks for all teams in parallel
    const picksPromises = standings.map(entry =>
      this.getTeamPicks(entry.entry, gameweek).catch(() => null)
    );
    const allPicks = await Promise.all(picksPromises);

    // Calculate live points for each team
    const livePoints = {};
    standings.forEach((entry, idx) => {
      const picks = allPicks[idx];
      if (!picks?.picks) return;

      const startingPicks = picks.picks.filter(p => p.position <= 11);
      let total = 0;
      for (const pick of startingPicks) {
        const pts = livePointsMap[pick.element] || 0;
        total += pick.is_captain ? pts * pick.multiplier : pts;
      }

      livePoints[entry.entry] = {
        live_gw_points: total,
        transfers_cost: picks.entry_history?.event_transfers_cost || 0
      };
    });

    return { gameweek, live_points: livePoints };
  }

  /**
   * Get H2H league standings
   */
  async getHeadToHeadLeague(leagueId, page = 1) {
    return this.fetchWithCache(
      `/leagues-h2h/${leagueId}/standings/?page_standings=${page}`,
      `fpl:league:h2h:${leagueId}:page:${page}`,
      30 // 30s cache for fresh league standings
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

      // Flatten the FPL API explain array from nested format:
      // [{fixture: 39, stats: [{identifier: "minutes", points: 2, value: 90}]}]
      // into flat format: [{name: "Minutes", points: 2, value: 90, identifier: "minutes"}]
      const identifierLabels = {
        minutes: 'Minutes',
        goals_scored: 'Goals Scored',
        assists: 'Assists',
        clean_sheets: 'Clean Sheet',
        goals_conceded: 'Goals Conceded',
        own_goals: 'Own Goals',
        penalties_saved: 'Penalties Saved',
        penalties_missed: 'Penalties Missed',
        yellow_cards: 'Yellow Card',
        red_cards: 'Red Card',
        saves: 'Saves',
        bonus: 'Bonus',
        starts: 'Started',
        defensive_contribution: 'Defensive Contributions'
      };

      const pointsBreakdown = explain.flatMap(fixture =>
        (fixture.stats || [])
          .filter(stat => stat.points !== 0)
          .map(stat => ({
            name: identifierLabels[stat.identifier] || stat.identifier,
            identifier: stat.identifier,
            points: stat.points,
            value: stat.value
          }))
      );

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
          defensive_contribution: stats.defensive_contribution || 0,
          total_points: stats.total_points || 0
        },
        points_breakdown: pointsBreakdown
      };
    });

    // Separate starting XI and bench
    let startingXI = enrichedPicks.filter(p => p.position <= 11);
    let bench = enrichedPicks.filter(p => p.position > 11).sort((a, b) => a.position - b.position);

    // Apply automatic substitutions
    // Auto-subs only apply AFTER the entire gameweek is finished
    // Check if ALL players (starting XI + bench) have finished their matches
    const allPlayers = [...startingXI, ...bench];
    const allMatchesFinished = allPlayers.every(p => {
      return p.fixtures?.every(f => f.finished === true);
    });

    if (allMatchesFinished) {
      // Now that all matches are done, find players who didn't play
      const didNotPlay = startingXI.filter(p => p.live_stats.minutes === 0);

      if (didNotPlay.length > 0) {
        // Bench is already sorted by position (12, 13, 14, 15) - this is the correct priority order
        const substitutions = [];

        // For each player that didn't play, try to find a valid substitute from the bench in order
        for (const nonPlayer of didNotPlay) {
          for (const sub of bench) {
            // Skip if this sub was already used
            if (substitutions.find(s => s.sub.element === sub.element)) continue;

            // Skip if sub also didn't play
            if (sub.live_stats.minutes === 0) continue;

            // Test if this substitution maintains a valid formation
            const testXI = startingXI
              .filter(p => p.element !== nonPlayer.element)
              .concat([sub]);

            const formation = {
              GK: testXI.filter(p => p.position_id === 1).length,
              DEF: testXI.filter(p => p.position_id === 2).length,
              MID: testXI.filter(p => p.position_id === 3).length,
              FWD: testXI.filter(p => p.position_id === 4).length
            };

            // Valid formation rules: 1 GK, 3+ DEF, 2+ MID, 1+ FWD
            if (formation.GK === 1 && formation.DEF >= 3 && formation.MID >= 2 && formation.FWD >= 1) {
              substitutions.push({ out: nonPlayer, sub });
              break; // Found valid sub, move to next non-player
            }
          }
        }

        // Apply all substitutions
        for (const { out, sub } of substitutions) {
          // Find the index and position of the player being substituted out
          const outIndex = startingXI.findIndex(p => p.element === out.element);
          const outPosition = out.position; // Original position (1-11)

          // Remove the sub from bench
          bench = bench.filter(p => p.element !== sub.element);

          // Replace the non-player in starting XI at the same position
          startingXI[outIndex] = {
            ...sub,
            position: outPosition, // Preserve the original position
            auto_sub: true,
            subbed_in_for: out.web_name
          };

          // Add non-player to bench with subbed_out flag
          bench.push({
            ...out,
            auto_sub: true,
            subbed_out: true,
            replaced_by: sub.web_name
          });
        }
      }
    }

    // Mark players whose matches haven't started yet
    startingXI = startingXI.map(p => {
      const hasNotStarted = p.fixtures?.some(f => f.started === false);
      return { ...p, match_not_started: hasNotStarted };
    });

    bench = bench.map(p => {
      const hasNotStarted = p.fixtures?.some(f => f.started === false);
      return { ...p, match_not_started: hasNotStarted };
    });

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

    // Get gameweek status from bootstrap events
    const gameweekEvent = bootstrap.events.find(e => e.id === parseInt(gameweek));

    // Check if any fixture is currently in progress (started but not finished)
    const allPlayerFixtures = [...startingXI, ...bench].flatMap(p => p.fixtures || []);
    const hasLiveMatches = allPlayerFixtures.some(f => f.started && !f.finished);
    const gwAllMatchesFinished = allPlayerFixtures.length > 0 && allPlayerFixtures.every(f => f.finished);
    const hasMatchesNotStarted = allPlayerFixtures.some(f => !f.started);

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
      net_points: totalPoints - picks.entry_history.event_transfers_cost,
      // Gameweek status info
      gameweek_status: {
        is_current: gameweekEvent?.is_current || false,
        is_live: hasLiveMatches, // Matches currently in progress
        all_matches_finished: gwAllMatchesFinished, // All fixtures done
        has_matches_pending: hasMatchesNotStarted, // Some matches haven't started
        gameweek_finished: gameweekEvent?.finished || false, // GW officially finished
        data_checked: gameweekEvent?.data_checked || false, // Bonus/final data confirmed
        deadline_time: gameweekEvent?.deadline_time || null
      }
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

  /**
   * Detect double and blank gameweeks for upcoming fixtures
   * Returns teams with multiple fixtures or no fixtures per gameweek
   */
  async getDoubleAndBlankGameweeks(lookaheadWeeks = 8) {
    const [bootstrap, allFixtures] = await Promise.all([
      this.getBootstrapStatic(),
      this.getFixtures()
    ]);

    const currentGW = bootstrap.events.find(e => e.is_current);
    if (!currentGW) return { double_gameweeks: [], blank_gameweeks: [] };

    const teams = bootstrap.teams;
    const upcomingGWs = bootstrap.events.filter(e =>
      e.id > currentGW.id &&
      e.id <= currentGW.id + lookaheadWeeks &&
      !e.finished
    );

    const doubleGameweeks = [];
    const blankGameweeks = [];

    // Analyze each upcoming gameweek
    upcomingGWs.forEach(gw => {
      const gwFixtures = allFixtures.filter(f => f.event === gw.id);
      const fixtureCount = {};

      // Initialize all teams with 0 fixtures
      teams.forEach(team => {
        fixtureCount[team.id] = 0;
      });

      // Count fixtures per team
      gwFixtures.forEach(fixture => {
        if (fixture.team_h) fixtureCount[fixture.team_h]++;
        if (fixture.team_a) fixtureCount[fixture.team_a]++;
      });

      // Identify teams with double gameweeks (2+ fixtures)
      const doubleTeams = [];
      const blankTeams = [];

      teams.forEach(team => {
        if (fixtureCount[team.id] >= 2) {
          doubleTeams.push({
            team_id: team.id,
            team_name: team.name,
            team_short: team.short_name,
            fixture_count: fixtureCount[team.id],
            fixtures: gwFixtures
              .filter(f => f.team_h === team.id || f.team_a === team.id)
              .map(f => {
                const isHome = f.team_h === team.id;
                const opponent = teams.find(t => t.id === (isHome ? f.team_a : f.team_h));
                return {
                  opponent: opponent?.short_name || 'TBD',
                  isHome,
                  difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
                  kickoff: f.kickoff_time
                };
              })
          });
        } else if (fixtureCount[team.id] === 0) {
          blankTeams.push({
            team_id: team.id,
            team_name: team.name,
            team_short: team.short_name
          });
        }
      });

      if (doubleTeams.length > 0) {
        doubleGameweeks.push({
          gameweek: gw.id,
          gameweek_name: gw.name,
          deadline: gw.deadline_time,
          teams: doubleTeams
        });
      }

      if (blankTeams.length > 0) {
        blankGameweeks.push({
          gameweek: gw.id,
          gameweek_name: gw.name,
          deadline: gw.deadline_time,
          teams: blankTeams
        });
      }
    });

    return {
      current_gameweek: currentGW.id,
      double_gameweeks: doubleGameweeks,
      blank_gameweeks: blankGameweeks
    };
  }

  /**
   * Get personalized feed for a user's team
   * Includes double/blank gameweeks, injuries, price changes, etc.
   */
  async getTeamFeed(teamId, gameweek = null) {
    const [bootstrap, doubleBlankGWs, teamPicks] = await Promise.all([
      this.getBootstrapStatic(),
      this.getDoubleAndBlankGameweeks(8),
      gameweek ? this.getTeamPicks(teamId, gameweek) : Promise.resolve(null)
    ]);

    const currentGW = bootstrap.events.find(e => e.is_current);
    const picks = teamPicks?.picks || [];
    const squadPlayerIds = picks.map(p => p.element);

    const feedItems = [];

    // 1. Double Gameweeks affecting squad players
    doubleBlankGWs.double_gameweeks.forEach(dgw => {
      const squadTeamsInDGW = dgw.teams.filter(team => {
        return squadPlayerIds.some(playerId => {
          const player = bootstrap.elements.find(p => p.id === playerId);
          return player && player.team === team.team_id;
        });
      });

      if (squadTeamsInDGW.length > 0) {
        const affectedPlayers = [];
        squadTeamsInDGW.forEach(team => {
          const playersInTeam = squadPlayerIds
            .map(id => bootstrap.elements.find(p => p.id === id))
            .filter(p => p && p.team === team.team_id);
          affectedPlayers.push(...playersInTeam.map(p => ({
            id: p.id,
            name: p.web_name,
            team: team.team_short
          })));
        });

        feedItems.push({
          type: 'DOUBLE_GAMEWEEK',
          priority: 'high',
          gameweek: dgw.gameweek,
          deadline: dgw.deadline,
          title: `Double Gameweek ${dgw.gameweek} Opportunity`,
          description: `${squadTeamsInDGW.length} of your teams have double fixtures`,
          teams: squadTeamsInDGW,
          affected_players: affectedPlayers,
          created_at: new Date().toISOString()
        });
      }
    });

    // 2. Blank Gameweeks affecting squad players
    doubleBlankGWs.blank_gameweeks.forEach(bgw => {
      const squadTeamsInBGW = bgw.teams.filter(team => {
        return squadPlayerIds.some(playerId => {
          const player = bootstrap.elements.find(p => p.id === playerId);
          return player && player.team === team.team_id;
        });
      });

      if (squadTeamsInBGW.length > 0) {
        const affectedPlayers = [];
        squadTeamsInBGW.forEach(team => {
          const playersInTeam = squadPlayerIds
            .map(id => bootstrap.elements.find(p => p.id === id))
            .filter(p => p && p.team === team.team_id);
          affectedPlayers.push(...playersInTeam.map(p => ({
            id: p.id,
            name: p.web_name,
            team: team.team_short
          })));
        });

        feedItems.push({
          type: 'BLANK_GAMEWEEK',
          priority: 'high',
          gameweek: bgw.gameweek,
          deadline: bgw.deadline,
          title: `Blank Gameweek ${bgw.gameweek} Warning`,
          description: `${affectedPlayers.length} of your players have no fixture`,
          teams: squadTeamsInBGW,
          affected_players: affectedPlayers,
          created_at: new Date().toISOString()
        });
      }
    });

    // 3. Injured/Suspended players in squad
    const injuredPlayers = squadPlayerIds
      .map(id => bootstrap.elements.find(p => p.id === id))
      .filter(p => p && (
        p.chance_of_playing_next_round !== null &&
        p.chance_of_playing_next_round < 75
      ))
      .map(p => {
        const team = bootstrap.teams.find(t => t.id === p.team);
        return {
          id: p.id,
          name: p.web_name,
          team: team?.short_name || 'N/A',
          chance_of_playing: p.chance_of_playing_next_round,
          news: p.news || 'Injury concern',
          news_added: p.news_added
        };
      });

    if (injuredPlayers.length > 0) {
      feedItems.push({
        type: 'INJURY_NEWS',
        priority: 'high',
        title: 'Injury Updates',
        description: `${injuredPlayers.length} player${injuredPlayers.length > 1 ? 's' : ''} with injury concerns`,
        players: injuredPlayers,
        created_at: new Date().toISOString()
      });
    }

    // 4. Price changes (players whose price changed recently)
    const priceChangedPlayers = squadPlayerIds
      .map(id => bootstrap.elements.find(p => p.id === id))
      .filter(p => p && p.cost_change_event !== 0)
      .map(p => {
        const team = bootstrap.teams.find(t => t.id === p.team);
        return {
          id: p.id,
          name: p.web_name,
          team: team?.short_name || 'N/A',
          old_price: (p.now_cost - p.cost_change_event) / 10,
          new_price: p.now_cost / 10,
          change: p.cost_change_event / 10
        };
      });

    if (priceChangedPlayers.length > 0) {
      feedItems.push({
        type: 'PRICE_CHANGE',
        priority: 'medium',
        title: 'Price Changes',
        description: `${priceChangedPlayers.length} of your players changed price`,
        players: priceChangedPlayers,
        created_at: new Date().toISOString()
      });
    }

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    feedItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return {
      team_id: teamId,
      current_gameweek: currentGW?.id,
      feed_items: feedItems,
      total_items: feedItems.length
    };
  }
}

module.exports = new FPLApiService();
