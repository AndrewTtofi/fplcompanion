import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { LayoutGrid, List, Users } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Jersey from './Jersey';

export default function FootballFieldView({ teamId, gameweek }) {
  const [viewMode, setViewMode] = useState('field'); // 'field' or 'list'

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
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-white text-fpl-purple shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List size={18} />
            List View
          </button>
        </div>
      </div>

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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Starting XI */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Starting XI</h3>
            <div className="space-y-2">
              {['FWD', 'MID', 'DEF', 'GK'].map(position => (
                <div key={position}>
                  {grouped[position].length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mt-4 mb-2">
                        {position === 'GK' ? 'Goalkeeper' : position === 'DEF' ? 'Defenders' : position === 'MID' ? 'Midfielders' : 'Forwards'}
                      </h4>
                      {grouped[position].map(player => (
                        <ListPlayerRow key={player.element} player={player} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bench */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Substitutes</h3>
            <div className="space-y-2">
              {bench.map((player, index) => (
                <ListPlayerRow key={player.element} player={player} benchPosition={index + 1} />
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
    <div className="relative">
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

      {/* Hover Card */}
      <div className="absolute z-10 bottom-full mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl w-48 space-y-1">
          <div className="font-bold border-b border-gray-700 pb-1">{player.web_name}</div>
          <div className="text-gray-300">{player.team_short} • {player.position_name} • £{player.now_cost}m</div>
          {hasPlayed && (
            <>
              <div className="border-t border-gray-700 pt-1 mt-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Minutes:</span>
                  <span>{stats.minutes}&apos;</span>
                </div>
                {stats.goals_scored > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Goals:</span>
                    <span className="text-green-400">{stats.goals_scored}</span>
                  </div>
                )}
                {stats.assists > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assists:</span>
                    <span className="text-green-400">{stats.assists}</span>
                  </div>
                )}
              </div>
            </>
          )}
          {!hasPlayed && (
            <div className="text-gray-400 text-center py-1">Yet to play</div>
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
    <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-md flex flex-col items-center min-w-[100px] relative">
      {/* Bench Position Badge */}
      <div className="absolute -top-2 -left-2 bg-gray-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10">
        {position}
      </div>

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
    </div>
  );
}

function ListPlayerRow({ player, benchPosition }) {
  const stats = player.live_stats || {};
  const hasPlayed = stats.minutes > 0;
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);

  const positionColors = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-green-100 text-green-800',
    4: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
      isPlaying ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
    } ${benchPosition ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {benchPosition && (
          <div className="bg-gray-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
            {benchPosition}
          </div>
        )}

        <div className={`${positionColors[player.position_id]} px-2 py-1 rounded text-xs font-bold shrink-0`}>
          {player.position_name}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 truncate">{player.web_name}</span>
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
          <div className="text-sm text-gray-600">
            {player.team_short} • £{player.now_cost}m
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {hasPlayed && (
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <div className="text-center">
              <div className="text-gray-500 text-xs">MIN</div>
              <div className="font-semibold">{stats.minutes}&apos;</div>
            </div>
            {stats.goals_scored > 0 && (
              <div className="text-center">
                <div className="text-gray-500 text-xs">G</div>
                <div className="font-semibold text-green-600">{stats.goals_scored}</div>
              </div>
            )}
            {stats.assists > 0 && (
              <div className="text-center">
                <div className="text-gray-500 text-xs">A</div>
                <div className="font-semibold text-green-600">{stats.assists}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-right">
          <div className="text-2xl font-bold text-fpl-purple">
            {player.is_captain ? stats.total_points * player.multiplier : stats.total_points}
          </div>
          {player.is_captain && stats.total_points > 0 && (
            <div className="text-xs text-gray-500">
              {stats.total_points} × {player.multiplier}
            </div>
          )}
          {!hasPlayed && (
            <div className="text-xs text-gray-500">-</div>
          )}
        </div>
      </div>
    </div>
  );
}
