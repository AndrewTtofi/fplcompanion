export default function EnhancedPitchView({ players, showFixtures = true }) {
  // Group players by position
  const grouped = {
    GK: players.filter(p => p.position_id === 1),
    DEF: players.filter(p => p.position_id === 2),
    MID: players.filter(p => p.position_id === 3),
    FWD: players.filter(p => p.position_id === 4),
  };

  return (
    <div className="pitch-view rounded-lg p-8 shadow-lg min-h-[600px]">
      <div className="space-y-8">
        {/* Forwards */}
        <div className="flex justify-center items-start gap-4 flex-wrap">
          {grouped.FWD.map(player => (
            <EnhancedPlayerJersey
              key={player.element}
              player={player}
              type="fwd"
              showFixtures={showFixtures}
            />
          ))}
        </div>

        {/* Midfielders */}
        <div className="flex justify-center items-start gap-4 flex-wrap">
          {grouped.MID.map(player => (
            <EnhancedPlayerJersey
              key={player.element}
              player={player}
              type="mid"
              showFixtures={showFixtures}
            />
          ))}
        </div>

        {/* Defenders */}
        <div className="flex justify-center items-start gap-4 flex-wrap">
          {grouped.DEF.map(player => (
            <EnhancedPlayerJersey
              key={player.element}
              player={player}
              type="def"
              showFixtures={showFixtures}
            />
          ))}
        </div>

        {/* Goalkeeper */}
        <div className="flex justify-center items-start">
          {grouped.GK.map(player => (
            <EnhancedPlayerJersey
              key={player.element}
              player={player}
              type="gk"
              showFixtures={showFixtures}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EnhancedPlayerJersey({ player, type, showFixtures }) {
  const stats = player.live_stats || {
    minutes: player.minutes || 0,
    total_points: player.live_points || 0,
    goals_scored: player.goals || 0,
    assists: player.assists || 0,
    clean_sheets: player.clean_sheets || 0,
    bonus: player.bonus || 0,
    yellow_cards: player.yellow_cards || 0,
    red_cards: player.red_cards || 0
  };

  const displayPoints = player.is_captain
    ? stats.total_points * (player.multiplier || 2)
    : stats.total_points;

  const hasPlayed = stats.minutes > 0;
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const yetToPlay = player.fixtures?.some(f => !f.started);

  return (
    <div className="relative group">
      {/* Jersey Card */}
      <div
        className={`jersey jersey-${type} w-32 relative ${
          isPlaying ? 'ring-2 ring-green-400 animate-pulse' : ''
        }`}
      >
        {/* Captain/Vice Captain Badge */}
        {player.is_captain && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow z-10">
            C
          </div>
        )}
        {player.is_vice_captain && (
          <div className="absolute -top-2 -right-2 bg-gray-300 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow z-10">
            V
          </div>
        )}

        {/* Live Indicator */}
        {isPlaying && (
          <div className="absolute -top-1 -left-1 z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        )}

        {/* Player Info */}
        <div className="text-xs font-bold truncate mb-1">{player.web_name}</div>
        <div className="text-xs opacity-90 mb-1">{player.team_short}</div>

        {/* Fixture Info */}
        {showFixtures && player.fixtures && player.fixtures.length > 0 && (
          <div className="text-[10px] opacity-80 mb-2 space-y-0.5">
            {player.fixtures.slice(0, 2).map((fixture, idx) => (
              <div key={idx} className={fixture.started && !fixture.finished ? 'font-bold' : ''}>
                {fixture.isHome ? 'v' : '@'} {fixture.opponent}
                {fixture.score && <span className="ml-1">({fixture.score})</span>}
              </div>
            ))}
          </div>
        )}

        {/* Points */}
        <div className={`text-3xl font-bold mb-1 ${displayPoints > 0 ? 'text-yellow-300' : 'text-white'}`}>
          {displayPoints}
        </div>

        {/* Captain Multiplier */}
        {player.is_captain && stats.total_points > 0 && (
          <div className="text-[10px] opacity-75 mb-1">
            {stats.total_points} × {player.multiplier || 2}
          </div>
        )}

        {/* Quick Stats */}
        {hasPlayed && (
          <div className="text-xs mt-2 space-y-0.5 opacity-90">
            <div className="flex justify-center gap-2 flex-wrap">
              {stats.goals_scored > 0 && <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded">⚽{stats.goals_scored}</span>}
              {stats.assists > 0 && <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded">🅰️{stats.assists}</span>}
              {stats.clean_sheets > 0 && <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded">CS</span>}
              {stats.defensive_contribution > 0 && <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded">DC</span>}
              {stats.bonus > 0 && <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded">⭐{stats.bonus}</span>}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        {!hasPlayed && yetToPlay && (
          <div className="text-xs mt-2 bg-blue-500 bg-opacity-30 px-2 py-1 rounded">
            To Play
          </div>
        )}
        {!hasPlayed && !yetToPlay && (
          <div className="text-xs mt-2 opacity-50">DNP</div>
        )}

        {/* Cards */}
        {(stats.yellow_cards > 0 || stats.red_cards > 0) && (
          <div className="flex justify-center gap-1 mt-1">
            {stats.yellow_cards > 0 && (
              <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
            )}
            {stats.red_cards > 0 && (
              <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Tooltip on Hover */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
        <div className="bg-gray-900 text-white rounded-lg p-3 shadow-xl text-xs whitespace-nowrap">
          <div className="font-bold mb-2">{player.player_name || player.web_name}</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Price:</span>
              <span>£{player.now_cost}m</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Minutes:</span>
              <span>{stats.minutes}&apos;</span>
            </div>
            {stats.goals_scored > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Goals:</span>
                <span>{stats.goals_scored}</span>
              </div>
            )}
            {stats.assists > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Assists:</span>
                <span>{stats.assists}</span>
              </div>
            )}
            {stats.clean_sheets > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Clean Sheets:</span>
                <span>{stats.clean_sheets}</span>
              </div>
            )}
            {stats.bonus > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Bonus:</span>
                <span>{stats.bonus}</span>
              </div>
            )}
            {stats.goals_conceded > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Goals Conceded:</span>
                <span>{stats.goals_conceded}</span>
              </div>
            )}
            {stats.saves > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Saves:</span>
                <span>{stats.saves}</span>
              </div>
            )}
          </div>

          {/* Fixtures in tooltip */}
          {player.fixtures && player.fixtures.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-400 mb-1">Fixtures:</div>
              {player.fixtures.map((f, idx) => (
                <div key={idx} className="text-xs">
                  {f.isHome ? 'vs' : '@'} {f.opponent}
                  {f.finished ? ' ✓' : f.started ? ' (LIVE)' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
