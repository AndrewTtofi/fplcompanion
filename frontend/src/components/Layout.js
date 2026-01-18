import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Home, ArrowLeft, Trophy, X } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-fpl text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <Home size={24} />
              <span className="text-xl font-bold">FPL Companion</span>
            </Link>

            {teamData && (
              <div className="flex items-center space-x-6 text-sm">
                <div className="relative group">
                  <span className="text-fpl-green">Points:</span>{' '}
                  <span className="font-bold">{liveTotalPoints?.toLocaleString()}</span>
                  {liveData?.total_live_points && (
                    <>
                      <span className="ml-1 text-xs text-green-400 cursor-help">●</span>
                      <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap -bottom-8 left-0">
                        Live - Gameweek in progress
                      </div>
                    </>
                  )}
                </div>
                <div className="relative group">
                  <span className="text-fpl-green">GW{teamData.current_gameweek}:</span>{' '}
                  <span className="font-bold">{currentGwPoints}</span>
                  {liveData?.total_live_points && (
                    <>
                      <span className="ml-1 text-xs text-green-400 cursor-help">●</span>
                      <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap -bottom-8 left-0">
                        Live - Gameweek in progress
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <span className="text-fpl-green">Value:</span>{' '}
                  <span className="font-bold">£{teamData.performance.team_value}m</span>
                </div>

                {/* League Filter Selector */}
                {availableLeagues.length > 0 && (
                  <div className="relative group ml-4 pl-4 border-l border-white/30">
                    <div className="flex items-center space-x-2">
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* League Filter Indicator Banner */}
      {isFiltered && selectedLeague && (
        <div className="bg-fpl-purple/10 border-b border-fpl-purple/20">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-fpl-purple font-medium">
                <Trophy size={16} />
                <span>Viewing league: <strong>{selectedLeague.name}</strong></span>
                <span className="text-xs text-gray-500">
                  (All data filtered to this league)
                </span>
              </div>
              <button
                onClick={() => selectLeague(null)}
                className="flex items-center space-x-1 text-gray-600 hover:text-fpl-purple transition-colors"
              >
                <span className="text-xs">Clear filter</span>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>FPL Companion - Unofficial Fantasy Premier League Dashboard</p>
            <p className="mt-1">Data provided by the official FPL API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
