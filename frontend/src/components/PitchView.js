export default function PitchView({ startingXI, bench }) {
  // Group players by position
  const grouped = {
    GK: startingXI.filter(p => p.position_id === 1),
    DEF: startingXI.filter(p => p.position_id === 2),
    MID: startingXI.filter(p => p.position_id === 3),
    FWD: startingXI.filter(p => p.position_id === 4),
  };

  return (
    <div className="space-y-6">
      {/* Pitch */}
      <div className="pitch-view rounded-lg p-8 shadow-lg">
        <div className="space-y-8">
          {/* Forwards */}
          <div className="flex justify-center items-center gap-4">
            {grouped.FWD.map(player => (
              <PlayerJersey key={player.element} player={player} type="fwd" />
            ))}
          </div>

          {/* Midfielders */}
          <div className="flex justify-center items-center gap-4">
            {grouped.MID.map(player => (
              <PlayerJersey key={player.element} player={player} type="mid" />
            ))}
          </div>

          {/* Defenders */}
          <div className="flex justify-center items-center gap-4">
            {grouped.DEF.map(player => (
              <PlayerJersey key={player.element} player={player} type="def" />
            ))}
          </div>

          {/* Goalkeeper */}
          <div className="flex justify-center items-center">
            {grouped.GK.map(player => (
              <PlayerJersey key={player.element} player={player} type="gk" />
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Substitutes</h3>
        <div className="flex justify-center items-center gap-4">
          {bench.map(player => (
            <PlayerJersey key={player.element} player={player} type="bench" isBench />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerJersey({ player, type, isBench = false }) {
  const points = player.is_captain ? player.live_points * player.multiplier : player.live_points;

  return (
    <div className="relative">
      <div className={`jersey jersey-${type} w-28`}>
        {/* Captain/Vice Captain Badge */}
        {player.is_captain && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow">
            C
          </div>
        )}
        {player.is_vice_captain && (
          <div className="absolute -top-2 -right-2 bg-gray-300 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow">
            V
          </div>
        )}

        {/* Player Name */}
        <div className="text-xs font-bold truncate mb-1">{player.web_name}</div>

        {/* Team */}
        <div className="text-xs opacity-90 mb-2">{player.team_short}</div>

        {/* Points Badge */}
        <div className={`text-2xl font-bold ${points > 0 ? 'text-yellow-300' : ''}`}>
          {points}
        </div>

        {/* Stats */}
        {!isBench && player.minutes > 0 && (
          <div className="text-xs mt-2 space-y-0.5 opacity-90">
            {player.goals > 0 && <div>⚽ {player.goals}</div>}
            {player.assists > 0 && <div>🅰️ {player.assists}</div>}
            {player.clean_sheets > 0 && <div>🛡️ CS</div>}
            {player.bonus > 0 && <div>⭐ {player.bonus}</div>}
          </div>
        )}

        {/* Not played indicator */}
        {player.minutes === 0 && (
          <div className="text-xs mt-2 opacity-75">DNP</div>
        )}
      </div>
    </div>
  );
}
