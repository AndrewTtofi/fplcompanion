export default function SquadComparisonView({ team1Name, team2Name, team1Squad, team2Squad, sharedPlayerIds }) {
  const sortByPosition = (players) => {
    return [...players].sort((a, b) => {
      if (a.position_id !== b.position_id) return a.position_id - b.position_id;
      return a.position - b.position;
    });
  };

  const t1Starting = sortByPosition(team1Squad.starting_xi);
  const t2Starting = sortByPosition(team2Squad.starting_xi);
  const t1Bench = team1Squad.bench || [];
  const t2Bench = team2Squad.bench || [];

  const isShared = (elementId) => sharedPlayerIds.includes(elementId);

  const chipLabels = { bboost: 'BB', '3xc': 'TC', freehit: 'FH', wildcard: 'WC' };
  const chipColors = { bboost: 'bg-blue-500', '3xc': 'bg-pink-500', freehit: 'bg-yellow-500', wildcard: 'bg-purple-500' };

  const maxStarters = Math.max(t1Starting.length, t2Starting.length);
  const maxBench = Math.max(t1Bench.length, t2Bench.length);

  return (
    <div>
      {/* Team Headers */}
      <div className="grid grid-cols-2 gap-1 mb-1">
        {[
          { name: team1Name, squad: team1Squad, accent: 'border-fpl-purple' },
          { name: team2Name, squad: team2Squad, accent: 'border-gray-400 dark:border-gray-500' },
        ].map((team, i) => (
          <div key={i} className={`border-l-2 ${team.accent} bg-gray-50 dark:bg-gray-900 rounded-r px-2 py-1`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] md:text-sm font-bold text-gray-900 dark:text-white truncate">
                {team.name}
              </span>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {chipLabels[team.squad.active_chip] && (
                  <span className={`${chipColors[team.squad.active_chip]} text-white text-[8px] font-bold px-1 rounded`}>
                    {chipLabels[team.squad.active_chip]}
                  </span>
                )}
                <span className="text-xs md:text-sm font-bold text-fpl-purple dark:text-fpl-green">
                  {team.squad.net_points}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Starting XI */}
      <div>
        {Array.from({ length: maxStarters }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-1">
            {t1Starting[idx] ? (
              <PlayerRow player={t1Starting[idx]} isShared={isShared(t1Starting[idx].element)} />
            ) : <div />}
            {t2Starting[idx] ? (
              <PlayerRow player={t2Starting[idx]} isShared={isShared(t2Starting[idx].element)} />
            ) : <div />}
          </div>
        ))}
      </div>

      {/* Bench divider + rows */}
      {maxBench > 0 && (
        <div>
          <div className="grid grid-cols-2 gap-1 my-0.5">
            <div className="border-t border-dashed border-gray-300 dark:border-gray-600" />
            <div className="border-t border-dashed border-gray-300 dark:border-gray-600" />
          </div>
          {Array.from({ length: maxBench }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-1">
              {t1Bench[idx] ? (
                <PlayerRow player={t1Bench[idx]} isShared={isShared(t1Bench[idx].element)} />
              ) : <div />}
              {t2Bench[idx] ? (
                <PlayerRow player={t2Bench[idx]} isShared={isShared(t2Bench[idx].element)} />
              ) : <div />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const posColors = {
  1: 'text-yellow-600 dark:text-yellow-400',
  2: 'text-blue-600 dark:text-blue-400',
  3: 'text-green-600 dark:text-green-400',
  4: 'text-red-600 dark:text-red-400',
};

function PlayerRow({ player, isShared }) {
  const stats = player.live_stats || {};
  const isPlaying = player.fixtures?.some(f => f.started && !f.finished);
  const hasPlayed = stats.minutes > 0;
  const matchNotStarted = player.match_not_started;

  const displayPoints = player.is_captain
    ? stats.total_points * (player.multiplier || 2)
    : stats.total_points;

  const getStatusBadge = () => {
    if (isPlaying) return `${stats.minutes}'`;
    if (hasPlayed && stats.minutes > 0) return `${stats.minutes}'`;
    if (matchNotStarted) {
      const nextFixture = player.fixtures?.find(f => !f.started);
      if (nextFixture?.kickoff) {
        const d = new Date(nextFixture.kickoff);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div className={`flex items-center h-[26px] md:h-[30px] px-1 rounded ${
      isShared ? 'bg-blue-50 dark:bg-blue-900/20' : ''
    }`}>
      {/* Position */}
      <span className={`text-[8px] md:text-[9px] font-bold w-4 md:w-5 shrink-0 ${posColors[player.position_id] || 'text-gray-500'}`}>
        {player.position_name}
      </span>

      {/* Name + badges */}
      <div className="flex items-center gap-0.5 min-w-0 flex-1">
        <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white truncate">
          {player.web_name}
        </span>
        {player.is_captain && (
          <span className="bg-yellow-500 text-white text-[7px] md:text-[8px] w-3 h-3 md:w-3.5 md:h-3.5 flex items-center justify-center rounded-full font-bold shrink-0">C</span>
        )}
        {player.is_vice_captain && (
          <span className="bg-gray-400 text-white text-[7px] md:text-[8px] w-3 h-3 md:w-3.5 md:h-3.5 flex items-center justify-center rounded-full font-bold shrink-0">V</span>
        )}
        {isPlaying && (
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
        )}
      </div>

      {/* Status */}
      {statusBadge && (
        <span className={`text-[8px] md:text-[9px] shrink-0 mx-0.5 ${
          isPlaying ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {statusBadge}
        </span>
      )}

      {/* Points */}
      <span className={`text-[10px] md:text-xs font-bold shrink-0 w-4 md:w-5 text-right ${
        hasPlayed || isPlaying
          ? 'text-fpl-purple dark:text-fpl-green'
          : 'text-gray-300 dark:text-gray-600'
      }`}>
        {displayPoints}
      </span>
    </div>
  );
}
