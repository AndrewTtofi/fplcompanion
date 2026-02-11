import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, TrendingUp, TrendingDown, Users, X, ChevronDown } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import SquadComparisonView from './SquadComparisonView';

export default function LeagueView({ teamData }) {
  const { selectedLeague: globalLeague } = useLeague();
  const [selectedLeague, setSelectedLeague] = useState(null);
  const classicLeagues = teamData.team.leagues?.classic || [];

  // Use global league filter if set, otherwise fall back to local selection
  const leagueToShow = globalLeague || selectedLeague || classicLeagues[0];

  // Update local selection when global league changes
  useEffect(() => {
    if (globalLeague) {
      setSelectedLeague(globalLeague);
    }
  }, [globalLeague]);

  if (!leagueToShow) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No leagues found for this team</p>
      </div>
    );
  }

  return (
    <LeagueStandings key={leagueToShow.id} league={leagueToShow} userTeamId={teamData.team.id} teamData={teamData} />
  );
}

function LeagueStandings({ league, userTeamId, teamData }) {
  const [comparisonTeamId, setComparisonTeamId] = useState(null);
  const [sortKey, setSortKey] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const SortHeader = ({ colKey, children, className }) => {
    const isActive = sortKey === colKey;
    return (
      <th
        className={`${className} cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors`}
        onClick={() => handleSort(colKey)}
      >
        <span className="inline-flex items-center gap-0.5">
          {children}
          {isActive && (
            <span className="text-fpl-purple dark:text-fpl-green text-[8px] md:text-[10px]">
              {sortDir === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </span>
      </th>
    );
  };

  // Reset comparison when league changes
  useEffect(() => {
    setComparisonTeamId(null);
  }, [league.id]);

  const { data, error, isLoading } = useSWR(
    ['league', league.id],
    () => api.getClassicLeague(league.id).then(res => res.data),
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  // Fetch current gameweek
  const { data: currentGwData } = useSWR(
    'current-gw',
    () => api.getCurrentGameweek().then(res => res.data),
    { revalidateOnFocus: false }
  );

  // Fetch live points for the user's team
  const { data: userLiveData } = useSWR(
    currentGwData && userTeamId ? ['user-live', userTeamId, currentGwData.current_gameweek] : null,
    () => api.getLiveTeamPoints(userTeamId, currentGwData.current_gameweek).then(res => res.data),
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  // Fetch live points for ALL teams in the league
  const { data: leagueLiveData } = useSWR(
    currentGwData && league.id ? ['league-live', league.id, currentGwData.current_gameweek] : null,
    () => api.getLeagueLivePoints(league.id, currentGwData.current_gameweek).then(res => res.data),
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  // Fetch comparison data
  const { data: comparisonData, isLoading: comparisonLoading } = useSWR(
    comparisonTeamId && currentGwData ? ['compare', userTeamId, comparisonTeamId, currentGwData.current_gameweek] : null,
    () => api.compareTeams(userTeamId, comparisonTeamId, currentGwData.current_gameweek).then(res => res.data),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-fpl-purple dark:text-fpl-green" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load league standings
      </div>
    );
  }

  const rawStandings = data.standings.results;

  // Get gameweek status
  const gwStatus = userLiveData?.gameweek_status || {};
  const isLive = gwStatus.is_live;
  const allMatchesFinished = gwStatus.all_matches_finished;
  const dataChecked = gwStatus.data_checked;

  // Determine status display
  const getStatusDisplay = () => {
    if (dataChecked) return { symbol: '○', color: 'text-gray-500', tooltip: 'Final - Gameweek complete' };
    if (allMatchesFinished) return { symbol: '◐', color: 'text-blue-600', tooltip: 'Finished - Awaiting bonus confirmation' };
    if (isLive) return { symbol: '●', color: 'text-green-600', tooltip: 'Live - Matches in progress' };
    return null;
  };

  const statusDisplay = getStatusDisplay();

  // Get user's league entry from multiple sources:
  // 1. From the standings page (if user is on current page)
  const userEntryInPage = rawStandings.find(s => s.entry === userTeamId);

  // 2. From new_entries (if available)
  const userEntryFromNewEntries = data.new_entries?.results?.find(s => s.entry === userTeamId);

  // 3. From the team's league data (always available)
  const userLeagueInfo = teamData.team.leagues?.classic?.find(l => l.id === league.id);

  // Construct user entry from team league data if not found in standings
  let userEntry = userEntryInPage || userEntryFromNewEntries;

  if (!userEntry && userLeagueInfo) {
    // Build entry object from league info
    userEntry = {
      entry: userTeamId,
      entry_name: teamData.team.name,
      player_name: `${teamData.team.player_first_name} ${teamData.team.player_last_name}`,
      rank: userLeagueInfo.entry_rank,
      last_rank: userLeagueInfo.entry_last_rank,
      event_total: teamData.team.summary_event_points,
      total: teamData.team.summary_overall_points
    };
  }

  // Pre-compute derived data for each entry so we can sort on any column
  const enrichedStandings = rawStandings.map((entry) => {
    const isUser = entry.entry === userTeamId;
    const teamLive = leagueLiveData?.live_points?.[entry.entry];

    let gwPoints = entry.event_total;
    if (isUser && userLiveData?.total_live_points) {
      gwPoints = userLiveData.total_live_points;
    } else if (teamLive) {
      gwPoints = teamLive.live_gw_points;
    }

    let totalPoints = entry.total;
    if (isUser && userLiveData?.total_live_points) {
      totalPoints = entry.total + (userLiveData.total_live_points - entry.event_total);
    } else if (teamLive) {
      totalPoints = entry.total + (teamLive.live_gw_points - entry.event_total);
    }

    const transfersCost = teamLive?.transfers_cost || 0;
    const netPoints = teamLive?.net_points != null ? teamLive.net_points : gwPoints - transfersCost;

    return {
      ...entry,
      isUser,
      teamLive,
      gwPoints,
      totalPoints,
      netPoints,
      captainName: teamLive?.captain_name || '',
      activeChip: teamLive?.active_chip || '',
      playersPlaying: teamLive?.players_playing ?? -1,
      playersToStart: teamLive?.players_to_start ?? -1,
      monthTotal: teamLive?.month_total ?? -1,
    };
  });

  // Sort the enriched standings
  const standings = [...enrichedStandings].sort((a, b) => {
    let aVal, bVal;
    switch (sortKey) {
      case 'rank': aVal = a.rank; bVal = b.rank; break;
      case 'captain': aVal = a.captainName.toLowerCase(); bVal = b.captainName.toLowerCase(); break;
      case 'chip': aVal = a.activeChip; bVal = b.activeChip; break;
      case 'playing': aVal = a.playersPlaying; bVal = b.playersPlaying; break;
      case 'toStart': aVal = a.playersToStart; bVal = b.playersToStart; break;
      case 'gwNet': aVal = a.netPoints; bVal = b.netPoints; break;
      case 'monthTotal': aVal = a.monthTotal; bVal = b.monthTotal; break;
      case 'total': aVal = a.totalPoints; bVal = b.totalPoints; break;
      default: aVal = a.rank; bVal = b.rank;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      {/* Comparison Modal */}
      {comparisonTeamId && comparisonData && (
        <ComparisonView
          comparisonData={comparisonData}
          onClose={() => setComparisonTeamId(null)}
          isLoading={comparisonLoading}
          leagueId={league.id}
        />
      )}

      {/* Standings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <SortHeader colKey="rank" className="text-left py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 w-6">#</SortHeader>
              <SortHeader colKey="captain" className="text-left py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">Captain</SortHeader>
              <SortHeader colKey="chip" className="text-center py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">Chip</SortHeader>
              <SortHeader colKey="playing" className="text-center py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400" title="Players currently in play">In Play</SortHeader>
              <SortHeader colKey="toStart" className="text-center py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400" title="Players yet to start">To Start</SortHeader>
              <SortHeader colKey="gwNet" className="text-center py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400" title="GW points minus transfer costs">GW Net</SortHeader>
              <SortHeader colKey="monthTotal" className="text-center py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400" title="Total points this month">Month Total</SortHeader>
              <SortHeader colKey="total" className="text-right py-1 px-1 md:px-3 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">Total</SortHeader>
            </tr>
          </thead>
            {standings.map((entry) => {
              const { isUser, teamLive, netPoints, totalPoints } = entry;
              const rankChange = entry.last_rank - entry.rank;

              // Chip badge
              const chipLabel = teamLive?.active_chip === 'bboost' ? 'BB' :
                teamLive?.active_chip === '3xc' ? 'TC' :
                teamLive?.active_chip === 'freehit' ? 'FH' :
                teamLive?.active_chip === 'wildcard' ? 'WC' : null;

              const chipColor = teamLive?.active_chip === 'bboost' ? 'bg-blue-500' :
                teamLive?.active_chip === '3xc' ? 'bg-pink-500' :
                teamLive?.active_chip === 'freehit' ? 'bg-yellow-500' :
                teamLive?.active_chip === 'wildcard' ? 'bg-purple-500' : '';

              const rowBg = isUser
                ? 'bg-fpl-purple bg-opacity-10 dark:bg-fpl-purple/20'
                : '';
              const rowInteractive = !isUser
                ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-600'
                : '';

              return (
                <tbody
                  key={entry.entry}
                  onClick={!isUser ? () => setComparisonTeamId(entry.entry) : undefined}
                  className={`${rowBg} ${rowInteractive} border-t border-gray-200 dark:border-gray-700`}
                >
                  {/* Row 1: Team name */}
                  <tr>
                    <td className="pt-1 pb-0 px-1 md:px-3">
                      <div className="flex items-center gap-0.5">
                        <span className={`text-[11px] md:text-sm font-bold ${entry.rank <= 3 ? 'text-fpl-purple dark:text-fpl-green' : 'text-gray-700 dark:text-gray-300'}`}>
                          {entry.rank}
                        </span>
                        {rankChange > 0 && <TrendingUp className="text-green-500 w-2.5 h-2.5" />}
                        {rankChange < 0 && <TrendingDown className="text-red-500 w-2.5 h-2.5" />}
                      </div>
                    </td>
                    <td colSpan={7} className="pt-1 pb-0 px-1 md:px-3">
                      <div className="flex items-center gap-1">
                        {isUser && <span className="text-fpl-pink text-[10px]">&#9654;</span>}
                        <span className={`text-[11px] md:text-sm truncate ${isUser ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                          {entry.entry_name}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 truncate">
                          ({entry.player_name})
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Row 2: Stats */}
                  <tr>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-[10px] text-gray-300 dark:text-gray-600">—</td>
                    <td className="pt-0 pb-1 px-1 md:px-3">
                      {teamLive?.captain_name ? (
                        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60px] md:max-w-[100px]">{teamLive.captain_name}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-center">
                      {chipLabel ? (
                        <span className={`${chipColor} text-white text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded`}>
                          {chipLabel}
                        </span>
                      ) : null}
                    </td>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-center text-[11px] md:text-sm text-gray-600 dark:text-gray-300">
                      {teamLive?.players_playing != null ? teamLive.players_playing : '—'}
                    </td>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-center text-[11px] md:text-sm text-gray-600 dark:text-gray-300">
                      {teamLive?.players_to_start != null ? teamLive.players_to_start : '—'}
                    </td>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-center text-[11px] md:text-sm text-gray-600 dark:text-gray-300">
                      {netPoints}
                    </td>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-center text-[11px] md:text-sm text-gray-600 dark:text-gray-300">
                      {teamLive?.month_total != null ? teamLive.month_total : '—'}
                    </td>
                    <td className="pt-0 pb-1 px-1 md:px-3 text-right text-[11px] md:text-sm font-bold text-fpl-purple dark:text-fpl-green">
                      {totalPoints.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              );
            })}
        </table>
      </div>
    </div>
  );
}

function ComparisonView({ comparisonData, onClose, isLoading, leagueId }) {
  const [activeTab, setActiveTab] = useState('squad');
  const [showDifferentials, setShowDifferentials] = useState(false);
  const [showCaptains, setShowCaptains] = useState(false);
  const [showSharedPlayers, setShowSharedPlayers] = useState(false);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8">
          <Loader2 className="animate-spin text-fpl-purple dark:text-fpl-green mx-auto" size={40} />
          <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-300">Loading comparison...</p>
        </div>
      </div>
    );
  }

  const { team1, team2, comparison, summary, team1_squad, team2_squad } = comparisonData;
  const hasSquadData = !!team1_squad && !!team2_squad;

  const sharedPlayerIds = hasSquadData
    ? [...team1_squad.starting_xi, ...(team1_squad.bench || [])]
        .map(p => p.element)
        .filter(id => [...team2_squad.starting_xi, ...(team2_squad.bench || [])].some(p => p.element === id))
    : comparison.shared_players.map(p => p.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 md:gap-3">
            <h2 className="text-sm md:text-2xl font-bold text-gray-900 dark:text-white">Head-to-Head</h2>
            {hasSquadData && (
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveTab('squad')}
                  className={`w-16 md:w-20 py-1 text-[11px] md:text-xs rounded-md font-medium transition-colors text-center ${
                    activeTab === 'squad'
                      ? 'bg-white dark:bg-gray-600 text-fpl-purple dark:text-fpl-green shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Squad
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`w-16 md:w-20 py-1 text-[11px] md:text-xs rounded-md font-medium transition-colors text-center ${
                    activeTab === 'analysis'
                      ? 'bg-white dark:bg-gray-600 text-fpl-purple dark:text-fpl-green shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Analysis
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
          {/* Squad View */}
          {activeTab === 'squad' && hasSquadData && (
            <SquadComparisonView
              team1Name={team1.name}
              team2Name={team2.name}
              team1Squad={team1_squad}
              team2Squad={team2_squad}
              sharedPlayerIds={sharedPlayerIds}
              leagueId={leagueId}
            />
          )}

          {/* Analysis View */}
          {activeTab === 'analysis' && <>
          {/* Gameweek Difference */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:p-6 text-center">
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-2">Gameweek Difference</div>
            <div className={`text-2xl md:text-4xl font-bold ${comparison.gameweek_difference > 0 ? 'text-green-600' : comparison.gameweek_difference < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {comparison.gameweek_difference > 0 ? '+' : ''}{comparison.gameweek_difference}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-2">
              {comparison.gameweek_difference > 0 ? "You're ahead" : comparison.gameweek_difference < 0 ? "You're behind" : "Even"}
            </div>
          </div>

          {/* Summary */}
          {summary && summary.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-2">Key Insights</h3>
              <ul className="space-y-1 text-xs md:text-sm text-gray-700 dark:text-gray-200">
                {summary.map((insight, idx) => (
                  <li key={idx}>• {insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Differentials (collapsible) */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowDifferentials(!showDifferentials)}
              className="w-full flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                Differentials ({comparison.team1_differentials.length} vs {comparison.team2_differentials.length})
              </span>
              <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400 transition-transform ${showDifferentials ? 'rotate-180' : ''}`} />
            </button>
            {showDifferentials && (
              <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Your Differentials */}
                  <div className="bg-white dark:bg-gray-800 border border-fpl-purple rounded-lg p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-2 md:mb-3">
                      Your Differentials ({comparison.team1_differentials.length})
                    </h3>
                    <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                      {comparison.team1_differentials.map((player) => (
                        <div key={player.id} className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                          <div className="flex items-center gap-1 md:gap-2 min-w-0">
                            <span className="font-medium text-xs md:text-sm truncate dark:text-white">{player.name}</span>
                            <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 flex-shrink-0">{player.team}</span>
                            {player.is_captain && (
                              <span className="bg-yellow-500 text-white text-[10px] md:text-xs px-1 rounded">C</span>
                            )}
                          </div>
                          <span className="font-bold text-xs md:text-sm text-fpl-purple dark:text-fpl-green flex-shrink-0 ml-2">{player.multiplied_points} pts</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs md:text-sm dark:text-white">Total:</span>
                        <span className="font-bold text-fpl-purple dark:text-fpl-green text-sm md:text-lg">
                          {comparison.differential_points.team1} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Their Differentials */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-lg p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-2 md:mb-3">
                      Their Differentials ({comparison.team2_differentials.length})
                    </h3>
                    <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                      {comparison.team2_differentials.map((player) => (
                        <div key={player.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                          <div className="flex items-center gap-1 md:gap-2 min-w-0">
                            <span className="font-medium text-xs md:text-sm truncate dark:text-white">{player.name}</span>
                            <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 flex-shrink-0">{player.team}</span>
                            {player.is_captain && (
                              <span className="bg-yellow-500 text-white text-[10px] md:text-xs px-1 rounded">C</span>
                            )}
                          </div>
                          <span className="font-bold text-xs md:text-sm text-gray-700 dark:text-gray-200 flex-shrink-0 ml-2">{player.multiplied_points} pts</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs md:text-sm dark:text-white">Total:</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200 text-sm md:text-lg">
                          {comparison.differential_points.team2} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Differential Points Difference */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 md:p-4 text-center">
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-1">Differential Points Advantage</div>
                  <div className={`text-xl md:text-3xl font-bold ${comparison.differential_points.difference > 0 ? 'text-green-600' : comparison.differential_points.difference < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {comparison.differential_points.difference > 0 ? '+' : ''}{comparison.differential_points.difference} pts
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Captain Comparison (collapsible) */}
          {!comparison.captain_difference.same_captain && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowCaptains(!showCaptains)}
                className="w-full flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                  Captain Comparison
                </span>
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400 transition-transform ${showCaptains ? 'rotate-180' : ''}`} />
              </button>
              {showCaptains && (
                <div className="p-3 md:p-4">
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4">
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-1 md:mb-2">Your Captain</div>
                      <div className="font-bold text-xs md:text-lg truncate dark:text-white">{comparison.captain_difference.team1_captain.name}</div>
                      <div className="text-lg md:text-2xl font-bold text-fpl-purple dark:text-fpl-green mt-1 md:mt-2">
                        {comparison.captain_difference.team1_captain.multiplied_points} pts
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4">
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-1 md:mb-2">Their Captain</div>
                      <div className="font-bold text-xs md:text-lg truncate dark:text-white">{comparison.captain_difference.team2_captain.name}</div>
                      <div className="text-lg md:text-2xl font-bold text-gray-700 dark:text-gray-200 mt-1 md:mt-2">
                        {comparison.captain_difference.team2_captain.multiplied_points} pts
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shared Players (collapsible) */}
          {comparison.shared_players.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowSharedPlayers(!showSharedPlayers)}
                className="w-full flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                  Shared Players ({comparison.shared_players.length})
                </span>
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400 transition-transform ${showSharedPlayers ? 'rotate-180' : ''}`} />
              </button>
              {showSharedPlayers && (
                <div className="p-3 md:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {comparison.shared_players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                        <div className="flex items-center gap-1 md:gap-2 min-w-0">
                          <span className="font-medium text-xs md:text-sm truncate dark:text-white">{player.name}</span>
                          <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 flex-shrink-0">{player.team}</span>
                        </div>
                        <span className="font-bold text-xs md:text-sm text-gray-900 dark:text-white flex-shrink-0 ml-2">{player.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </>}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 md:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="bg-fpl-purple text-white px-4 md:px-6 py-2 text-sm md:text-base rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
