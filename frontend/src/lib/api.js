import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods matching the backend routes
export const api = {
  // Bootstrap data
  getBootstrap: () => apiClient.get('/bootstrap'),

  // Team endpoints
  getTeamById: (teamId) => apiClient.get(`/team/${teamId}`),
  getTeamHistory: (teamId) => apiClient.get(`/team/${teamId}/history`),
  getTeamPicks: (teamId, gameweek) => apiClient.get(`/team/${teamId}/picks/${gameweek}`),
  getTeamOverview: (teamId) => apiClient.get(`/team/${teamId}/overview`),

  // Gameweek endpoints
  getCurrentGameweek: () => apiClient.get('/gameweek/current'),
  getLiveGameweekData: (gameweek) => apiClient.get(`/gameweek/${gameweek}/live`),
  getGameweekTopPlayers: (gameweek, limit = 20) =>
    apiClient.get(`/players/top/gameweek/${gameweek}?limit=${limit}`),

  // League endpoints
  getClassicLeague: (leagueId, page = 1) => apiClient.get(`/league/classic/${leagueId}?page=${page}`),
  getLeagueLivePoints: (leagueId, gameweek) => apiClient.get(`/league/classic/${leagueId}/live/${gameweek}`),
  getHeadToHeadLeague: (leagueId, page = 1) => apiClient.get(`/league/h2h/${leagueId}?page=${page}`),

  // Player endpoints
  getPlayerDetail: (playerId) => apiClient.get(`/player/${playerId}`),
  getGlobalTopPlayers: (limit = 20) => apiClient.get(`/players/top/alltime?limit=${limit}`),

  // Fixtures
  getFixtures: (gameweek = null) => {
    const url = gameweek ? `/fixtures?gameweek=${gameweek}` : '/fixtures';
    return apiClient.get(url);
  },

  // Live points
  getLiveTeamPoints: (teamId, gameweek) => apiClient.get(`/team/${teamId}/live/${gameweek}`),

  // Team comparison
  compareTeams: (teamId1, teamId2, gameweek) =>
    apiClient.get(`/compare/${teamId1}/${teamId2}/${gameweek}`),

  // Feeds
  getDoubleBlankGameweeks: (lookahead = 8) =>
    apiClient.get(`/feeds/double-blank-gameweeks?lookahead=${lookahead}`),
  getTeamFeed: (teamId, gameweek = null) => {
    const url = gameweek ? `/feeds/team/${teamId}?gameweek=${gameweek}` : `/feeds/team/${teamId}`;
    return apiClient.get(url);
  },

  // News events
  getNewsEvents: (since = null) => {
    const url = since ? `/news/events?since=${since}` : '/news/events';
    return apiClient.get(url);
  },
  getNewsStatus: () => apiClient.get('/news/status'),

  // Articles
  getTeamArticles: (teamId) => apiClient.get(`/articles/team/${teamId}`),

  // Podcast transcript and insights (auto-processed on backend startup)
  getPodcastTranscript: () => apiClient.get('/podcast/transcript'),
  getPodcastInsights: () => apiClient.get('/podcast/insights'),
  getPodcastStatus: () => apiClient.get('/podcast/status'),
};

// Error handler wrapper
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data?.error?.message || 'Server error occurred',
      status: error.response.status,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'Unable to connect to server',
      status: 503,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
    };
  }
};

export default apiClient;
