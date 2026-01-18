import { TrendingUp, TrendingDown, Trophy, Users, DollarSign, Repeat } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useLeague } from '@/contexts/LeagueContext';

export default function TeamOverview({ teamData }) {
  const { team, performance, history } = teamData;
  const { selectedLeague, isFiltered } = useLeague();

  // Fetch live points for current gameweek
  const { data: liveData } = useSWR(
    teamData ? ['overview-live', team.id, teamData.current_gameweek] : null,
    () => api.getLiveTeamPoints(team.id, teamData.current_gameweek).then(res => res.data),
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  // Fetch league standings if a league is selected
  const { data: leagueData } = useSWR(
    selectedLeague ? ['league-standings', selectedLeague.id] : null,
    () => api.getClassicLeague(selectedLeague.id).then(res => res.data),
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  // Calculate live total points
  const liveTotalPoints = liveData?.total_live_points
    ? performance.overall_points + (liveData.total_live_points - performance.last_gw_points)
    : performance.overall_points;

  const currentGwPoints = liveData?.total_live_points ?? performance.last_gw_points;

  // Get league-specific rank if a league is selected
  let displayRank = performance.overall_rank;
  let rankLabel = "Overall Rank";

  if (isFiltered && leagueData) {
    // Find user's entry in league standings
    const userEntry = leagueData.standings.results.find(entry => entry.entry === team.id);
    if (userEntry) {
      displayRank = userEntry.rank;
      rankLabel = `${selectedLeague.name} Rank`;
    } else if (leagueData.new_entries?.results) {
      // Check new_entries if not in main results
      const newEntry = leagueData.new_entries.results.find(entry => entry.entry === team.id);
      if (newEntry) {
        displayRank = newEntry.rank;
        rankLabel = `${selectedLeague.name} Rank`;
      }
    }
  }

  // Calculate rank change
  const recentHistory = history.current?.slice(-2) || [];
  const rankChange = recentHistory.length >= 2
    ? recentHistory[0].overall_rank - recentHistory[1].overall_rank
    : 0;

  // Get last 5 gameweeks performance
  const last5GWs = history.current?.slice(-5) || [];

  // Calculate best and worst gameweek
  const allGWs = history.current || [];
  const bestGW = allGWs.reduce((best, gw) =>
    gw.points > (best?.points || 0) ? gw : best, null
  );
  const worstGW = allGWs.reduce((worst, gw) =>
    gw.points < (worst?.points || Infinity) ? gw : worst, null
  );

  return (
    <div className="space-y-6">
      {/* Performance Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Points"
          value={liveTotalPoints?.toLocaleString()}
          icon={<Trophy className="text-fpl-purple" />}
          isLive={liveData?.total_live_points}
        />
        <StatCard
          label={rankLabel}
          value={displayRank?.toLocaleString()}
          icon={rankChange < 0 ? <TrendingUp className="text-green-500" /> : <TrendingDown className="text-red-500" />}
          subtitle={rankChange !== 0 && !isFiltered ? `${rankChange > 0 ? '+' : ''}${rankChange.toLocaleString()}` : isFiltered ? 'League filtered view' : 'No change'}
        />
        <StatCard
          label="Team Value"
          value={`£${performance.team_value}m`}
          icon={<DollarSign className="text-fpl-green" />}
          subtitle={`Bank: £${performance.bank}m`}
        />
        <StatCard
          label="Total Transfers"
          value={performance.total_transfers}
          icon={<Repeat className="text-fpl-pink" />}
        />
      </div>

      {/* Current Season Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Last 5 Gameweeks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">GW</th>
                <th className="text-right py-2 px-4 text-sm font-semibold text-gray-600">Points</th>
                <th className="text-right py-2 px-4 text-sm font-semibold text-gray-600">GW Rank</th>
                <th className="text-right py-2 px-4 text-sm font-semibold text-gray-600">Overall Rank</th>
                <th className="text-right py-2 px-4 text-sm font-semibold text-gray-600">Transfers</th>
              </tr>
            </thead>
            <tbody>
              {last5GWs.reverse().map((gw) => {
                // Use live points for current gameweek
                const isCurrentGW = gw.event === teamData.current_gameweek;
                const gwPoints = isCurrentGW && liveData?.total_live_points
                  ? liveData.total_live_points
                  : gw.points;

                return (
                  <tr key={gw.event} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">GW{gw.event}</td>
                    <td className="py-3 px-4 text-right font-bold text-fpl-purple relative group">
                      {gwPoints}
                      {isCurrentGW && liveData?.total_live_points && (
                        <>
                          <span className="ml-1 text-xs text-green-600 cursor-help">●</span>
                          <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 right-0">
                            Live - Gameweek in progress
                          </div>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {gw.rank?.toLocaleString()}
                      {isCurrentGW && (
                        <span className="ml-1 text-xs text-gray-400" title="Rank updates after gameweek finalization">*</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {gw.overall_rank?.toLocaleString()}
                      {isCurrentGW && (
                        <span className="ml-1 text-xs text-gray-400" title="Rank updates after gameweek finalization">*</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {gw.event_transfers > 0 && (
                        <span className={gw.event_transfers_cost > 0 ? 'text-red-600' : ''}>
                          {gw.event_transfers} {gw.event_transfers_cost > 0 ? `(-${gw.event_transfers_cost})` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {liveData?.total_live_points && (
          <p className="text-xs text-gray-500 mt-2">
            * Ranks update after gameweek finalization. Points shown with green dot (●) are live.
          </p>
        )}
      </div>

      {/* Best/Worst Gameweeks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestGW && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Best Gameweek</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-green-700">{bestGW.points}</span>
              <span className="text-sm text-green-600">points in GW{bestGW.event}</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Rank: {bestGW.rank?.toLocaleString()}
            </p>
          </div>
        )}

        {worstGW && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Worst Gameweek</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-red-700">{worstGW.points}</span>
              <span className="text-sm text-red-600">points in GW{worstGW.event}</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Rank: {worstGW.rank?.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Chips Used */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Chips</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['wildcard', 'bboost', 'freehit', '3xc'].map((chipName) => {
            const chip = history.chips?.find(c => c.name === chipName);
            const chipLabels = {
              wildcard: 'Wildcard',
              bboost: 'Bench Boost',
              freehit: 'Free Hit',
              '3xc': 'Triple Captain'
            };

            return (
              <div
                key={chipName}
                className={`p-4 rounded-lg border-2 ${
                  chip ? 'bg-gray-100 border-gray-300' : 'bg-fpl-purple bg-opacity-5 border-fpl-purple'
                }`}
              >
                <div className="font-semibold text-sm">{chipLabels[chipName]}</div>
                <div className="text-xs mt-1">
                  {chip ? (
                    <span className="text-gray-600">Used GW{chip.event}</span>
                  ) : (
                    <span className="text-fpl-purple font-medium">Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* League Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Leagues</h2>
        <div className="space-y-3">
          {team.leagues?.classic?.slice(0, 5).map((league) => (
            <div key={league.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{league.name}</div>
                <div className="text-sm text-gray-500">{league.entry_last_rank?.toLocaleString()} of {league.entry_count?.toLocaleString()} teams</div>
              </div>
              <button className="text-fpl-purple hover:underline text-sm font-medium">
                View →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtitle, isLive }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        {icon}
      </div>
      <div className="stat-value relative group">
        {value}
        {isLive && (
          <>
            <span className="ml-2 text-sm text-green-600 cursor-help">●</span>
            <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 left-0">
              Live - Gameweek in progress
            </div>
          </>
        )}
      </div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
