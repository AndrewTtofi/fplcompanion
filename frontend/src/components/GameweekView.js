import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, List, Grid3x3 } from 'lucide-react';
import PitchView from './PitchView';

const fetcher = async (teamId, gw) => {
  const [picksRes, liveRes, bootstrapRes] = await Promise.all([
    api.getTeamPicks(teamId, gw),
    api.getLiveGameweekData(gw),
    api.getBootstrap()
  ]);

  return {
    picks: picksRes.data,
    live: liveRes.data,
    bootstrap: bootstrapRes.data
  };
};

export default function GameweekView({ teamData }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'pitch'
  const currentGW = teamData.current_gameweek;

  const { data, error, isLoading } = useSWR(
    currentGW ? ['gw-data', teamData.team.id, currentGW] : null,
    () => fetcher(teamData.team.id, currentGW),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-fpl-purple" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load gameweek data
      </div>
    );
  }

  const { picks, live, bootstrap } = data;

  // Enrich picks with player data and live points
  const enrichedPicks = picks.picks.map(pick => {
    const player = bootstrap.elements.find(p => p.id === pick.element);
    const liveData = live.elements[pick.element];
    const team = bootstrap.teams.find(t => t.id === player?.team);
    const position = bootstrap.element_types.find(p => p.id === player?.element_type);

    return {
      ...pick,
      player_name: player ? `${player.first_name} ${player.second_name}` : 'Unknown',
      web_name: player?.web_name || 'Unknown',
      team_short: team?.short_name || 'N/A',
      position: position?.singular_name_short || 'N/A',
      position_id: position?.id,
      live_points: liveData?.stats?.total_points || 0,
      minutes: liveData?.stats?.minutes || 0,
      goals: liveData?.stats?.goals_scored || 0,
      assists: liveData?.stats?.assists || 0,
      clean_sheets: liveData?.stats?.clean_sheets || 0,
      bonus: liveData?.stats?.bonus || 0,
      now_cost: player?.now_cost / 10
    };
  });

  // Separate starting XI and bench
  const startingXI = enrichedPicks.filter(p => p.position <= 11).sort((a, b) => a.position - b.position);
  const bench = enrichedPicks.filter(p => p.position > 11).sort((a, b) => a.position - b.position);

  // Calculate total points
  const totalPoints = picks.entry_history.points;
  const pointsOnBench = bench.reduce((sum, p) => sum + p.live_points, 0);

  return (
    <div className="space-y-6">
      {/* Gameweek Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gameweek {currentGW}</h2>
          <div className="flex items-center space-x-6 mt-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">GW Points:</span>{' '}
              <span className="font-bold text-fpl-purple text-lg">{totalPoints}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">On Bench:</span>{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">{pointsOnBench}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Transfers:</span>{' '}
              <span className="font-bold">{picks.entry_history.event_transfers}</span>
              {picks.entry_history.event_transfers_cost > 0 && (
                <span className="text-red-600 ml-1">(-{picks.entry_history.event_transfers_cost})</span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
              viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-fpl-purple' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <List size={18} />
            <span className="text-sm font-medium">List</span>
          </button>
          <button
            onClick={() => setViewMode('pitch')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
              viewMode === 'pitch' ? 'bg-white dark:bg-gray-700 shadow text-fpl-purple' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Grid3x3 size={18} />
            <span className="text-sm font-medium">Pitch</span>
          </button>
        </div>
      </div>

      {/* Squad Display */}
      {viewMode === 'list' ? (
        <ListView startingXI={startingXI} bench={bench} />
      ) : (
        <PitchView startingXI={startingXI} bench={bench} />
      )}
    </div>
  );
}

function ListView({ startingXI, bench }) {
  const captain = startingXI.find(p => p.is_captain);
  const viceCaptain = startingXI.find(p => p.is_vice_captain);

  return (
    <div className="space-y-4">
      {/* Starting XI */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-fpl-purple text-white px-4 py-3 font-semibold">
          Starting XI
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Position</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Player</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Team</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">£</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Min</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">G</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">A</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">CS</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Bonus</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Points</th>
              </tr>
            </thead>
            <tbody>
              {startingXI.map((pick) => (
                <tr key={pick.element} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 text-sm font-medium">{pick.position}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{pick.web_name}</span>
                      {pick.is_captain && <span className="text-xs bg-fpl-purple text-white px-2 py-0.5 rounded">C</span>}
                      {pick.is_vice_captain && <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded">V</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{pick.team_short}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.now_cost}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.minutes}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.goals}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.assists}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.clean_sheets}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.bonus}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-fpl-purple">
                      {pick.is_captain ? pick.live_points * pick.multiplier : pick.live_points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bench */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-600 text-white px-4 py-3 font-semibold">
          Bench
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Position</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Player</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Team</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">£</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Min</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Points</th>
              </tr>
            </thead>
            <tbody>
              {bench.map((pick) => (
                <tr key={pick.element} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 text-sm font-medium">{pick.position - 11}</td>
                  <td className="py-3 px-4 font-medium">{pick.web_name}</td>
                  <td className="py-3 px-4 text-sm">{pick.team_short}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.now_cost}</td>
                  <td className="py-3 px-4 text-sm text-center">{pick.minutes}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-gray-600 dark:text-gray-300">{pick.live_points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
