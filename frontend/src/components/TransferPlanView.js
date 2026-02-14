import { useState, useEffect, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, Plus, X, ChevronUp, ChevronDown, Star, Filter, Link2, Check, Search } from 'lucide-react';
import PodcastInsights from './PodcastInsights';

const SHORTLIST_STORAGE_KEY = 'fpl_shortlist';

export default function TransferPlanView({ teamData }) {
  // Filters
  const [filters, setFilters] = useState({
    name: '',
    team: null,
    position: null,
    minPrice: null,
    maxPrice: null,
  });

  // Sorting
  const [searchSort, setSearchSort] = useState({ field: 'total_points', direction: 'desc' });
  const [shortlistSort, setShortlistSort] = useState({ field: 'total_points', direction: 'desc' });

  // Shortlist (array of player IDs)
  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load shortlist from URL params or localStorage on mount
  useEffect(() => {
    // Check URL params first (for shared links)
    const urlParams = new URLSearchParams(window.location.search);
    const shortlistParam = urlParams.get('shortlist');

    if (shortlistParam) {
      // Parse shortlist from URL
      const ids = shortlistParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        setShortlistedIds(ids);
        setIsInitialized(true);
        return;
      }
    }

    // Fall back to localStorage
    try {
      const stored = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      if (stored) {
        setShortlistedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load shortlist from localStorage:', e);
    }
    setIsInitialized(true);
  }, []);

  // Save shortlist to localStorage and update URL when it changes
  useEffect(() => {
    if (!isInitialized) return;

    // Save to localStorage
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlistedIds));
    } catch (e) {
      console.error('Failed to save shortlist to localStorage:', e);
    }

    // Update URL with shortlist (shallow update, no navigation)
    const url = new URL(window.location.href);
    if (shortlistedIds.length > 0) {
      url.searchParams.set('shortlist', shortlistedIds.join(','));
    } else {
      url.searchParams.delete('shortlist');
    }
    window.history.replaceState({}, '', url.toString());
  }, [shortlistedIds, isInitialized]);

  // Copy shareable link to clipboard
  const copyShareableLink = useCallback(() => {
    const url = new URL(window.location.href);
    if (shortlistedIds.length > 0) {
      url.searchParams.set('shortlist', shortlistedIds.join(','));
    }
    navigator.clipboard.writeText(url.toString()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [shortlistedIds]);

  // Fetch bootstrap data
  const { data: bootstrapData, error, isLoading } = useSWR(
    'bootstrap',
    () => api.getBootstrap().then(res => res.data),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Fetch current squad
  const { data: squadData } = useSWR(
    teamData ? ['current-squad', teamData.team.id, teamData.current_gameweek] : null,
    () => api.getLiveTeamPoints(teamData.team.id, teamData.current_gameweek).then(res => res.data),
    { revalidateOnFocus: false }
  );

  // Fetch all fixtures
  const { data: fixturesData } = useSWR(
    'all-fixtures',
    () => api.getFixtures().then(res => res.data),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Get current gameweek from bootstrap data
  const currentGameweek = useMemo(() => {
    if (!bootstrapData?.events) return 1;
    const current = bootstrapData.events.find(e => e.is_current);
    return current?.id || 1;
  }, [bootstrapData?.events]);

  // Build owned player IDs set
  const ownedPlayerIds = useMemo(() => {
    if (!squadData) return new Set();
    const starting = squadData.starting_xi?.map(p => p.element) || [];
    const bench = squadData.bench?.map(p => p.element) || [];
    return new Set([...starting, ...bench]);
  }, [squadData]);

  // Build lookup maps
  const teamsMap = useMemo(() => {
    if (!bootstrapData?.teams) return {};
    return bootstrapData.teams.reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {});
  }, [bootstrapData?.teams]);

  const positionsMap = useMemo(() => {
    if (!bootstrapData?.element_types) return {};
    return bootstrapData.element_types.reduce((acc, pos) => {
      acc[pos.id] = pos;
      return acc;
    }, {});
  }, [bootstrapData?.element_types]);

  // Build upcoming fixtures map (team_id -> next 5 fixtures)
  const upcomingFixturesMap = useMemo(() => {
    if (!fixturesData || !currentGameweek) return {};

    const fixturesByTeam = {};

    // Initialize empty arrays for all teams
    Object.keys(teamsMap).forEach(teamId => {
      fixturesByTeam[teamId] = [];
    });

    // Get fixtures from current gameweek onwards (limit to next 5 gameweeks)
    const upcomingFixtures = fixturesData
      .filter(f => f.event >= currentGameweek && f.event <= currentGameweek + 4)
      .sort((a, b) => a.event - b.event);

    // Group by team
    upcomingFixtures.forEach(fixture => {
      const homeTeamId = fixture.team_h;
      const awayTeamId = fixture.team_a;

      // Add fixture for home team (opponent is away team)
      if (fixturesByTeam[homeTeamId] && fixturesByTeam[homeTeamId].length < 5) {
        fixturesByTeam[homeTeamId].push({
          opponent: awayTeamId,
          isHome: true,
          gameweek: fixture.event,
          difficulty: fixture.team_h_difficulty,
        });
      }

      // Add fixture for away team (opponent is home team)
      if (fixturesByTeam[awayTeamId] && fixturesByTeam[awayTeamId].length < 5) {
        fixturesByTeam[awayTeamId].push({
          opponent: homeTeamId,
          isHome: false,
          gameweek: fixture.event,
          difficulty: fixture.team_a_difficulty,
        });
      }
    });

    // Sort each team's fixtures by gameweek and take first 5
    Object.keys(fixturesByTeam).forEach(teamId => {
      fixturesByTeam[teamId] = fixturesByTeam[teamId]
        .sort((a, b) => a.gameweek - b.gameweek)
        .slice(0, 5);
    });

    return fixturesByTeam;
  }, [fixturesData, currentGameweek, teamsMap]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    if (!bootstrapData?.elements) return [];

    let players = [...bootstrapData.elements];

    // Apply filters
    if (filters.name && filters.name.length >= 2) {
      const q = filters.name.toLowerCase();
      players = players.filter(p =>
        p.web_name.toLowerCase().includes(q) ||
        p.first_name.toLowerCase().includes(q) ||
        p.second_name.toLowerCase().includes(q)
      );
    }
    if (filters.team) {
      players = players.filter(p => p.team === filters.team);
    }
    if (filters.position) {
      players = players.filter(p => p.element_type === filters.position);
    }
    if (filters.minPrice !== null) {
      players = players.filter(p => p.now_cost / 10 >= filters.minPrice);
    }
    if (filters.maxPrice !== null) {
      players = players.filter(p => p.now_cost / 10 <= filters.maxPrice);
    }

    // Sort
    players.sort((a, b) => {
      let aVal = a[searchSort.field];
      let bVal = b[searchSort.field];

      // Handle numeric string fields
      if (searchSort.field === 'form' || searchSort.field === 'points_per_game' || searchSort.field === 'selected_by_percent') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (searchSort.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return players;
  }, [bootstrapData?.elements, filters, searchSort]);

  // Get shortlisted players
  const shortlistedPlayers = useMemo(() => {
    if (!bootstrapData?.elements) return [];

    const shortlistSet = new Set(shortlistedIds);
    let players = bootstrapData.elements.filter(p => shortlistSet.has(p.id));

    // Sort
    players.sort((a, b) => {
      let aVal = a[shortlistSort.field];
      let bVal = b[shortlistSort.field];

      if (shortlistSort.field === 'form' || shortlistSort.field === 'points_per_game' || shortlistSort.field === 'selected_by_percent') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (shortlistSort.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return players;
  }, [bootstrapData?.elements, shortlistedIds, shortlistSort]);

  // Handlers
  const addToShortlist = (playerId) => {
    if (!shortlistedIds.includes(playerId)) {
      setShortlistedIds([...shortlistedIds, playerId]);
    }
  };

  const removeFromShortlist = (playerId) => {
    setShortlistedIds(shortlistedIds.filter(id => id !== playerId));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      team: null,
      position: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  const toggleSearchSort = (field) => {
    setSearchSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const toggleShortlistSort = (field) => {
    setShortlistSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-fpl-purple dark:text-fpl-green" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load player data
      </div>
    );
  }

  const shortlistSet = new Set(shortlistedIds);

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1: return 'bg-green-600 text-white';
      case 2: return 'bg-green-400 text-white';
      case 3: return 'bg-gray-300 dark:bg-gray-500 text-gray-800 dark:text-gray-100';
      case 4: return 'bg-red-400 text-white';
      case 5: return 'bg-red-600 text-white';
      default: return 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300';
    }
  };

  // Render fixtures cells (show 3 on mobile, 5 on desktop)
  const renderFixtures = (teamId) => {
    const fixtures = upcomingFixturesMap[teamId] || [];

    return fixtures.map((fixture, idx) => {
      const opponent = teamsMap[fixture.opponent];
      const opponentShort = opponent?.short_name || '???';
      const homeAway = fixture.isHome ? 'H' : 'A';
      const hiddenOnMobile = idx >= 3 ? 'hidden md:table-cell' : '';

      return (
        <td key={idx} className={`py-2 px-1 text-center ${hiddenOnMobile}`}>
          <div className={`text-[10px] md:text-xs px-1 py-0.5 rounded ${getDifficultyColor(fixture.difficulty)}`}>
            <span className="font-medium">{opponentShort}</span>
            <span className="opacity-75 ml-0.5">({homeAway})</span>
          </div>
        </td>
      );
    });
  };

  // Render empty fixture cells if less than 5 fixtures
  const renderEmptyFixtures = (teamId) => {
    const fixtures = upcomingFixturesMap[teamId] || [];
    const emptyCount = 5 - fixtures.length;
    const fixtureCount = fixtures.length;

    return Array(emptyCount).fill(null).map((_, idx) => {
      const actualIdx = fixtureCount + idx;
      const hiddenOnMobile = actualIdx >= 3 ? 'hidden md:table-cell' : '';
      return (
        <td key={`empty-${idx}`} className={`py-2 px-1 text-center ${hiddenOnMobile}`}>
          <div className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">-</div>
        </td>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* Team Filter */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Team</label>
            <select
              value={filters.team || ''}
              onChange={(e) => setFilters({ ...filters, team: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full h-[34px] px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-fpl-purple focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Teams</option>
              {bootstrapData?.teams?.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Position</label>
            <select
              value={filters.position || ''}
              onChange={(e) => setFilters({ ...filters, position: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full h-[34px] px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-fpl-purple focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Positions</option>
              {bootstrapData?.element_types?.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.singular_name}</option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Min Price</label>
            <input
              type="number"
              step="0.1"
              min="3.5"
              max="15"
              placeholder="e.g. 5.0"
              value={filters.minPrice ?? ''}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-fpl-purple focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Max Price</label>
            <input
              type="number"
              step="0.1"
              min="3.5"
              max="15"
              placeholder="e.g. 10.0"
              value={filters.maxPrice ?? ''}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-fpl-purple focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Player Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Salah, Haaland"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="w-full px-2 py-1.5 pl-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-fpl-purple focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
              {filters.name && (
                <button
                  onClick={() => setFilters({ ...filters, name: '' })}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Player Search Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            All Players ({filteredPlayers.length})
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto relative">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="text-left py-2 px-2 md:px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-700 z-30">Name</th>
                <th className="text-left py-2 px-2 md:px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Team</th>
                <th className="text-center py-2 px-1 md:px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Pos</th>
                <SortableHeader
                  label="Price"
                  field="now_cost"
                  currentSort={searchSort}
                  onSort={toggleSearchSort}
                />
                <SortableHeader
                  label="Pts"
                  field="total_points"
                  currentSort={searchSort}
                  onSort={toggleSearchSort}
                />
                <SortableHeader
                  label="Form"
                  field="form"
                  currentSort={searchSort}
                  onSort={toggleSearchSort}
                  className="hidden md:table-cell"
                />
                <SortableHeader
                  label="PPG"
                  field="points_per_game"
                  currentSort={searchSort}
                  onSort={toggleSearchSort}
                  className="hidden lg:table-cell"
                />
                <SortableHeader
                  label="Sel%"
                  field="selected_by_percent"
                  currentSort={searchSort}
                  onSort={toggleSearchSort}
                  className="hidden lg:table-cell"
                />
                {/* Fixture headers - show 3 on mobile, 5 on desktop */}
                {[1, 2, 3, 4, 5].map((i, idx) => (
                  <th key={`gw-${i}`} className={`text-center py-2 px-1 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${idx >= 3 ? 'hidden md:table-cell' : ''}`}>
                    GW{currentGameweek + i - 1}
                  </th>
                ))}
                <th className="text-center py-2 px-2 md:px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">+</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="14" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No players found matching your filters
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const isShortlisted = shortlistSet.has(player.id);
                  const isOwned = ownedPlayerIds.has(player.id);
                  return (
                    <tr
                      key={player.id}
                      className={`border-t border-gray-100 dark:border-gray-700 ${
                        isOwned ? 'bg-blue-50 dark:bg-blue-900/20' : isShortlisted ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <td className="py-2 px-2 md:px-3 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-1">
                          {isShortlisted && !isOwned && <Star size={12} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          <span className="text-sm font-medium truncate max-w-[80px] md:max-w-[150px]">
                            {player.web_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 md:px-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {teamsMap[player.team]?.short_name || '-'}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-center text-xs text-gray-600 dark:text-gray-300">
                        {positionsMap[player.element_type]?.singular_name_short || '-'}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-center text-sm">
                        {(player.now_cost / 10).toFixed(1)}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-center text-sm font-semibold text-fpl-purple dark:text-fpl-green">
                        {player.total_points}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-center text-sm hidden md:table-cell">
                        {player.form}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-center text-sm hidden lg:table-cell">
                        {player.points_per_game}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-center text-sm hidden lg:table-cell">
                        {player.selected_by_percent}%
                      </td>
                      {renderFixtures(player.team)}
                      {renderEmptyFixtures(player.team)}
                      <td className="py-2 px-2 md:px-3 text-center">
                        {isOwned ? (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 text-gray-300 dark:text-gray-500 cursor-not-allowed"
                            title="Already in your squad"
                          >
                            <Plus size={16} />
                          </span>
                        ) : isShortlisted ? (
                          <button
                            onClick={() => removeFromShortlist(player.id)}
                            className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove from shortlist"
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => addToShortlist(player.id)}
                            className="inline-flex items-center justify-center w-7 h-7 text-fpl-purple dark:text-fpl-green hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                            title="Add to shortlist"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shortlist Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-yellow-500 fill-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Shortlist ({shortlistedPlayers.length})
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {shortlistedPlayers.length > 0 && (
              <>
                <button
                  onClick={copyShareableLink}
                  className="flex items-center gap-1.5 text-xs text-fpl-purple dark:text-fpl-green hover:text-purple-700 dark:hover:text-fpl-green transition-colors"
                  title="Copy shareable link"
                >
                  {linkCopied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={14} />
                      <span className="hidden sm:inline">Share Link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShortlistedIds([])}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-700 z-20">Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Team</th>
                <th className="text-center py-2 px-1 md:px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Pos</th>
                <SortableHeader
                  label="Price"
                  field="now_cost"
                  currentSort={shortlistSort}
                  onSort={toggleShortlistSort}
                />
                <SortableHeader
                  label="Pts"
                  field="total_points"
                  currentSort={shortlistSort}
                  onSort={toggleShortlistSort}
                />
                <SortableHeader
                  label="Form"
                  field="form"
                  currentSort={shortlistSort}
                  onSort={toggleShortlistSort}
                  className="hidden md:table-cell"
                />
                <SortableHeader
                  label="PPG"
                  field="points_per_game"
                  currentSort={shortlistSort}
                  onSort={toggleShortlistSort}
                  className="hidden lg:table-cell"
                />
                <SortableHeader
                  label="Sel%"
                  field="selected_by_percent"
                  currentSort={shortlistSort}
                  onSort={toggleShortlistSort}
                  className="hidden lg:table-cell"
                />
                {/* Fixture headers - show 3 on mobile, 5 on desktop */}
                {[1, 2, 3, 4, 5].map((i, idx) => (
                  <th key={`gw-${i}`} className={`text-center py-2 px-1 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${idx >= 3 ? 'hidden md:table-cell' : ''}`}>
                    GW{currentGameweek + i - 1}
                  </th>
                ))}
                <th className="text-center py-2 px-2 md:px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">X</th>
              </tr>
            </thead>
            <tbody>
              {shortlistedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="14" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No players shortlisted yet. Click the + button to add players.
                  </td>
                </tr>
              ) : (
                shortlistedPlayers.map((player) => (
                  <tr key={player.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2 px-2 md:px-3 sticky left-0 bg-inherit z-10">
                      <span className="text-sm font-medium truncate max-w-[80px] md:max-w-[150px]">
                        {player.web_name}
                      </span>
                    </td>
                    <td className="py-2 px-2 md:px-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                      {teamsMap[player.team]?.short_name || '-'}
                    </td>
                    <td className="py-2 px-1 md:px-3 text-center text-xs text-gray-600 dark:text-gray-300">
                      {positionsMap[player.element_type]?.singular_name_short || '-'}
                    </td>
                    <td className="py-2 px-1 md:px-3 text-center text-sm">
                      {(player.now_cost / 10).toFixed(1)}
                    </td>
                    <td className="py-2 px-1 md:px-3 text-center text-sm font-semibold text-fpl-purple dark:text-fpl-green">
                      {player.total_points}
                    </td>
                    <td className="py-2 px-1 md:px-3 text-center text-sm hidden md:table-cell">
                      {player.form}
                    </td>
                    <td className="py-2 px-1 md:px-3 text-center text-sm hidden lg:table-cell">
                      {player.points_per_game}
                    </td>
                    <td className="py-2 px-1 md:px-3 text-center text-sm hidden lg:table-cell">
                      {player.selected_by_percent}%
                    </td>
                    {renderFixtures(player.team)}
                    {renderEmptyFixtures(player.team)}
                    <td className="py-2 px-2 md:px-3 text-center">
                      <button
                        onClick={() => removeFromShortlist(player.id)}
                        className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remove from shortlist"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Podcast Insights */}
      <PodcastInsights />
    </div>
  );
}

// Sortable header component
function SortableHeader({ label, field, currentSort, onSort, className = '' }) {
  const isActive = currentSort.field === field;
  const isDesc = currentSort.direction === 'desc';

  return (
    <th
      className={`text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        <span className="flex flex-col">
          <ChevronUp
            size={10}
            className={isActive && !isDesc ? 'text-fpl-purple dark:text-fpl-green' : 'text-gray-300 dark:text-gray-500'}
          />
          <ChevronDown
            size={10}
            className={`-mt-1 ${isActive && isDesc ? 'text-fpl-purple dark:text-fpl-green' : 'text-gray-300 dark:text-gray-500'}`}
          />
        </span>
      </div>
    </th>
  );
}
