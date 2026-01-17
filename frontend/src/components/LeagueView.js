import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export default function LeagueView({ teamData }) {
  const [selectedLeague, setSelectedLeague] = useState(null);
  const classicLeagues = teamData.team.leagues?.classic || [];

  // Auto-select first league
  const leagueToShow = selectedLeague || classicLeagues[0];

  if (!leagueToShow) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No leagues found for this team</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* League Selector */}
      {classicLeagues.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select League
          </label>
          <select
            value={leagueToShow.id}
            onChange={(e) => {
              const league = classicLeagues.find(l => l.id === parseInt(e.target.value));
              setSelectedLeague(league);
            }}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fpl-purple focus:border-transparent"
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
      <LeagueStandings league={leagueToShow} userTeamId={teamData.team.id} />
    </div>
  );
}

function LeagueStandings({ league, userTeamId }) {
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
  const userEntry = standings.find(s => s.entry === userTeamId);

  return (
    <div className="space-y-4">
      {/* League Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{data.league.name}</h2>
            <p className="text-gray-500 mt-1">
              {standings.length} teams
            </p>
          </div>
          <Trophy className="text-fpl-purple" size={40} />
        </div>

        {userEntry && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Your Rank</div>
                <div className="text-2xl font-bold text-fpl-purple">{userEntry.rank}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">GW Points</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userLiveData?.total_live_points ?? userEntry.event_total}
                  {userLiveData?.total_live_points && (
                    <span className="ml-1 text-sm text-green-600">●</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Points</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userLiveData?.total_live_points
                    ? userEntry.total + (userLiveData.total_live_points - userEntry.event_total)
                    : userEntry.total}
                  {userLiveData?.total_live_points && (
                    <span className="ml-1 text-sm text-green-600">●</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Standings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Team</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Manager</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">GW</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
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
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={index < 3 ? 'font-bold text-fpl-purple' : ''}>
                          {entry.rank}
                        </span>
                        {rankChange > 0 && (
                          <TrendingUp className="text-green-500" size={16} />
                        )}
                        {rankChange < 0 && (
                          <TrendingDown className="text-red-500" size={16} />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {isUser && <span className="text-fpl-pink">→</span>}
                        <span>{entry.entry_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {entry.player_name}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {gwPoints}
                      {isUser && userLiveData?.total_live_points && (
                        <span className="ml-1 text-xs text-green-600">●</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-fpl-purple">
                      {totalPoints.toLocaleString()}
                      {isUser && userLiveData?.total_live_points && (
                        <span className="ml-1 text-xs text-green-600">●</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">League Leader</div>
          <div className="font-bold text-lg">{standings[0]?.entry_name}</div>
          <div className="text-sm text-gray-600">{standings[0]?.total.toLocaleString()} pts</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Average Points</div>
          <div className="font-bold text-lg">
            {Math.round(standings.reduce((sum, s) => sum + s.total, 0) / standings.length).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Highest GW Score</div>
          <div className="font-bold text-lg">
            {Math.max(...standings.map(s => s.event_total))}
          </div>
        </div>
      </div>
    </div>
  );
}
