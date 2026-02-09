import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Home, ArrowLeft, Trophy, X } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children, teamData }) {
  const { selectedLeague, selectLeague, availableLeagues, isFiltered } = useLeague();

  // Fetch live points for current gameweek if teamData exists
  const { data: liveData } = useSWR(
    teamData ? ['live-points', teamData.team.id, teamData.current_gameweek] : null,
    () => api.getLiveTeamPoints(teamData.team.id, teamData.current_gameweek).then(res => res.data),
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const currentGwPoints = liveData?.total_live_points ?? teamData?.performance.last_gw_points;

  // Calculate live total points: official total + (live GW points - official GW points)
  const liveTotalPoints = liveData?.total_live_points
    ? teamData.performance.overall_points + (liveData.total_live_points - teamData.performance.last_gw_points)
    : teamData?.performance.overall_points;

  // Get gameweek status
  const gwStatus = liveData?.gameweek_status || {};
  const isLive = gwStatus.is_live;
  const allMatchesFinished = gwStatus.all_matches_finished;
  const dataChecked = gwStatus.data_checked;

  // Determine status display
  const getStatusDisplay = () => {
    if (dataChecked) return { symbol: '○', color: 'text-gray-400', tooltip: 'Final - Gameweek complete' };
    if (allMatchesFinished) return { symbol: '◐', color: 'text-blue-400', tooltip: 'Finished - Awaiting bonus confirmation' };
    if (isLive) return { symbol: '●', color: 'text-green-400', tooltip: 'Live - Matches in progress' };
    return null;
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="gradient-fpl text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          {/* Desktop: Single Row with Logo, Stats, and League Filter */}
          <div className="hidden md:flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <Home size={24} />
              <span className="text-xl font-bold">FPL Companion</span>
            </Link>

            <div className="flex items-center gap-4">
              {teamData && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="relative group">
                    <span className="text-fpl-green">Points:</span>{' '}
                    <span className="font-bold">{liveTotalPoints?.toLocaleString()}</span>
                    {statusDisplay && (
                      <>
                        <span className={`ml-1 text-xs ${statusDisplay.color} cursor-help`}>{statusDisplay.symbol}</span>
                        <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap -bottom-8 left-0">
                          {statusDisplay.tooltip}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative group">
                    <span className="text-fpl-green">GW{teamData.current_gameweek}:</span>{' '}
                    <span className="font-bold">{currentGwPoints}</span>
                    {statusDisplay && (
                      <>
                        <span className={`ml-1 text-xs ${statusDisplay.color} cursor-help`}>{statusDisplay.symbol}</span>
                        <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap -bottom-8 left-0">
                          {statusDisplay.tooltip}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <span className="text-fpl-green">Value:</span>{' '}
                    <span className="font-bold">£{teamData.performance.team_value}m</span>
                  </div>

                  {/* Desktop League Filter */}
                  {availableLeagues.length > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                      <Trophy size={16} className="text-fpl-green" />
                      <select
                        value={selectedLeague?.id || ''}
                        onChange={(e) => {
                          const leagueId = e.target.value;
                          if (leagueId) {
                            const league = availableLeagues.find(l => l.id.toString() === leagueId);
                            selectLeague(league);
                          } else {
                            selectLeague(null);
                          }
                        }}
                        className="bg-white/10 text-white border border-white/30 rounded px-3 py-1 text-sm font-medium cursor-pointer hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-fpl-green transition-all"
                      >
                        <option value="" className="bg-fpl-purple text-white">All Leagues</option>
                        {availableLeagues.map(league => (
                          <option key={league.id} value={league.id} className="bg-fpl-purple text-white">
                            {league.name}
                          </option>
                        ))}
                      </select>
                      {isFiltered && (
                        <button
                          onClick={() => selectLeague(null)}
                          className="p-1 hover:bg-white/20 rounded transition-colors"
                          title="Clear league filter"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <ThemeToggle />
            </div>
          </div>

          {/* Mobile: Logo and Stats */}
          <div className="flex md:hidden items-center justify-between mb-3">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
              <Home size={20} />
              <span className="text-lg font-bold">FPL Companion</span>
            </Link>

            <div className="flex items-center gap-3">
              {teamData && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="relative group">
                    <span className="text-fpl-green">Pts:</span>{' '}
                    <span className="font-bold">{liveTotalPoints?.toLocaleString()}</span>
                    {statusDisplay && (
                      <>
                        <span className={`ml-1 text-xs ${statusDisplay.color} cursor-help`}>{statusDisplay.symbol}</span>
                        <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap -bottom-8 left-0">
                          {statusDisplay.tooltip}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative group">
                    <span className="text-fpl-green">GW{teamData.current_gameweek}:</span>{' '}
                    <span className="font-bold">{currentGwPoints}</span>
                    {statusDisplay && (
                      <>
                        <span className={`ml-1 text-xs ${statusDisplay.color} cursor-help`}>{statusDisplay.symbol}</span>
                        <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap -bottom-8 left-0">
                          {statusDisplay.tooltip}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Bottom Row - League Filter (Mobile: Full Width, Desktop: Inline) */}
          {teamData && availableLeagues.length > 0 && (
            <div className="md:hidden flex items-center justify-center gap-2 pt-2 border-t border-white/20">
              <Trophy size={14} className="text-fpl-green" />
              <select
                value={selectedLeague?.id || ''}
                onChange={(e) => {
                  const leagueId = e.target.value;
                  if (leagueId) {
                    const league = availableLeagues.find(l => l.id.toString() === leagueId);
                    selectLeague(league);
                  } else {
                    selectLeague(null);
                  }
                }}
                className="flex-1 bg-white/10 text-white border border-white/30 rounded px-2 py-1 text-xs font-medium cursor-pointer hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-fpl-green transition-all"
              >
                <option value="" className="bg-fpl-purple text-white">All Leagues</option>
                {availableLeagues.map(league => (
                  <option key={league.id} value={league.id} className="bg-fpl-purple text-white">
                    {league.name}
                  </option>
                ))}
              </select>
              {isFiltered && (
                <button
                  onClick={() => selectLeague(null)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Clear league filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

        </div>
      </header>

      {/* League Filter Indicator Banner */}
      {isFiltered && selectedLeague && (
        <div className="bg-fpl-purple/10 border-b border-fpl-purple/20 dark:bg-fpl-purple/20 dark:border-fpl-purple/30">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 text-fpl-purple dark:text-fpl-green font-medium">
                <Trophy size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">
                  Viewing: <strong className="truncate">{selectedLeague.name}</strong>
                </span>
                <span className="hidden lg:inline text-xs text-gray-500 dark:text-gray-400">
                  (All data filtered to this league)
                </span>
              </div>
              <button
                onClick={() => selectLeague(null)}
                className="flex items-center gap-1 text-gray-600 hover:text-fpl-purple dark:text-gray-400 dark:hover:text-fpl-green transition-colors flex-shrink-0"
              >
                <span className="text-xs hidden sm:inline">Clear</span>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>FPL Companion - Unofficial Fantasy Premier League Dashboard</p>
            <p className="mt-1">Data provided by the official FPL API</p>
            <a
              href="https://buymeacoffee.com/fplcompanion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
            >
              <span>☕</span>
              <span>Buy Me a Coffee</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
