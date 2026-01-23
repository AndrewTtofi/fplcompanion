import { TrendingUp, TrendingDown, Minus, Trophy, DollarSign, Repeat, Sparkles, Users, Zap, Crown, Check, Clock } from 'lucide-react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { useLeague } from '@/contexts/LeagueContext';

export default function TeamOverview({ teamData }) {
  const router = useRouter();
  const { team, performance, history } = teamData;
  const { selectedLeague, selectLeague, isFiltered } = useLeague();

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

  // Get gameweek status
  const gwStatus = liveData?.gameweek_status || {};
  const isLive = gwStatus.is_live;
  const allMatchesFinished = gwStatus.all_matches_finished;
  const dataChecked = gwStatus.data_checked;

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
          isLive={isLive}
          status={dataChecked ? 'final' : allMatchesFinished ? 'finished' : isLive ? 'live' : null}
        />
        <StatCard
          label={rankLabel}
          value={displayRank?.toLocaleString()}
          icon={rankChange > 0 ? <TrendingUp className="text-green-500" /> : rankChange < 0 ? <TrendingDown className="text-red-500" /> : <Minus className="text-gray-400" />}
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Last 5 Gameweeks</h2>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">GW</th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">Points</th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">GW Rank</span>
                  <span className="sm:hidden">GW</span>
                </th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Overall Rank</span>
                  <span className="sm:hidden">Ovr</span>
                </th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Transfers</span>
                  <span className="sm:hidden">Tr</span>
                </th>
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
                    <td className="py-2 md:py-3 px-2 md:px-4 font-medium text-sm">GW{gw.event}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right font-bold text-fpl-purple relative group text-sm md:text-base">
                      {gwPoints}
                      {isCurrentGW && liveData?.total_live_points && (
                        <>
                          <span className={`ml-1 text-xs cursor-help ${
                            dataChecked ? 'text-gray-500' : allMatchesFinished ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {dataChecked ? '○' : allMatchesFinished ? '◐' : '●'}
                          </span>
                          <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 right-0">
                            {dataChecked
                              ? 'Final - Gameweek complete'
                              : allMatchesFinished
                              ? 'Finished - Awaiting bonus'
                              : 'Live - Matches in progress'}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right text-xs md:text-sm">
                      {gw.rank?.toLocaleString()}
                      {isCurrentGW && (
                        <span className="ml-1 text-xs text-gray-400" title="Rank updates after gameweek finalization">*</span>
                      )}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right text-xs md:text-sm">
                      {gw.overall_rank?.toLocaleString()}
                      {isCurrentGW && (
                        <span className="ml-1 text-xs text-gray-400" title="Rank updates after gameweek finalization">*</span>
                      )}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right text-xs md:text-sm">
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
            {dataChecked
              ? '○ Gameweek finalized. Final points confirmed.'
              : allMatchesFinished
              ? '◐ All matches finished. Awaiting bonus confirmation.'
              : '● Live - Matches in progress. Ranks update after gameweek finalization.'}
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
          {[
            { name: 'wildcard', label: 'Wildcard', icon: Sparkles, color: 'purple' },
            { name: 'bboost', label: 'Bench Boost', icon: Users, color: 'blue' },
            { name: 'freehit', label: 'Free Hit', icon: Zap, color: 'yellow' },
            { name: '3xc', label: 'Triple Captain', icon: Crown, color: 'pink' }
          ].map((chipInfo) => {
            const chip = history.chips?.find(c => c.name === chipInfo.name);
            const IconComponent = chipInfo.icon;
            const isUsed = !!chip;

            const colorClasses = {
              purple: { used: 'bg-purple-100 border-purple-300', available: 'bg-purple-50 border-purple-400', icon: 'text-purple-500', availableText: 'text-purple-600' },
              blue: { used: 'bg-blue-100 border-blue-300', available: 'bg-blue-50 border-blue-400', icon: 'text-blue-500', availableText: 'text-blue-600' },
              yellow: { used: 'bg-yellow-100 border-yellow-300', available: 'bg-yellow-50 border-yellow-400', icon: 'text-yellow-600', availableText: 'text-yellow-700' },
              pink: { used: 'bg-pink-100 border-pink-300', available: 'bg-pink-50 border-pink-400', icon: 'text-pink-500', availableText: 'text-pink-600' }
            };

            const colors = colorClasses[chipInfo.color];

            return (
              <div
                key={chipInfo.name}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isUsed ? colors.used : colors.available
                } ${isUsed ? 'opacity-75' : 'shadow-sm'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                  <span className="font-semibold text-sm text-gray-800">{chipInfo.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isUsed ? (
                    <>
                      <Check className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Used GW{chip.event}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className={`text-xs font-medium ${colors.availableText}`}>Available</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* League Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Leagues</h2>
        <div className="space-y-3">
          {team.leagues?.classic?.slice(0, 5).map((league) => (
            <div key={league.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm md:text-base truncate">{league.name}</div>
                <div className="text-xs md:text-sm text-gray-500">
                  {league.entry_last_rank?.toLocaleString()} of {league.entry_count?.toLocaleString()} teams
                </div>
              </div>
              <button
                onClick={() => {
                  selectLeague(league);
                  router.push(`/team/${team.id}?tab=leagues&league=${league.id}`, undefined, { shallow: true });
                }}
                className="text-fpl-purple hover:underline text-xs md:text-sm font-medium flex-shrink-0"
              >
                View →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtitle, isLive, status }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'live':
        return { color: 'text-green-600', label: 'Live - Matches in progress' };
      case 'finished':
        return { color: 'text-blue-600', label: 'Matches finished - Awaiting bonus confirmation' };
      case 'final':
        return { color: 'text-gray-500', label: 'Final - Gameweek complete' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        {icon}
      </div>
      <div className="stat-value relative group">
        {value}
        {statusInfo && (
          <>
            <span className={`ml-2 text-sm ${statusInfo.color} cursor-help`}>
              {status === 'live' ? '●' : status === 'finished' ? '◐' : '○'}
            </span>
            <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap top-full mt-1 left-0">
              {statusInfo.label}
            </div>
          </>
        )}
      </div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
