import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, Trophy, TrendingUp, TrendingDown, Users, X } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

export default function LeagueView({ teamData }) {
  const { selectedLeague: globalLeague, selectLeague } = useLeague();
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
      <div className="text-center py-12 text-gray-500">
        <p>No leagues found for this team</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* League Selector */}
      {classicLeagues.length > 1 && (
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Select League
          </label>
          <select
            value={leagueToShow.id}
            onChange={(e) => {
              const league = classicLeagues.find(l => l.id === parseInt(e.target.value));
              setSelectedLeague(league);
              selectLeague(league); // Sync with global league filter
            }}
            className="w-full md:w-96 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-fpl-purple focus:border-transparent"
          >
            {classicLeagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* League Details */}
      <LeagueStandings key={leagueToShow.id} league={leagueToShow} userTeamId={teamData.team.id} teamData={teamData} />
    </div>
  );
}

function LeagueStandings({ league, userTeamId, teamData }) {
  const [comparisonTeamId, setComparisonTeamId] = useState(null);

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

  // Fetch comparison data
  const { data: comparisonData, isLoading: comparisonLoading } = useSWR(
    comparisonTeamId && currentGwData ? ['compare', userTeamId, comparisonTeamId, currentGwData.current_gameweek] : null,
    () => api.compareTeams(userTeamId, comparisonTeamId, currentGwData.current_gameweek).then(res => res.data),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-fpl-purple" size={32} />
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

  const standings = data.standings.results;

  // Get user's league entry from multiple sources:
  // 1. From the standings page (if user is on current page)
  const userEntryInPage = standings.find(s => s.entry === userTeamId);

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

  return (
    <div className="space-y-4">
      {/* Comparison Modal */}
      {comparisonTeamId && comparisonData && (
        <ComparisonView
          comparisonData={comparisonData}
          onClose={() => setComparisonTeamId(null)}
          isLoading={comparisonLoading}
        />
      )}

      {/* League Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">{data.league.name}</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {standings.length} teams
            </p>
          </div>
          <Trophy className="text-fpl-purple" size={32} />
        </div>

        {/* Always show user stats section */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div>
              <div className="text-xs md:text-sm text-gray-500">
                <span className="hidden sm:inline">Your Rank</span>
                <span className="sm:hidden">Rank</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-fpl-purple">
                {userEntry?.rank || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-gray-500">
                <span className="hidden sm:inline">GW Points</span>
                <span className="sm:hidden">GW</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 relative group">
                {userLiveData?.total_live_points ?? userEntry?.event_total ?? '-'}
                {userLiveData?.total_live_points && (
                  <>
                    <span className="ml-1 text-xs text-green-600 cursor-help">●</span>
                    <div className="absolute hidden md:group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 left-1/2 transform -translate-x-1/2">
                      Live - Gameweek in progress
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-gray-500">
                <span className="hidden sm:inline">Total Points</span>
                <span className="sm:hidden">Total</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 relative group">
                {userLiveData?.total_live_points && userEntry
                  ? userEntry.total + (userLiveData.total_live_points - userEntry.event_total)
                  : userEntry?.total ?? '-'}
                {userLiveData?.total_live_points && (
                  <>
                    <span className="ml-1 text-xs text-green-600 cursor-help">●</span>
                    <div className="absolute hidden md:group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 left-1/2 transform -translate-x-1/2">
                      Live - Gameweek in progress
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">Rank</th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">Team</th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 hidden md:table-cell">Manager</th>
                <th className="text-center py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">GW</th>
                <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">Total</th>
                <th className="text-center py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Compare</span>
                  <span className="sm:hidden">Comp</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => {
                const isUser = entry.entry === userTeamId;
                const rankChange = entry.last_rank - entry.rank;

                // Use live points for user's team if available
                const gwPoints = isUser && userLiveData?.total_live_points
                  ? userLiveData.total_live_points
                  : entry.event_total;

                // Calculate live total points for user
                const totalPoints = isUser && userLiveData?.total_live_points
                  ? entry.total + (userLiveData.total_live_points - entry.event_total)
                  : entry.total;

                return (
                  <tr
                    key={entry.entry}
                    className={`border-t border-gray-100 ${
                      isUser ? 'bg-fpl-purple bg-opacity-10 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <span className={`text-xs md:text-sm ${index < 3 ? 'font-bold text-fpl-purple' : ''}`}>
                          {entry.rank}
                        </span>
                        {rankChange > 0 && (
                          <TrendingUp className="text-green-500" size={14} />
                        )}
                        {rankChange < 0 && (
                          <TrendingDown className="text-red-500" size={14} />
                        )}
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        {isUser && <span className="text-fpl-pink">→</span>}
                        <span className="text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{entry.entry_name}</span>
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-sm text-gray-600 hidden md:table-cell">
                      {entry.player_name}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-center text-xs md:text-sm relative group">
                      {gwPoints}
                      {isUser && userLiveData?.total_live_points && (
                        <>
                          <span className="ml-1 text-xs text-green-600 cursor-help">●</span>
                          <div className="absolute hidden md:group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1">
                            Live - Gameweek in progress
                          </div>
                        </>
                      )}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right font-bold text-fpl-purple text-xs md:text-sm relative group">
                      {totalPoints.toLocaleString()}
                      {isUser && userLiveData?.total_live_points && (
                        <>
                          <span className="ml-1 text-xs text-green-600 cursor-help">●</span>
                          <div className="absolute hidden md:group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 right-0">
                            Live - Gameweek in progress
                          </div>
                        </>
                      )}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-center">
                      {!isUser && (
                        <button
                          onClick={() => setComparisonTeamId(entry.entry)}
                          className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-fpl-purple hover:bg-fpl-purple hover:text-white border border-fpl-purple rounded-md transition-colors"
                        >
                          <Users size={14} className="hidden sm:inline" />
                          <span className="hidden sm:inline">Compare</span>
                          <span className="sm:hidden">Comp</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* League Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-500 mb-1">League Leader</div>
          <div className="font-bold text-base md:text-lg">{standings[0]?.entry_name}</div>
          <div className="text-xs md:text-sm text-gray-600">{standings[0]?.total.toLocaleString()} pts</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-500 mb-1">Average Points</div>
          <div className="font-bold text-base md:text-lg">
            {Math.round(standings.reduce((sum, s) => sum + s.total, 0) / standings.length).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-500 mb-1">Highest GW Score</div>
          <div className="font-bold text-base md:text-lg">
            {Math.max(...standings.map(s => s.event_total))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonView({ comparisonData, onClose, isLoading }) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 md:p-8">
          <Loader2 className="animate-spin text-fpl-purple mx-auto" size={40} />
          <p className="mt-4 text-sm md:text-base text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  const { team1, team2, comparison, summary } = comparisonData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Head-to-Head</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Team Headers */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {/* Team 1 */}
            <div className="bg-gradient-to-r from-fpl-purple to-purple-700 text-white rounded-lg p-3 md:p-6">
              <div className="text-[10px] md:text-sm opacity-90">Your Team</div>
              <div className="text-sm md:text-2xl font-bold mt-1 truncate">{team1.name}</div>
              <div className="text-[10px] md:text-sm opacity-90 mt-1 truncate">{team1.manager}</div>
              <div className="mt-2 md:mt-4 grid grid-cols-2 gap-2 md:gap-4">
                <div>
                  <div className="text-[9px] md:text-xs opacity-75">GW Points</div>
                  <div className="text-sm md:text-xl font-bold">{team1.gameweek_points}</div>
                </div>
                <div>
                  <div className="text-[9px] md:text-xs opacity-75">Overall Rank</div>
                  <div className="text-sm md:text-xl font-bold">{team1.overall_rank.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Team 2 */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg p-3 md:p-6">
              <div className="text-[10px] md:text-sm opacity-90">Opponent</div>
              <div className="text-sm md:text-2xl font-bold mt-1 truncate">{team2.name}</div>
              <div className="text-[10px] md:text-sm opacity-90 mt-1 truncate">{team2.manager}</div>
              <div className="mt-2 md:mt-4 grid grid-cols-2 gap-2 md:gap-4">
                <div>
                  <div className="text-[9px] md:text-xs opacity-75">GW Points</div>
                  <div className="text-sm md:text-xl font-bold">{team2.gameweek_points}</div>
                </div>
                <div>
                  <div className="text-[9px] md:text-xs opacity-75">Overall Rank</div>
                  <div className="text-sm md:text-xl font-bold">{team2.overall_rank.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gameweek Difference */}
          <div className="bg-gray-50 rounded-lg p-4 md:p-6 text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-2">Gameweek Difference</div>
            <div className={`text-2xl md:text-4xl font-bold ${comparison.gameweek_difference > 0 ? 'text-green-600' : comparison.gameweek_difference < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {comparison.gameweek_difference > 0 ? '+' : ''}{comparison.gameweek_difference}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-2">
              {comparison.gameweek_difference > 0 ? "You're ahead" : comparison.gameweek_difference < 0 ? "You're behind" : "Even"}
            </div>
          </div>

          {/* Summary */}
          {summary && summary.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2">Key Insights</h3>
              <ul className="space-y-1 text-xs md:text-sm text-gray-700">
                {summary.map((insight, idx) => (
                  <li key={idx}>• {insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Captain Comparison */}
          {!comparison.captain_difference.same_captain && (
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Your Captain</div>
                <div className="font-bold text-xs md:text-lg truncate">{comparison.captain_difference.team1_captain.name}</div>
                <div className="text-lg md:text-2xl font-bold text-fpl-purple mt-1 md:mt-2">
                  {comparison.captain_difference.team1_captain.multiplied_points} pts
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Their Captain</div>
                <div className="font-bold text-xs md:text-lg truncate">{comparison.captain_difference.team2_captain.name}</div>
                <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1 md:mt-2">
                  {comparison.captain_difference.team2_captain.multiplied_points} pts
                </div>
              </div>
            </div>
          )}

          {/* Shared Players */}
          {comparison.shared_players.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2 md:mb-3">
                Shared Players ({comparison.shared_players.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {comparison.shared_players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-1 md:gap-2 min-w-0">
                      <span className="font-medium text-xs md:text-sm truncate">{player.name}</span>
                      <span className="text-[10px] md:text-xs text-gray-600 flex-shrink-0">{player.team}</span>
                    </div>
                    <span className="font-bold text-xs md:text-sm text-gray-900 flex-shrink-0 ml-2">{player.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Differentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Your Differentials */}
            <div className="bg-white border border-fpl-purple rounded-lg p-3 md:p-4">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2 md:mb-3">
                Your Differentials ({comparison.team1_differentials.length})
              </h3>
              <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                {comparison.team1_differentials.map((player) => (
                  <div key={player.id} className="flex items-center justify-between bg-purple-50 rounded p-2">
                    <div className="flex items-center gap-1 md:gap-2 min-w-0">
                      <span className="font-medium text-xs md:text-sm truncate">{player.name}</span>
                      <span className="text-[10px] md:text-xs text-gray-600 flex-shrink-0">{player.team}</span>
                      {player.is_captain && (
                        <span className="bg-yellow-500 text-white text-[10px] md:text-xs px-1 rounded">C</span>
                      )}
                    </div>
                    <span className="font-bold text-xs md:text-sm text-fpl-purple flex-shrink-0 ml-2">{player.multiplied_points} pts</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs md:text-sm">Total:</span>
                  <span className="font-bold text-fpl-purple text-sm md:text-lg">
                    {comparison.differential_points.team1} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Their Differentials */}
            <div className="bg-white border border-gray-400 rounded-lg p-3 md:p-4">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2 md:mb-3">
                Their Differentials ({comparison.team2_differentials.length})
              </h3>
              <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                {comparison.team2_differentials.map((player) => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-1 md:gap-2 min-w-0">
                      <span className="font-medium text-xs md:text-sm truncate">{player.name}</span>
                      <span className="text-[10px] md:text-xs text-gray-600 flex-shrink-0">{player.team}</span>
                      {player.is_captain && (
                        <span className="bg-yellow-500 text-white text-[10px] md:text-xs px-1 rounded">C</span>
                      )}
                    </div>
                    <span className="font-bold text-xs md:text-sm text-gray-700 flex-shrink-0 ml-2">{player.multiplied_points} pts</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs md:text-sm">Total:</span>
                  <span className="font-bold text-gray-700 text-sm md:text-lg">
                    {comparison.differential_points.team2} pts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Differential Points Difference */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Differential Points Advantage</div>
            <div className={`text-xl md:text-3xl font-bold ${comparison.differential_points.difference > 0 ? 'text-green-600' : comparison.differential_points.difference < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {comparison.differential_points.difference > 0 ? '+' : ''}{comparison.differential_points.difference} pts
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 md:p-6 border-t border-gray-200">
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
