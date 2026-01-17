import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { LayoutGrid, Users, TrendingUp } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Jersey from './Jersey';

export default function FootballFieldView({ teamId, gameweek }) {
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'field'

  const { data, error, isLoading, mutate } = useSWR(
    ['team-picks', teamId, gameweek],
    () => api.getLiveTeamPoints(teamId, gameweek).then(res => res.data),
    {
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading team..." />;
  }

  if (error || !data) {
    return (
      <ErrorMessage
        title="Failed to load team"
        message="We couldn't load your team data. Please try again."
        onRetry={() => mutate()}
      />
    );
  }

  const { starting_xi, bench } = data;

  // Group players by position for field view
  const grouped = {
    GK: starting_xi.filter(p => p.position_id === 1),
    DEF: starting_xi.filter(p => p.position_id === 2),
    MID: starting_xi.filter(p => p.position_id === 3),
    FWD: starting_xi.filter(p => p.position_id === 4),
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Gameweek {gameweek} Squad
        </h2>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              viewMode === 'live'
                ? 'bg-white text-fpl-purple shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={18} />
            Live Points
          </button>
          <button
            onClick={() => setViewMode('field')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              viewMode === 'field'
                ? 'bg-white text-fpl-purple shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={18} />
            Field View
          </button>
        </div>
      </div>

      {/* Live Points View */}
      {viewMode === 'live' && (
        <div className="h-[calc(100vh-250px)] overflow-hidden">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Left Column - Summary Stats */}
            <div className="space-y-3 flex flex-col">
              {/* Total Points Card */}
              <div className="bg-gradient-to-br from-fpl-purple to-purple-700 rounded-lg p-4 text-white shadow-lg flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1">Total Live Points</div>
                  <div className="text-4xl font-bold mb-1">{data.total_live_points}</div>
                  {data.transfers.cost > 0 && (
                    <div className="text-xs opacity-90">
                      ({data.total_live_points + data.transfers.cost} - {data.transfers.cost} transfer cost)
                    </div>
                  )}
                </div>
              </div>

              {/* Bench Points Card */}
              <div className="bg-white rounded-lg p-4 shadow-md flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bench Points</div>
                  <div className="text-3xl font-bold text-gray-700">{data.bench_points}</div>
                </div>
              </div>

              {/* Transfers Card */}
              <div className="bg-white rounded-lg p-4 shadow-md flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Transfers Made</div>
                  <div className="text-3xl font-bold text-gray-700">{data.transfers.made}</div>
                  {data.transfers.cost > 0 && (
                    <div className="text-xs text-red-600 mt-1">-{data.transfers.cost} pts</div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Starting XI */}
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Starting XI</h3>
              <div className="flex-1 overflow-hidden">
                <div className="space-y-1 h-full flex flex-col justify-around">
                  {starting_xi.map(player => (
                    <LivePointsPlayerRow key={player.element} player={player} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Bench */}
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Substitutes</h3>
              <div className="flex-1 overflow-hidden">
                <div className="space-y-1.5 h-full flex flex-col justify-around">
                  {bench.map((player, index) => (
                    <LivePointsPlayerRow key={player.element} player={player} benchPosition={index + 1} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field View */}
      {viewMode === 'field' && (
        <div className="bg-gradient-to-b from-green-600 via-green-500 to-green-600 rounded-xl p-4 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Field Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white border-opacity-30 rounded-full"></div>
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white opacity-30"></div>
            {/* Penalty boxes */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-20 h-40 border-2 border-white border-opacity-30 border-l-0"></div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-20 h-40 border-2 border-white border-opacity-30 border-r-0"></div>
          </div>

          <div className="relative space-y-6 md:space-y-10">
            {/* Forwards */}
            <div className="flex justify-center gap-4 md:gap-8">
              {grouped.FWD.map(player => (
                <PlayerCard key={player.element} player={player} />
              ))}
            </div>

            {/* Midfielders */}
            <div className="flex justify-center gap-4 md:gap-6">
              {grouped.MID.map(player => (
                <PlayerCard key={player.element} player={player} />
              ))}
            </div>

            {/* Defenders */}
            <div className="flex justify-center gap-4 md:gap-6">
              {grouped.DEF.map(player => (
                <PlayerCard key={player.element} player={player} />
              ))}
            </div>

            {/* Goalkeeper */}
            <div className="flex justify-center">
              {grouped.GK.map(player => (
                <PlayerCard key={player.element} player={player} />
              ))}
            </div>
          </div>

          {/* Bench */}
          <div className="mt-8 pt-6 border-t-2 border-white border-opacity-30">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-white" size={20} />
              <h3 className="text-white font-bold text-lg">Substitutes</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {bench.map((player, index) => (
                <BenchPlayerCard key={player.element} player={player} position={index + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player }) {
  const stats = player.live_stats || {};
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const hasPlayed = stats.minutes > 0;

  return (
    <div className="relative group">
      {/* Auto-sub indicator */}
      {player.auto_sub && !player.subbed_out && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 whitespace-nowrap">
          AUTO SUB
        </div>
      )}

      {/* Match not started indicator */}
      {player.match_not_started && !player.auto_sub && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 whitespace-nowrap">
          NOT STARTED
        </div>
      )}

      <Jersey
        teamShort={player.team_short}
        playerName={player.web_name}
        isCaptain={player.is_captain}
        isViceCaptain={player.is_vice_captain}
        points={stats.total_points || 0}
        multiplier={player.multiplier}
        isPlaying={isPlaying}
        size="md"
      />

      {/* Hover Card with Points Breakdown */}
      <div className="absolute z-10 bottom-full mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl w-56 space-y-2">
          {/* Player Info */}
          <div>
            <div className="font-bold text-sm">{player.web_name}</div>
            <div className="text-gray-400 text-xs">{player.team_short} • {player.position_name} • £{player.now_cost}m</div>
            {player.auto_sub && player.subbed_in_for && (
              <div className="text-green-400 text-[10px] mt-1">
                ↑ Auto-subbed in for {player.subbed_in_for}
              </div>
            )}
          </div>

          {hasPlayed ? (
            <>
              {/* Points Breakdown */}
              <div className="border-t border-gray-700 pt-2">
                <div className="font-semibold text-fpl-green mb-2 flex justify-between items-center">
                  <span>Points Breakdown:</span>
                  <span className="text-base">{stats.total_points} pts</span>
                </div>

                <div className="space-y-1 text-xs">
                  {/* Minutes Played */}
                  {stats.minutes > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Minutes ({stats.minutes}&apos;)</span>
                      <span>{stats.minutes >= 60 ? '+2' : stats.minutes > 0 ? '+1' : '0'}</span>
                    </div>
                  )}

                  {/* Goals */}
                  {stats.goals_scored > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Goals ({stats.goals_scored})</span>
                      <span>+{stats.goals_scored * (player.position_id === 4 ? 4 : player.position_id === 3 ? 5 : 6)}</span>
                    </div>
                  )}

                  {/* Assists */}
                  {stats.assists > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Assists ({stats.assists})</span>
                      <span>+{stats.assists * 3}</span>
                    </div>
                  )}

                  {/* Clean Sheet */}
                  {stats.clean_sheets > 0 && (
                    <div className="flex justify-between text-blue-400">
                      <span>Clean Sheet</span>
                      <span>+{player.position_id <= 3 ? (player.position_id === 1 || player.position_id === 2 ? 4 : 1) : 0}</span>
                    </div>
                  )}

                  {/* Goals Conceded */}
                  {stats.goals_conceded > 0 && (player.position_id === 1 || player.position_id === 2) && (
                    <div className="flex justify-between text-red-400">
                      <span>Goals Conceded ({stats.goals_conceded})</span>
                      <span>-{Math.floor(stats.goals_conceded / 2)}</span>
                    </div>
                  )}

                  {/* Saves */}
                  {stats.saves >= 3 && player.position_id === 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Saves ({stats.saves})</span>
                      <span>+{Math.floor(stats.saves / 3)}</span>
                    </div>
                  )}

                  {/* Penalties Saved */}
                  {stats.penalties_saved > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Penalty Saved</span>
                      <span>+{stats.penalties_saved * 5}</span>
                    </div>
                  )}

                  {/* Penalties Missed */}
                  {stats.penalties_missed > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Penalty Missed</span>
                      <span>-{stats.penalties_missed * 2}</span>
                    </div>
                  )}

                  {/* Yellow Cards */}
                  {stats.yellow_cards > 0 && (
                    <div className="flex justify-between text-yellow-400">
                      <span>Yellow Card</span>
                      <span>-{stats.yellow_cards}</span>
                    </div>
                  )}

                  {/* Red Cards */}
                  {stats.red_cards > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Red Card</span>
                      <span>-{stats.red_cards * 3}</span>
                    </div>
                  )}

                  {/* Own Goals */}
                  {stats.own_goals > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Own Goal</span>
                      <span>-{stats.own_goals * 2}</span>
                    </div>
                  )}

                  {/* Bonus Points */}
                  {stats.bonus > 0 && (
                    <div className="flex justify-between text-purple-400 font-semibold">
                      <span>Bonus Points</span>
                      <span>+{stats.bonus}</span>
                    </div>
                  )}

                  {/* BPS (Bonus Points System) - informational */}
                  {stats.bps > 0 && (
                    <div className="flex justify-between text-gray-500 text-[10px] mt-1">
                      <span>BPS Score</span>
                      <span>{stats.bps}</span>
                    </div>
                  )}
                </div>

                {/* Captain Multiplier */}
                {player.is_captain && (
                  <div className="border-t border-purple-600 mt-2 pt-2">
                    <div className="flex justify-between text-purple-400 font-semibold">
                      <span>Captain (×{player.multiplier})</span>
                      <span>= {stats.total_points * player.multiplier} pts</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-center py-2 border-t border-gray-700">
              {player.fixtures?.some(f => !f.started) ? 'Yet to play' : 'Did not play'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BenchPlayerCard({ player, position }) {
  const stats = player.live_stats || {};
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);

  return (
    <div className={`bg-white bg-opacity-90 rounded-lg p-3 shadow-md flex flex-col items-center min-w-[100px] relative ${
      player.subbed_out ? 'opacity-50 border-2 border-red-300' : ''
    }`}>
      {/* Bench Position Badge */}
      <div className="absolute -top-2 -left-2 bg-gray-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10">
        {position}
      </div>

      {/* Subbed Out Indicator */}
      {player.subbed_out && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 whitespace-nowrap">
          DNP
        </div>
      )}

      {/* Match not started indicator */}
      {player.match_not_started && !player.subbed_out && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 whitespace-nowrap">
          NOT STARTED
        </div>
      )}

      {/* Jersey */}
      <Jersey
        teamShort={player.team_short}
        playerName={player.web_name}
        isCaptain={false}
        isViceCaptain={false}
        points={stats.total_points || 0}
        multiplier={1}
        isPlaying={isPlaying}
        size="sm"
      />

      {/* Show replacement info */}
      {player.replaced_by && (
        <div className="mt-2 text-[10px] text-center text-red-600 font-semibold">
          Replaced by {player.replaced_by}
        </div>
      )}
    </div>
  );
}

function LivePointsPlayerRow({ player, benchPosition }) {
  const [showPopup, setShowPopup] = useState(false);
  const stats = player.live_stats || {};
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const hasPlayed = stats.minutes > 0;

  const positionColors = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-green-100 text-green-800',
    4: 'bg-red-100 text-red-800',
  };

  // Calculate points breakdown
  const getPointsBreakdown = () => {
    const breakdown = [];

    if (stats.minutes > 0) {
      breakdown.push({ label: `Minutes (${stats.minutes}')`, points: stats.minutes >= 60 ? 2 : 1, color: 'text-gray-700' });
    }
    if (stats.goals_scored > 0) {
      const pointsPerGoal = player.position_id === 4 ? 4 : player.position_id === 3 ? 5 : 6;
      breakdown.push({ label: `Goals (${stats.goals_scored})`, points: stats.goals_scored * pointsPerGoal, color: 'text-green-600' });
    }
    if (stats.assists > 0) {
      breakdown.push({ label: `Assists (${stats.assists})`, points: stats.assists * 3, color: 'text-green-600' });
    }
    if (stats.clean_sheets > 0 && player.position_id <= 3) {
      const csPoints = player.position_id === 1 || player.position_id === 2 ? 4 : 1;
      breakdown.push({ label: 'Clean Sheet', points: csPoints, color: 'text-blue-600' });
    }
    if (stats.goals_conceded > 0 && (player.position_id === 1 || player.position_id === 2)) {
      breakdown.push({ label: `Goals Conceded (${stats.goals_conceded})`, points: -Math.floor(stats.goals_conceded / 2), color: 'text-red-600' });
    }
    if (stats.saves >= 3 && player.position_id === 1) {
      breakdown.push({ label: `Saves (${stats.saves})`, points: Math.floor(stats.saves / 3), color: 'text-gray-700' });
    }
    if (stats.penalties_saved > 0) {
      breakdown.push({ label: `Penalties Saved (${stats.penalties_saved})`, points: stats.penalties_saved * 5, color: 'text-green-600' });
    }
    if (stats.penalties_missed > 0) {
      breakdown.push({ label: `Penalties Missed (${stats.penalties_missed})`, points: stats.penalties_missed * -2, color: 'text-red-600' });
    }
    if (stats.yellow_cards > 0) {
      breakdown.push({ label: `Yellow Cards (${stats.yellow_cards})`, points: stats.yellow_cards * -1, color: 'text-yellow-600' });
    }
    if (stats.red_cards > 0) {
      breakdown.push({ label: `Red Cards (${stats.red_cards})`, points: stats.red_cards * -3, color: 'text-red-600' });
    }
    if (stats.own_goals > 0) {
      breakdown.push({ label: `Own Goals (${stats.own_goals})`, points: stats.own_goals * -2, color: 'text-red-600' });
    }
    if (stats.bonus > 0) {
      breakdown.push({ label: 'Bonus Points', points: stats.bonus, color: 'text-purple-600' });
    }

    return breakdown;
  };

  const breakdown = getPointsBreakdown();

  return (
    <div className="relative group">
      <div
        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
          isPlaying ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-fpl-purple'
        } ${benchPosition ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => setShowPopup(true)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {benchPosition && (
            <div className="bg-gray-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
              {benchPosition}
            </div>
          )}

          <div className={`${positionColors[player.position_id]} px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0`}>
            {player.position_name}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900 truncate">{player.web_name}</span>
              {player.is_captain && (
                <span className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">C</span>
              )}
              {player.is_vice_captain && (
                <span className="bg-gray-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">V</span>
              )}
              {player.auto_sub && !player.subbed_out && (
                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">AUTO</span>
              )}
              {isPlaying && (
                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded animate-pulse shrink-0">
                  LIVE
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {player.team_short} • {stats.minutes || 0}&apos;
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-fpl-purple">
            {player.is_captain ? stats.total_points * player.multiplier : stats.total_points}
          </div>
        </div>

        {/* Hover Tooltip */}
        {hasPlayed && breakdown.length > 0 && (
          <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-20 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl whitespace-nowrap">
              <div className="font-semibold mb-1">Quick Points</div>
              {breakdown.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between gap-3">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.points > 0 ? '+' : ''}{item.points}</span>
                </div>
              ))}
              {breakdown.length > 3 && (
                <div className="text-gray-400 text-[10px] mt-1">Click for full breakdown</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{player.web_name}</h3>
                  <p className="text-sm text-gray-600">{player.team_short} • {player.position_name}</p>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Points Summary */}
            <div className="bg-fpl-purple text-white rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">Total Points</div>
                <div className="text-4xl font-bold">{stats.total_points}</div>
                {player.is_captain && (
                  <div className="text-sm opacity-90 mt-2">
                    Captain (×{player.multiplier}) = {stats.total_points * player.multiplier} pts
                  </div>
                )}
              </div>
            </div>

            {/* Points Breakdown */}
            {hasPlayed ? (
              <div className="space-y-2">
                <div className="font-semibold text-gray-900 mb-3">Points Breakdown</div>
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className={`text-sm ${item.color}`}>{item.label}</span>
                    <span className={`font-bold ${item.color}`}>
                      {item.points > 0 ? '+' : ''}{item.points}
                    </span>
                  </div>
                ))}
                {stats.bps > 0 && (
                  <div className="flex justify-between items-center py-2 text-xs text-gray-500">
                    <span>BPS Score</span>
                    <span>{stats.bps}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                {player.fixtures?.some(f => !f.started) ? 'Match not started' : 'Did not play'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

