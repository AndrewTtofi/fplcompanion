import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader2, Users, TrendingUp, Trophy, Target, AlertCircle } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import SquadComparisonView from './SquadComparisonView';

export default function ComparisonView({ myTeamId, myTeamName, gameweek, leagues }) {
  const { selectedLeague: globalLeague } = useLeague();
  const [opponentId, setOpponentId] = useState('');
  const [selectedOpponentId, setSelectedOpponentId] = useState(null);

  // Get league members for selection
  const classicLeagues = leagues?.classic || [];

  const handleCompare = (e) => {
    e.preventDefault();
    if (opponentId.trim() && opponentId !== myTeamId.toString()) {
      setSelectedOpponentId(opponentId.trim());
    }
  };

  const handleQuickSelect = (teamId) => {
    if (teamId !== myTeamId) {
      setOpponentId(teamId.toString());
      setSelectedOpponentId(teamId.toString());
    }
  };

  if (!selectedOpponentId) {
    return (
      <ComparisonSelector
        opponentId={opponentId}
        setOpponentId={setOpponentId}
        handleCompare={handleCompare}
        leagues={classicLeagues}
        onQuickSelect={handleQuickSelect}
        myTeamId={myTeamId}
        globalLeague={globalLeague}
      />
    );
  }

  return (
    <ComparisonResults
      myTeamId={myTeamId}
      opponentId={selectedOpponentId}
      gameweek={gameweek}
      onBack={() => setSelectedOpponentId(null)}
    />
  );
}

function ComparisonSelector({ opponentId, setOpponentId, handleCompare, leagues, onQuickSelect, myTeamId, globalLeague }) {
  // Use global league if set, otherwise use first league
  const [selectedLeague, setSelectedLeague] = useState(globalLeague || leagues[0]);

  const { data: leagueData } = useSWR(
    selectedLeague ? ['league', selectedLeague.id] : null,
    () => api.getClassicLeague(selectedLeague.id).then(res => res.data),
    { revalidateOnFocus: false }
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Compare with Opponent</h3>

        {/* Manual Entry */}
        <form onSubmit={handleCompare} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Enter Opponent Team ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
              placeholder="Enter Team ID"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fpl-purple focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="bg-fpl-purple text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              Compare
            </button>
          </div>
        </form>

        {/* League Selection */}
        {leagues.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Or select from your leagues
            </label>
            <select
              value={selectedLeague?.id || ''}
              onChange={(e) => {
                const league = leagues.find(l => l.id === parseInt(e.target.value));
                setSelectedLeague(league);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
            >
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>

            {leagueData && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leagueData.standings.results
                  .filter(team => team.entry !== myTeamId)
                  .slice(0, 10)
                  .map((team) => (
                    <button
                      key={team.entry}
                      onClick={() => onQuickSelect(team.entry)}
                      className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-fpl-purple hover:bg-opacity-10 dark:hover:bg-fpl-purple/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-left transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{team.entry_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{team.player_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Rank {team.rank}</div>
                          <div className="font-bold text-fpl-purple dark:text-fpl-green">{team.total} pts</div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonResults({ myTeamId, opponentId, gameweek, onBack }) {
  const [activeTab, setActiveTab] = useState('squad');

  const { data, error, isLoading } = useSWR(
    ['comparison', myTeamId, opponentId, gameweek],
    () => api.compareTeams(myTeamId, opponentId, gameweek).then(res => res.data),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-fpl-purple dark:text-fpl-green" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load comparison</div>
        <button onClick={onBack} className="text-fpl-purple dark:text-fpl-green hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  const { team1, team2, comparison, summary, team1_squad, team2_squad } = data;
  const isAhead = comparison.gameweek_difference > 0;
  const hasSquadData = !!team1_squad && !!team2_squad;

  const sharedPlayerIds = hasSquadData
    ? [...team1_squad.starting_xi, ...(team1_squad.bench || [])]
        .map(p => p.element)
        .filter(id => [...team2_squad.starting_xi, ...(team2_squad.bench || [])].some(p => p.element === id))
    : comparison.shared_players.map(p => p.id);

  return (
    <div className="space-y-6">
      {/* Back Button + Tab Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-fpl-purple dark:text-fpl-green hover:underline flex items-center gap-2"
        >
          ← Change Opponent
        </button>
        {hasSquadData && (
          <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('squad')}
              className={`w-16 md:w-20 py-1 text-xs rounded-md font-medium text-center transition-colors ${
                activeTab === 'squad'
                  ? 'bg-white dark:bg-gray-600 text-fpl-purple dark:text-fpl-green shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Squad
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`w-16 md:w-20 py-1 text-xs rounded-md font-medium text-center transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-white dark:bg-gray-600 text-fpl-purple dark:text-fpl-green shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Analysis
            </button>
          </div>
        )}
      </div>

      {/* Squad View */}
      {activeTab === 'squad' && hasSquadData && (
        <SquadComparisonView
          team1Name={team1.name}
          team2Name={team2.name}
          team1Squad={team1_squad}
          team2Squad={team2_squad}
          sharedPlayerIds={sharedPlayerIds}
        />
      )}

      {/* Analysis View */}
      {activeTab === 'analysis' && <>
      {/* Summary Box */}
      <div className={`rounded-lg p-6 text-white ${
        isAhead ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'
      }`}>
        <h2 className="text-2xl font-bold mb-4">Gameweek {gameweek} Comparison</h2>
        <div className="space-y-2">
          {summary.map((line, idx) => (
            <p key={idx} className="text-lg">{line}</p>
          ))}
        </div>
      </div>

      {/* Head to Head Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TeamCard team={team1} label="Your Team" highlight />
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-400 dark:text-gray-500">VS</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">GW Difference</div>
            <div className={`text-2xl font-bold mt-1 ${
              isAhead ? 'text-green-600' : 'text-red-600'
            }`}>
              {isAhead ? '+' : ''}{comparison.gameweek_difference}
            </div>
          </div>
        </div>
        <TeamCard team={team2} label="Opponent" />
      </div>

      {/* Captain Comparison */}
      {comparison.captain_difference && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Captain Comparison
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <CaptainCard
              name={comparison.captain_difference.team1_captain?.name}
              points={comparison.captain_difference.team1_captain?.points}
              multiplied={comparison.captain_difference.team1_captain?.multiplied_points}
              label="Your Captain"
            />
            <CaptainCard
              name={comparison.captain_difference.team2_captain?.name}
              points={comparison.captain_difference.team2_captain?.points}
              multiplied={comparison.captain_difference.team2_captain?.multiplied_points}
              label="Their Captain"
            />
          </div>
          {comparison.captain_difference.same_captain ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 text-center">
              Both managers captained the same player
            </p>
          ) : (
            <p className="text-sm font-medium mt-4 text-center dark:text-white">
              Captain swing: {comparison.captain_difference.points_swing > 0 ? 'You gained' : 'They gained'}{' '}
              {Math.abs(comparison.captain_difference.points_swing)} points
            </p>
          )}
        </div>
      )}

      {/* Shared Players */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="text-blue-500" size={20} />
          Shared Players ({comparison.shared_players.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {comparison.shared_players.map((player) => (
            <div key={player.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="font-medium text-blue-900 dark:text-blue-300">{player.name}</div>
              <div className="text-sm text-blue-700 dark:text-blue-400">{player.team}</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-300 mt-1">{player.points} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Differentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Differentials */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="text-green-500" size={20} />
            Your Differentials ({comparison.team1_differentials.length})
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Total: {comparison.differential_points.team1} points
          </div>
          <div className="space-y-2">
            {comparison.team1_differentials.map((player) => (
              <DifferentialCard key={player.id} player={player} />
            ))}
          </div>
        </div>

        {/* Their Differentials */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Their Differentials ({comparison.team2_differentials.length})
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Total: {comparison.differential_points.team2} points
          </div>
          <div className="space-y-2">
            {comparison.team2_differentials.map((player) => (
              <DifferentialCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>

      {/* Differential Summary */}
      <div className={`rounded-lg p-4 ${
        comparison.differential_points.difference > 0
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
          : comparison.differential_points.difference < 0
          ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
          : 'bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600'
      }`}>
        <p className="text-center font-medium dark:text-white">
          {comparison.differential_points.difference > 0
            ? `Your differentials outscored theirs by ${comparison.differential_points.difference} points`
            : comparison.differential_points.difference < 0
            ? `Their differentials outscored yours by ${Math.abs(comparison.differential_points.difference)} points`
            : 'Differentials scored equally'}
        </p>
      </div>
      </>}
    </div>
  );
}

function TeamCard({ team, label, highlight = false }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
      highlight ? 'border-fpl-purple shadow-lg' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{team.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{team.manager}</p>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">GW Points:</span>
          <span className="font-bold text-fpl-purple dark:text-fpl-green">{team.gameweek_points}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Net Points:</span>
          <span className="font-bold dark:text-white">{team.net_points}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Overall:</span>
          <span className="font-medium dark:text-white">{team.overall_points}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">OR:</span>
          <span className="font-medium dark:text-white">{team.overall_rank?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function CaptainCard({ name, points, multiplied, label }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
      <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">{label}</div>
      <div className="font-bold text-yellow-900 dark:text-yellow-200">{name || 'N/A'}</div>
      {points !== undefined && (
        <div className="mt-2 text-sm text-yellow-800 dark:text-yellow-300">
          {points} × 2 = <span className="text-lg font-bold">{multiplied}</span> pts
        </div>
      )}
    </div>
  );
}

function DifferentialCard({ player }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">
          {player.name}
          {player.is_captain && <span className="ml-2 text-xs bg-fpl-purple text-white px-2 py-0.5 rounded">C</span>}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{player.team}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          {player.multiplied_points}
        </div>
        {player.is_captain && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{player.points} × 2</div>
        )}
      </div>
    </div>
  );
}
