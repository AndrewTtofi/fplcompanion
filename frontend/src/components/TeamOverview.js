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

  return (
    <div className="space-y-6">
      {/* Performance Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Points"
          value={liveTotalPoints?.toLocaleString()}
          icon={<Trophy className="text-fpl-purple dark:text-fpl-green" />}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">Last 5 Gameweeks</h2>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300">GW</th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300">Points</th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <span className="hidden sm:inline">GW Rank</span>
                  <span className="sm:hidden">GW</span>
                </th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <span className="hidden sm:inline">Overall Rank</span>
                  <span className="sm:hidden">Ovr</span>
                </th>
                <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300">
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
                  <tr key={gw.event} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2 md:py-3 px-2 md:px-4 font-medium text-sm">GW{gw.event}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right font-bold text-fpl-purple dark:text-fpl-green relative group text-sm md:text-base">
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {dataChecked
              ? '○ Gameweek finalized. Final points confirmed.'
              : allMatchesFinished
              ? '◐ All matches finished. Awaiting bonus confirmation.'
              : '● Live - Matches in progress. Ranks update after gameweek finalization.'}
          </p>
        )}
      </div>

      {/* Chips - Two Sets (GW 1-19 and GW 20-38) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Chips</h2>
        {(() => {
          const chipTypes = [
            { name: 'wildcard', label: 'Wildcard', icon: Sparkles, color: 'purple' },
            { name: 'bboost', label: 'Bench Boost', icon: Users, color: 'blue' },
            { name: 'freehit', label: 'Free Hit', icon: Zap, color: 'yellow' },
            { name: '3xc', label: 'Triple Captain', icon: Crown, color: 'pink' }
          ];

          const colorClasses = {
            purple: {
              used: 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
              available: 'bg-purple-50 border-purple-400 dark:bg-purple-900/20 dark:border-purple-500',
              icon: 'text-purple-500 dark:text-purple-400',
              availableText: 'text-purple-600 dark:text-purple-400'
            },
            blue: {
              used: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
              available: 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500',
              icon: 'text-blue-500 dark:text-blue-400',
              availableText: 'text-blue-600 dark:text-blue-400'
            },
            yellow: {
              used: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700',
              available: 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500',
              icon: 'text-yellow-600 dark:text-yellow-400',
              availableText: 'text-yellow-700 dark:text-yellow-400'
            },
            pink: {
              used: 'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700',
              available: 'bg-pink-50 border-pink-400 dark:bg-pink-900/20 dark:border-pink-500',
              icon: 'text-pink-500 dark:text-pink-400',
              availableText: 'text-pink-600 dark:text-pink-400'
            }
          };

          const halves = [
            { label: 'First Half', subtitle: 'GW 1-19', chips: history.chips?.filter(c => c.event <= 19) || [] },
            { label: 'Second Half', subtitle: 'GW 20-38', chips: history.chips?.filter(c => c.event >= 20) || [] }
          ];

          return (
            <div className="space-y-5">
              {halves.map((half) => (
                <div key={half.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{half.label}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">({half.subtitle})</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {chipTypes.map((chipInfo) => {
                      const chip = half.chips.find(c => c.name === chipInfo.name);
                      const IconComponent = chipInfo.icon;
                      const isUsed = !!chip;
                      const colors = colorClasses[chipInfo.color];

                      return (
                        <div
                          key={`${half.label}-${chipInfo.name}`}
                          className={`p-3 md:p-4 rounded-lg border-2 transition-all ${
                            isUsed ? colors.used : colors.available
                          } ${isUsed ? 'opacity-75' : 'shadow-sm'}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{chipInfo.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isUsed ? (
                              <>
                                <Check className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-300">Used GW{chip.event}</span>
                              </>
                            ) : (
                              <>
                                <Clock className={`w-4 h-4 ${colors.icon}`} />
                                <span className={`text-xs font-medium ${colors.availableText}`}>Available</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* League Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">Leagues</h2>
        <div className="space-y-3">
          {team.leagues?.classic?.slice(0, 5).map((league) => (
            <div key={league.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm md:text-base truncate">{league.name}</div>
                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {league.entry_last_rank?.toLocaleString()} of {league.entry_count?.toLocaleString()} teams
                </div>
              </div>
              <button
                onClick={() => {
                  selectLeague(league);
                  router.push(`/team/${team.id}?tab=leagues&league=${league.id}`, undefined, { shallow: true });
                }}
                className="text-fpl-purple dark:text-fpl-green hover:underline text-xs md:text-sm font-medium flex-shrink-0"
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
      {subtitle && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
