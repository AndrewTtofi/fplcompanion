import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, RefreshCw, TrendingUp, Users, Target, Clock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function LivePointsView({ teamId, gameweek }) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    ['live-points', teamId, gameweek],
    () => api.getLiveTeamPoints(teamId, gameweek).then(res => res.data),
    {
      refreshInterval: autoRefresh ? 30000 : 0, // Refresh every 30 seconds if enabled
      revalidateOnFocus: true,
      onSuccess: () => {
        setLastUpdate(new Date());
        setIsRefreshing(false);
      },
      onError: () => setIsRefreshing(false)
    }
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
  };

  if (isLoading) {
    return (
      <LoadingSpinner
        size="lg"
        message="Loading live points data..."
      />
    );
  }

  if (error || !data) {
    return (
      <ErrorMessage
        title="Failed to load live points"
        message="We couldn't load your live points data. Please try again."
        onRetry={() => mutate()}
        showHomeButton
      />
    );
  }

  const hasLiveGames = data.starting_xi.some(p =>
    p.fixtures?.some(f => f.started && !f.finished)
  );

  return (
    <div className="space-y-6">
      {/* Live Header */}
      <div className="bg-gradient-to-r from-fpl-purple to-purple-800 text-white rounded-lg p-4 md:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              {hasLiveGames && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fpl-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-fpl-green"></span>
                </span>
              )}
              Gameweek {gameweek} Live Points
            </h2>
            <p className="text-xs md:text-sm text-fpl-green mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-xs md:text-sm">Auto-refresh (30s)</span>
            </label>

            {isValidating && !isRefreshing && (
              <span className="text-xs text-fpl-green flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Updating...
              </span>
            )}

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-white text-fpl-purple px-3 md:px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Live Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
          <StatBox
            icon={<Target />}
            label="Total Points"
            value={data.total_live_points}
            highlight
          />
          <StatBox
            icon={<Users />}
            label="Bench Points"
            value={data.bench_points}
          />
          <StatBox
            icon={<TrendingUp />}
            label="Net Points"
            value={data.net_points}
            subtitle={data.transfers.cost > 0 ? `-${data.transfers.cost} hits` : 'No hits'}
          />
          <StatBox
            icon={<Clock />}
            label="Players Yet to Play"
            value={data.starting_xi.filter(p =>
              p.fixtures?.some(f => !f.started)
            ).length}
          />
        </div>
      </div>

      {/* Captain Info */}
      {data.captain && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-yellow-800">Captain (C)</span>
              <h3 className="text-lg font-bold text-yellow-900">{data.captain.name}</h3>
            </div>
            <div className="text-right">
              <div className="text-sm text-yellow-700">Points</div>
              <div className="text-2xl font-bold text-yellow-900">
                {data.captain.points} × 2 = {data.captain.multiplied_points}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Starting XI */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Starting XI</h3>
        <div className="space-y-3">
          {data.starting_xi.map((player) => (
            <LivePlayerCard key={player.element} player={player} />
          ))}
        </div>
      </div>

      {/* Bench */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Bench</h3>
        <div className="space-y-3">
          {data.bench.map((player) => (
            <LivePlayerCard key={player.element} player={player} isBench />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, highlight = false, subtitle }) {
  return (
    <div className={`${highlight ? 'bg-fpl-pink bg-opacity-20' : 'bg-white bg-opacity-10'} rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-white opacity-75">{icon}</div>
        <span className="text-xs text-white opacity-75">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-fpl-green' : 'text-white'}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-white opacity-75 mt-1">{subtitle}</div>}
    </div>
  );
}

function LivePlayerCard({ player, isBench = false }) {
  const stats = player.live_stats;
  const hasPlayed = stats.minutes > 0;
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const yetToPlay = player.fixtures?.some(f => !f.started);

  // Calculate display points (with captain multiplier if applicable)
  const displayPoints = player.is_captain ? stats.total_points * player.multiplier : stats.total_points;

  return (
    <div className={`bg-white rounded-lg border-2 p-3 md:p-4 transition-all ${
      isPlaying ? 'border-green-400 shadow-lg' : 'border-gray-200'
    } ${isBench ? 'opacity-75' : ''}`}>
      <div className="flex items-start md:items-center justify-between gap-2">
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm md:text-base truncate">{player.web_name}</span>
            {player.is_captain && (
              <span className="bg-fpl-purple text-white text-xs px-2 py-0.5 rounded font-bold shrink-0">C</span>
            )}
            {player.is_vice_captain && (
              <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded font-bold shrink-0">V</span>
            )}
            {isPlaying && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded animate-pulse shrink-0">
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 mt-1 text-xs md:text-sm text-gray-600 flex-wrap">
            <span>{player.team_short}</span>
            <span>{player.position}</span>
            <span>£{player.now_cost}m</span>
          </div>

          {/* Fixtures */}
          {player.fixtures && player.fixtures.length > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {player.fixtures.map((fixture, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-1 rounded ${
                    fixture.started && !fixture.finished
                      ? 'bg-green-100 text-green-800 font-bold'
                      : fixture.finished
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                  {fixture.score && ` (${fixture.score})`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Points */}
        <div className="text-right shrink-0">
          <div className="text-2xl md:text-3xl font-bold text-fpl-purple">
            {displayPoints}
          </div>
          {player.is_captain && stats.total_points > 0 && (
            <div className="text-xs text-gray-500 whitespace-nowrap">
              {stats.total_points} × {player.multiplier}
            </div>
          )}
          {!hasPlayed && yetToPlay && (
            <div className="text-xs text-blue-600 mt-1 whitespace-nowrap">Yet to play</div>
          )}
          {!hasPlayed && !yetToPlay && (
            <div className="text-xs text-gray-500 mt-1">DNP</div>
          )}
        </div>
      </div>

      {/* Stats Breakdown */}
      {hasPlayed && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 md:gap-2 text-center text-xs">
            <StatItem label="MIN" value={stats.minutes} />
            {stats.goals_scored > 0 && <StatItem label="G" value={stats.goals_scored} highlight />}
            {stats.assists > 0 && <StatItem label="A" value={stats.assists} highlight />}
            {stats.clean_sheets > 0 && <StatItem label="CS" value={stats.clean_sheets} highlight />}
            {stats.bonus > 0 && <StatItem label="BPS" value={stats.bonus} highlight />}
            {stats.yellow_cards > 0 && <StatItem label="YC" value={stats.yellow_cards} negative />}
            {stats.red_cards > 0 && <StatItem label="RC" value={stats.red_cards} negative />}
            {stats.saves > 0 && <StatItem label="Saves" value={stats.saves} />}
          </div>

          {/* Points Breakdown */}
          {player.points_breakdown && player.points_breakdown.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-600 space-y-1">
                {player.points_breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.points > 0 ? `+${item.points}` : item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, highlight = false, negative = false }) {
  return (
    <div className={`${highlight ? 'bg-green-50' : negative ? 'bg-red-50' : ''} rounded p-1`}>
      <div className={`text-xs ${highlight ? 'text-green-700' : negative ? 'text-red-700' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className={`font-bold ${highlight ? 'text-green-900' : negative ? 'text-red-900' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}
