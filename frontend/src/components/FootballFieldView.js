import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { LayoutGrid, Users, TrendingUp } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Jersey from './Jersey';

export default function FootballFieldView({ teamId, gameweek }) {
  const router = useRouter();
  const { mode } = router.query;

  const [viewMode, setViewMode] = useState(mode || 'live'); // 'live' or 'field'

  // Update viewMode when URL changes
  useEffect(() => {
    if (mode) {
      setViewMode(mode);
    }
  }, [mode]);

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
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* View Toggle - Fixed Height */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">
          Gameweek {gameweek} Squad
        </h2>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setViewMode('live');
              // Update URL with all query parameters
              const currentTab = router.query.tab || 'gameweek';
              const currentView = router.query.view || 'field';
              router.push(`/team/${teamId}?tab=${currentTab}&view=${currentView}&mode=live`, undefined, { shallow: true });
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'live'
                ? 'bg-white text-fpl-purple shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={16} />
            <span className="text-sm">Live Points</span>
          </button>
          <button
            onClick={() => {
              setViewMode('field');
              // Update URL with all query parameters
              const currentTab = router.query.tab || 'gameweek';
              const currentView = router.query.view || 'field';
              router.push(`/team/${teamId}?tab=${currentTab}&view=${currentView}&mode=field`, undefined, { shallow: true });
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'field'
                ? 'bg-white text-fpl-purple shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={16} />
            <span className="text-sm">Field View</span>
          </button>
        </div>
      </div>

      {/* Live Points View */}
      {viewMode === 'live' && (
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Left Column - Summary Stats */}
            <div className="space-y-2 flex flex-col">
              {/* Total Points Card */}
              <div className="bg-gradient-to-br from-fpl-purple to-purple-700 rounded-lg p-3 text-white shadow-lg flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5">Total Live Points</div>
                  <div className="text-3xl font-bold">{data.total_live_points}</div>
                  {data.transfers.cost > 0 && (
                    <div className="text-[10px] opacity-90 mt-0.5">
                      -{data.transfers.cost} pts
                    </div>
                  )}
                </div>
              </div>

              {/* Bench Points Card */}
              <div className="bg-white rounded-lg p-3 shadow-md flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Bench Points</div>
                  <div className="text-2xl font-bold text-gray-700">{data.bench_points}</div>
                </div>
              </div>

              {/* Transfers Card */}
              <div className="bg-white rounded-lg p-3 shadow-md flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Transfers Made</div>
                  <div className="text-2xl font-bold text-gray-700">{data.transfers.made}</div>
                  {data.transfers.cost > 0 && (
                    <div className="text-[10px] text-red-600 mt-0.5">-{data.transfers.cost} pts</div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Starting XI */}
            <div className="bg-white rounded-lg shadow-md p-3 flex flex-col min-h-0">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex-shrink-0">Starting XI</h3>
              <div className="flex-1 overflow-hidden min-h-0">
                <div className="space-y-0.5 h-full flex flex-col justify-around">
                  {starting_xi.map(player => (
                    <LivePointsPlayerRow key={player.element} player={player} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Bench */}
            <div className="bg-white rounded-lg shadow-md p-3 flex flex-col min-h-0">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex-shrink-0">Substitutes</h3>
              <div className="flex-1 overflow-hidden min-h-0">
                <div className="space-y-0.5 h-full flex flex-col justify-around">
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
        <div className="flex flex-col h-full">
          {/* Football Field */}
          <div className="flex-1 flex items-center justify-center p-4" style={{ overflow: 'visible' }}>
            <div
              className="relative w-full rounded-lg shadow-xl"
              style={{
                background: 'linear-gradient(180deg, #37734a 0%, #4a8c5f 50%, #37734a 100%)',
                maxWidth: '700px',
                aspectRatio: '4/3',
                overflow: 'visible'
              }}
            >
              {/* Grass pattern */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 60px, transparent 60px, transparent 120px)'
                }}
              />

              {/* Field lines */}
              <div className="absolute inset-0">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/30" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 border-2 border-white/30 border-t-0" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 border-2 border-white/30 border-b-0" />
              </div>

              {/* Players */}
              <div className="absolute inset-0 p-8">
                <div className="h-full flex flex-col justify-between">
                  {/* Goalkeeper */}
                  <div className="flex justify-center">
                    {grouped.GK.map(player => (
                      <PlayerCard key={player.element} player={player} />
                    ))}
                  </div>

                  {/* Defenders */}
                  <div className="flex justify-center gap-6">
                    {grouped.DEF.map(player => (
                      <PlayerCard key={player.element} player={player} />
                    ))}
                  </div>

                  {/* Midfielders */}
                  <div className="flex justify-center gap-6">
                    {grouped.MID.map(player => (
                      <PlayerCard key={player.element} player={player} />
                    ))}
                  </div>

                  {/* Forwards */}
                  <div className="flex justify-center gap-6">
                    {grouped.FWD.map(player => (
                      <PlayerCard key={player.element} player={player} hoverAbove={true} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Substitutes */}
          <div className="flex-shrink-0 p-4">
            <div className="bg-gray-100 rounded-lg py-3 px-6 mx-auto flex justify-center gap-8" style={{ maxWidth: '1000px' }}>
              {bench.map(player => (
                <PlayerCard key={player.element} player={player} hoverAbove={true} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player, hoverAbove = false }) {
  const stats = player.live_stats || {};
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const hasPlayed = stats.minutes > 0;

  return (
    <div className="relative group player-card-hover">
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
      />

      {/* Hover Card with Points Breakdown */}
      <div className={`absolute ${hoverAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 hidden group-hover:block`} style={{ zIndex: 9999 }}>
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl w-56 space-y-2 pointer-events-auto">
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
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const rowRef = React.useRef(null);
  const stats = player.live_stats || {};
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const hasPlayed = stats.minutes > 0;

  // Calculate popup position when hovering
  const handleMouseEnter = () => {
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      const popupWidth = 288; // 72 * 4 = 288px (w-72)
      const margin = 12;

      const viewportWidth = window.innerWidth;

      // Always align vertically with the player row
      let top = rect.top;
      let left = rect.right + margin;

      // For substitutes (bench), open to the left if it would go off-screen on right
      // Or if there's more space on the left
      if (benchPosition || (rect.right + margin + popupWidth > viewportWidth)) {
        // Position to the left of the row
        left = rect.left - popupWidth - margin;

        // If that would go off-screen on the left, try right side anyway
        if (left < 0) {
          left = rect.right + margin;
          // If still off-screen, position at edge with small margin
          if (left + popupWidth > viewportWidth) {
            left = viewportWidth - popupWidth - margin;
          }
        }
      }

      // Ensure minimum left margin
      left = Math.max(margin, left);

      setPopupPosition({ top, left });
    }
  };

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
        ref={rowRef}
        className={`flex items-center justify-between p-1 rounded border transition-all cursor-pointer ${
          isPlaying ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-fpl-purple'
        } ${benchPosition ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => setShowPopup(true)}
        onMouseEnter={handleMouseEnter}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {benchPosition && (
            <div className="bg-gray-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
              {benchPosition}
            </div>
          )}

          <div className={`${positionColors[player.position_id]} px-1 py-0.5 rounded text-[9px] font-bold shrink-0`}>
            {player.position_name}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs text-gray-900 truncate">{player.web_name}</span>
              {player.is_captain && (
                <span className="bg-yellow-500 text-white text-[8px] px-1 py-0.5 rounded font-bold shrink-0">C</span>
              )}
              {player.is_vice_captain && (
                <span className="bg-gray-600 text-white text-[8px] px-1 py-0.5 rounded font-bold shrink-0">V</span>
              )}
              {player.auto_sub && !player.subbed_out && (
                <span className="bg-green-500 text-white text-[8px] px-1 py-0.5 rounded font-bold shrink-0">A</span>
              )}
              {isPlaying && (
                <span className="bg-green-500 text-white text-[8px] px-1 py-0.5 rounded animate-pulse shrink-0">
                  L
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-600">
              {player.team_short} • {stats.minutes || 0}&apos;
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-fpl-purple">
            {player.is_captain ? stats.total_points * player.multiplier : stats.total_points}
          </div>
        </div>
      </div>

      {/* Beautiful Hover Popup */}
      {popupPosition.top > 0 && popupPosition.left > 0 && (
        <div
          className="live-points-popup hidden group-hover:block pointer-events-none"
          style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
        >
        <div className="bg-white border-2 border-fpl-purple rounded-xl shadow-2xl w-72 overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-fpl-purple to-purple-700 text-white px-4 py-3">
            <div className="font-bold text-sm">{player.web_name}</div>
            <div className="text-xs opacity-90 flex items-center gap-2 mt-1">
              <span>{player.team_short}</span>
              <span>•</span>
              <span>{player.position_name}</span>
              <span>•</span>
              <span>£{player.now_cost}m</span>
            </div>
            {player.is_captain && (
              <div className="mt-2 bg-yellow-500 text-xs font-bold px-2 py-1 rounded inline-block">
                CAPTAIN (×{player.multiplier})
              </div>
            )}
            {player.auto_sub && !player.subbed_out && (
              <div className="mt-2 bg-green-500 text-xs font-bold px-2 py-1 rounded inline-block">
                AUTO-SUBSTITUTION
              </div>
            )}
          </div>

          {/* Match Status / Points Display */}
          {!hasPlayed && !isPlaying && player.match_not_started ? (
            <div className="px-4 py-6 text-center">
              <div className="text-blue-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-700">Match Not Started</div>
              <div className="text-xs text-gray-500 mt-1">This player has an upcoming fixture</div>
            </div>
          ) : !hasPlayed && !isPlaying ? (
            <div className="px-4 py-6 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-700">Did Not Play</div>
              <div className="text-xs text-gray-500 mt-1">This player did not feature in the gameweek</div>
            </div>
          ) : (
            <>
              {/* Total Points Display */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Total Points</span>
                  <span className="text-2xl font-bold text-fpl-purple">{stats.total_points || 0}</span>
                </div>
                {player.is_captain && (
                  <div className="text-xs text-gray-600 mt-1">
                    With captain bonus: <span className="font-bold text-fpl-purple">{(stats.total_points || 0) * player.multiplier}</span> pts
                  </div>
                )}
                {isPlaying && (
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <span className="animate-pulse">●</span> Match in progress
                  </div>
                )}
              </div>

              {/* Points Breakdown */}
              {breakdown.length > 0 && (
                <div className="px-4 py-3 max-h-64 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Points Breakdown</div>
                  <div className="space-y-1.5">
                    {breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-xs ${item.color}`}>{item.label}</span>
                        <span className={`text-sm font-bold ${item.color}`}>
                          {item.points > 0 ? '+' : ''}{item.points}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* BPS Score */}
                  {stats.bps > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">BPS Score</span>
                        <span className="font-semibold text-purple-600">{stats.bps}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        Bonus Points System score
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer hint */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 text-center">
              Click player name for detailed view
            </div>
          </div>
        </div>
        </div>
      )}

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

