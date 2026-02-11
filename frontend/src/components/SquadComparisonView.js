import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { X, Loader2, Users } from 'lucide-react';

export default function SquadComparisonView({ team1Name, team2Name, team1Squad, team2Squad, sharedPlayerIds, leagueId }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

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
              <PlayerRow player={t1Starting[idx]} isShared={isShared(t1Starting[idx].element)} onClick={() => setSelectedPlayer(t1Starting[idx])} />
            ) : <div />}
            {t2Starting[idx] ? (
              <PlayerRow player={t2Starting[idx]} isShared={isShared(t2Starting[idx].element)} onClick={() => setSelectedPlayer(t2Starting[idx])} />
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
                <PlayerRow player={t1Bench[idx]} isShared={isShared(t1Bench[idx].element)} onClick={() => setSelectedPlayer(t1Bench[idx])} />
              ) : <div />}
              {t2Bench[idx] ? (
                <PlayerRow player={t2Bench[idx]} isShared={isShared(t2Bench[idx].element)} onClick={() => setSelectedPlayer(t2Bench[idx])} />
              ) : <div />}
            </div>
          ))}
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          leagueId={leagueId}
        />
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

const posBgColors = {
  1: 'bg-yellow-500',
  2: 'bg-blue-500',
  3: 'bg-green-500',
  4: 'bg-red-500',
};

const posHexColors = {
  1: '#eab308',
  2: '#3b82f6',
  3: '#22c55e',
  4: '#ef4444',
};

const getTeamBadgeUrl = (teamCode) =>
  teamCode ? `https://resources.premierleague.com/premierleague/badges/t${teamCode}.png` : null;

const getPlayerPhotoUrl = (photo) => {
  if (!photo) return null;
  const code = photo.replace('.jpg', '.png');
  return `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}`;
};

function PlayerRow({ player, isShared, onClick }) {
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
  const badgeUrl = getTeamBadgeUrl(player.team_code);

  return (
    <div
      className={`flex items-center h-[26px] md:h-[30px] px-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isShared ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={onClick}
    >
      {/* Team badge */}
      {badgeUrl ? (
        <img src={badgeUrl} alt="" className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 mr-0.5 object-contain" />
      ) : (
        <span className={`text-[8px] md:text-[9px] font-bold w-4 md:w-5 shrink-0 ${posColors[player.position_id] || 'text-gray-500'}`}>
          {player.position_name}
        </span>
      )}

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

const fdrColors = {
  1: 'bg-emerald-600 text-white',
  2: 'bg-green-500 text-white',
  3: 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white',
  4: 'bg-red-500 text-white',
  5: 'bg-red-800 text-white',
};

function PlayerDetailModal({ player, onClose, leagueId }) {
  const [activeTab, setActiveTab] = useState('summary');
  const stats = player.live_stats || {};

  const { data: detail, isLoading } = useSWR(
    player.element ? ['player-detail', player.element] : null,
    () => api.getPlayerDetail(player.element).then(res => res.data),
    { revalidateOnFocus: false }
  );

  const { data: leagueOwnership } = useSWR(
    player.element && leagueId ? ['player-league-ownership', player.element, leagueId] : null,
    () => api.getPlayerLeagueOwnership(player.element, leagueId).then(res => res.data),
    { revalidateOnFocus: false }
  );

  const info = detail?.player_info;
  const history = detail?.history || [];
  const upcoming = detail?.fixtures || [];

  // Points breakdown from current GW
  const getPointsBreakdown = () => {
    const breakdown = [];
    if (stats.minutes > 0) breakdown.push({ label: `Minutes (${stats.minutes}')`, pts: stats.minutes >= 60 ? 2 : 1 });
    if (stats.goals_scored > 0) {
      const ppg = player.position_id === 4 ? 4 : player.position_id === 3 ? 5 : 6;
      breakdown.push({ label: `Goals (${stats.goals_scored})`, pts: stats.goals_scored * ppg, color: 'text-green-600' });
    }
    if (stats.assists > 0) breakdown.push({ label: `Assists (${stats.assists})`, pts: stats.assists * 3, color: 'text-green-600' });
    if (stats.clean_sheets > 0 && player.position_id <= 3) {
      const cs = player.position_id <= 2 ? 4 : 1;
      breakdown.push({ label: 'Clean Sheet', pts: cs, color: 'text-blue-600' });
    }
    if (stats.goals_conceded > 0 && player.position_id <= 2) {
      breakdown.push({ label: `Goals Conceded (${stats.goals_conceded})`, pts: -Math.floor(stats.goals_conceded / 2), color: 'text-red-600' });
    }
    if (stats.saves >= 3 && player.position_id === 1) breakdown.push({ label: `Saves (${stats.saves})`, pts: Math.floor(stats.saves / 3) });
    if (stats.penalties_saved > 0) breakdown.push({ label: 'Pen Saved', pts: stats.penalties_saved * 5, color: 'text-green-600' });
    if (stats.penalties_missed > 0) breakdown.push({ label: 'Pen Missed', pts: -stats.penalties_missed * 2, color: 'text-red-600' });
    if (stats.yellow_cards > 0) breakdown.push({ label: 'Yellow Card', pts: -stats.yellow_cards, color: 'text-yellow-600' });
    if (stats.red_cards > 0) breakdown.push({ label: 'Red Card', pts: -stats.red_cards * 3, color: 'text-red-600' });
    if (stats.own_goals > 0) breakdown.push({ label: 'Own Goal', pts: -stats.own_goals * 2, color: 'text-red-600' });
    if (player.points_breakdown?.some(b => b.identifier === 'defensive_contribution')) {
      breakdown.push({ label: 'Defensive Contrib.', pts: 2, color: 'text-cyan-600' });
    }
    if (stats.bonus > 0) breakdown.push({ label: 'Bonus', pts: stats.bonus, color: 'text-purple-600' });
    return breakdown;
  };

  const breakdown = getPointsBreakdown();
  const last5 = history.slice(-5).reverse();

  const tabs = [
    { id: 'summary', label: 'Summary' },
    ...(leagueId ? [{ id: 'league', label: 'League' }] : []),
    { id: 'previous', label: 'Previous' },
    { id: 'upcoming', label: 'Upcoming' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center pt-3 md:pt-8 px-2" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] md:max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with player photo */}
        <div className={`${posBgColors[player.position_id] || 'bg-gray-600'} text-white relative overflow-hidden rounded-t-lg`}>
          {/* Player photo background */}
          {(player.photo || info?.photo) && (
            <div className="absolute right-0 top-0 bottom-0 w-32 md:w-40">
              <div
                className="absolute inset-0 z-10"
                style={{ background: `linear-gradient(to right, ${posHexColors[player.position_id] || '#4b5563'}, transparent)` }}
              />
              <img
                src={getPlayerPhotoUrl(player.photo || info?.photo)}
                alt=""
                className="absolute right-0 bottom-0 h-full w-auto object-cover object-top opacity-60"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          {/* Team badge watermark */}
          {player.team_code && (
            <img
              src={getTeamBadgeUrl(player.team_code)}
              alt=""
              className="absolute right-2 top-2 w-8 h-8 opacity-30 z-20"
            />
          )}
          <div className="relative z-20 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-bold text-lg truncate">{player.web_name}</div>
                <div className="text-sm opacity-90">
                  {player.team_short} &middot; {player.position_name}
                  {info && <> &middot; {info.now_cost}m</>}
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white shrink-0 ml-2">
                <X size={20} />
              </button>
            </div>

            {/* Fixtures this GW */}
            {player.fixtures?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {player.fixtures.map((f, i) => (
                  <div key={i} className="bg-white/20 rounded px-2 py-0.5 text-xs">
                    {f.opponent} ({f.isHome ? 'H' : 'A'})
                    {f.started && !f.finished && <span className="ml-1 animate-pulse">LIVE</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current GW Points */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">GW Points</span>
            <span className="text-2xl font-bold text-fpl-purple dark:text-fpl-green">
              {player.is_captain ? stats.total_points * (player.multiplier || 2) : stats.total_points}
            </span>
          </div>
          {player.is_captain && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              Captain &times;{player.multiplier || 2} ({stats.total_points} base)
            </div>
          )}
        </div>

        {/* Stats Row */}
        {info && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-4 text-center">
              <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Owned</div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{info.selected_by_percent}%</div>
              </div>
              <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Form</div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{info.form}</div>
              </div>
              <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Pts/G</div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{info.points_per_game}</div>
              </div>
              <div className="py-2 h-11 flex flex-col justify-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Total</div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{info.total_points}</div>
              </div>
            </div>
            {leagueOwnership && (
              <div className="grid grid-cols-5 text-center border-t border-gray-200 dark:border-gray-700">
                <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Starts L</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{leagueOwnership.starts_league}%</div>
                </div>
                <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Starts Eff</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{leagueOwnership.starts_effective}%</div>
                </div>
                <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Owned L</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{leagueOwnership.owned_league}%</div>
                </div>
                <div className="py-2 h-11 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Owned All</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{leagueOwnership.owned_overall}%</div>
                </div>
                <div className="py-2 h-11 flex flex-col justify-center">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Price</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{leagueOwnership.price}m</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-fpl-purple dark:text-fpl-green border-b-2 border-fpl-purple dark:border-fpl-green'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-4 py-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-fpl-purple dark:text-fpl-green" size={24} />
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && !isLoading && (
            <div className="space-y-3">
              {/* Points Breakdown */}
              {breakdown.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Points Breakdown</div>
                  <div className="space-y-1">
                    {breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className={`text-xs ${item.color || 'text-gray-600 dark:text-gray-300'}`}>{item.label}</span>
                        <span className={`text-xs font-bold ${item.color || 'text-gray-900 dark:text-white'}`}>
                          {item.pts > 0 ? '+' : ''}{item.pts}
                        </span>
                      </div>
                    ))}
                  </div>
                  {stats.bps > 0 && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400">BPS Score</span>
                      <span className="text-[10px] font-medium text-gray-500">{stats.bps}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-4">
                  {player.match_not_started ? 'Yet to play' : 'Did not play'}
                </div>
              )}

              {/* Season Stats */}
              {info && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Season Stats</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Goals', val: info.goals_scored },
                      { label: 'Assists', val: info.assists },
                      { label: 'CS', val: info.clean_sheets },
                      { label: 'Starts', val: info.starts },
                      { label: 'Minutes', val: info.minutes },
                      { label: 'Price', val: `${info.now_cost}m` },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded px-2 py-1.5 text-center">
                        <div className="text-[10px] text-gray-400">{s.label}</div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous Tab */}
          {activeTab === 'previous' && !isLoading && (
            <div>
              {history.length > 0 ? (
                <div className="overflow-x-auto -mx-4">
                  <table className="w-full min-w-[320px]">
                    <thead>
                      <tr className="text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-1 px-2">GW</th>
                        <th className="text-left py-1 px-2">Opp</th>
                        <th className="text-center py-1 px-2">Min</th>
                        <th className="text-center py-1 px-2">G</th>
                        <th className="text-center py-1 px-2">A</th>
                        <th className="text-center py-1 px-2">CS</th>
                        <th className="text-center py-1 px-2">Bon</th>
                        <th className="text-right py-1 px-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {last5.map((gw, i) => (
                        <tr key={i} className="text-xs border-b border-gray-100 dark:border-gray-700">
                          <td className="py-1.5 px-2 font-medium text-gray-900 dark:text-white">{gw.round}</td>
                          <td className="py-1.5 px-2 text-gray-600 dark:text-gray-300">
                            {gw.was_home ? '' : '@'}{gw.opponent_team_short || `T${gw.opponent_team}`}
                          </td>
                          <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.minutes}</td>
                          <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.goals_scored || '-'}</td>
                          <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.assists || '-'}</td>
                          <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.clean_sheets || '-'}</td>
                          <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.bonus || '-'}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-fpl-purple dark:text-fpl-green">{gw.total_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Show full history if more than 5 */}
                  {history.length > 5 && (
                    <div className="px-2 pt-2">
                      <details>
                        <summary className="text-xs text-fpl-purple dark:text-fpl-green cursor-pointer font-medium">
                          Show all {history.length} gameweeks
                        </summary>
                        <table className="w-full min-w-[320px] mt-1">
                          <tbody>
                            {history.slice(0, -5).reverse().map((gw, i) => (
                              <tr key={i} className="text-xs border-b border-gray-100 dark:border-gray-700">
                                <td className="py-1.5 px-2 font-medium text-gray-900 dark:text-white">{gw.round}</td>
                                <td className="py-1.5 px-2 text-gray-600 dark:text-gray-300">
                                  {gw.was_home ? '' : '@'}{gw.opponent_team_short || `T${gw.opponent_team}`}
                                </td>
                                <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.minutes}</td>
                                <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.goals_scored || '-'}</td>
                                <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.assists || '-'}</td>
                                <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.clean_sheets || '-'}</td>
                                <td className="py-1.5 px-2 text-center text-gray-600 dark:text-gray-300">{gw.bonus || '-'}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-fpl-purple dark:text-fpl-green">{gw.total_points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-6">No history available</div>
              )}
            </div>
          )}

          {/* League Tab */}
          {activeTab === 'league' && (
            <div>
              {!leagueOwnership ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-fpl-purple dark:text-fpl-green" size={24} />
                </div>
              ) : leagueOwnership.managers.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-6">
                  No one in your league owns this player
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Ownership summary */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Users size={14} />
                    <span>{leagueOwnership.owned_count}/{leagueOwnership.total_managers} managers own this player</span>
                  </div>

                  {/* Starting managers */}
                  {leagueOwnership.managers.filter(m => m.status === 'starting').length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5">
                        Starting ({leagueOwnership.managers.filter(m => m.status === 'starting').length})
                      </div>
                      <div className="space-y-1">
                        {leagueOwnership.managers.filter(m => m.status === 'starting').map(m => (
                          <div key={m.entry_id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded px-2.5 py-1.5">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{m.team_name}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{m.manager_name}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {m.is_captain && (
                                <span className="bg-yellow-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">C</span>
                              )}
                              {m.is_vice_captain && (
                                <span className="bg-gray-400 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">V</span>
                              )}
                              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">XI</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bench managers */}
                  {leagueOwnership.managers.filter(m => m.status === 'bench').length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1.5">
                        Bench ({leagueOwnership.managers.filter(m => m.status === 'bench').length})
                      </div>
                      <div className="space-y-1">
                        {leagueOwnership.managers.filter(m => m.status === 'bench').map(m => (
                          <div key={m.entry_id} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded px-2.5 py-1.5">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{m.team_name}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{m.manager_name}</div>
                            </div>
                            <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 shrink-0 ml-2">SUB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Tab */}
          {activeTab === 'upcoming' && !isLoading && (
            <div>
              {upcoming.length > 0 ? (
                <div className="space-y-1.5">
                  {upcoming.slice(0, 6).map((fixture, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 shrink-0">GW{fixture.event}</span>
                        <span className="text-xs text-gray-900 dark:text-white truncate">
                          {fixture.is_home ? 'vs' : '@'} {fixture.opponent_short || `Team ${fixture.is_home ? fixture.team_a : fixture.team_h}`}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${fdrColors[fixture.difficulty] || 'bg-gray-200 text-gray-700'}`}>
                        {fixture.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-6">No upcoming fixtures</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
