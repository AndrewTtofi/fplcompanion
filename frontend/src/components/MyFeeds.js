import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { AlertCircle, TrendingUp, TrendingDown, Activity, Calendar, Bell, UserCheck, UserX, ChevronDown, ChevronUp } from 'lucide-react';

function formatRelativeTime(isoTimestamp) {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MyFeeds({ teamId }) {
  const [currentGameweek, setCurrentGameweek] = useState(null);

  const { data: feedData, error, isLoading, mutate } = useSWR(
    ['team-feed', teamId, currentGameweek],
    () => api.getTeamFeed(teamId, currentGameweek).then(res => res.data),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Refresh every 60 seconds
    }
  );

  // Get current gameweek
  useEffect(() => {
    api.getCurrentGameweek()
      .then(res => setCurrentGameweek(res.data.current_gameweek))
      .catch(err => console.error('Failed to fetch current gameweek:', err));
  }, []);

  if (isLoading || !currentGameweek) {
    return <LoadingSpinner size="lg" message="Loading feeds..." />;
  }

  if (error || !feedData) {
    return (
      <ErrorMessage
        title="Failed to load feeds"
        message="We couldn't load your feeds. Please try again."
        onRetry={() => mutate()}
      />
    );
  }

  const { feed_items, total_items, last_checked } = feedData;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Feeds</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Player news, injury updates, and insights for your squad
          </p>
          {last_checked && (
            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-1">
              News last checked: {formatRelativeTime(last_checked)}
            </p>
          )}
        </div>
        {total_items > 0 && (
          <div className="flex items-center gap-2 bg-fpl-purple text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex-shrink-0">
            <Bell size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="font-semibold text-sm md:text-base">{total_items} {total_items === 1 ? 'update' : 'updates'}</span>
          </div>
        )}
      </div>

      {/* Feed Items */}
      {total_items === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <Activity className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All caught up!</h3>
            <p className="text-gray-600 dark:text-gray-300">
              No important updates at the moment. Check back later for team news, double gameweeks, and more.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {feed_items.map((item, index) => (
            <FeedItem key={`${item.type}-${index}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const { type, priority, title, description } = item;

  // Determine icon and colors based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'DOUBLE_GAMEWEEK':
        return {
          icon: <TrendingUp size={24} />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-500',
          iconColor: 'text-white',
        };
      case 'BLANK_GAMEWEEK':
        return {
          icon: <AlertCircle size={24} />,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-500',
          iconColor: 'text-white',
        };
      case 'INJURY_NEWS':
        return {
          icon: <Activity size={24} />,
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          iconBg: 'bg-orange-500',
          iconColor: 'text-white',
        };
      case 'PRICE_CHANGE':
        return {
          icon: <TrendingDown size={24} />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-500',
          iconColor: 'text-white',
        };
      case 'TEAM_NEWS': {
        if (item.change_type === 'CLEARED_NEWS') {
          return {
            icon: <UserCheck size={24} />,
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            iconBg: 'bg-green-500',
            iconColor: 'text-white',
          };
        }
        if (item.new_status === 'i' || item.new_status === 's') {
          return {
            icon: <UserX size={24} />,
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            iconBg: 'bg-red-500',
            iconColor: 'text-white',
          };
        }
        return {
          icon: <AlertCircle size={24} />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconBg: 'bg-yellow-500',
          iconColor: 'text-white',
        };
      }
      default:
        return {
          icon: <Calendar size={24} />,
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          borderColor: 'border-gray-200 dark:border-gray-700',
          iconBg: 'bg-gray-500',
          iconColor: 'text-white',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg shadow-sm transition-shadow`}>
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 md:gap-4 p-4 md:p-6 text-left cursor-pointer"
      >
        <div className={`${config.iconBg} ${config.iconColor} p-2 md:p-3 rounded-lg flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h3>
            {priority === 'high' && (
              <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full uppercase flex-shrink-0">
                High Priority
              </span>
            )}
          </div>
          {expanded
            ? <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
            : <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
          }
        </div>
      </button>

      {/* Collapsible content */}
      {expanded && (
        <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0">
          <div className="ml-[40px] md:ml-[52px]">
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-200 mb-3 md:mb-4">{description}</p>
            {type === 'DOUBLE_GAMEWEEK' && <DoubleGameweekDetails item={item} />}
            {type === 'BLANK_GAMEWEEK' && <BlankGameweekDetails item={item} />}
            {type === 'INJURY_NEWS' && <InjuryNewsDetails item={item} />}
            {type === 'PRICE_CHANGE' && <PriceChangeDetails item={item} />}
            {type === 'TEAM_NEWS' && <TeamNewsDetails item={item} />}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamNewsDetails({ item }) {
  const { player, change_type, old_status, new_status,
          chance_of_playing_next_round, created_at } = item;

  const statusLabels = {
    a: 'Available', d: 'Doubtful', i: 'Injured',
    s: 'Suspended', u: 'Unavailable', n: 'Not in Squad'
  };

  const statusColors = {
    a: 'text-green-600', d: 'text-yellow-600', i: 'text-red-600',
    s: 'text-red-600', u: 'text-gray-600', n: 'text-gray-600'
  };

  return (
    <div className="space-y-2">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {player.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{player.team}</span>
          </div>
          {chance_of_playing_next_round !== null && chance_of_playing_next_round !== undefined && (
            <span className={`text-xs font-semibold ${
              chance_of_playing_next_round >= 75 ? 'text-green-600' :
              chance_of_playing_next_round >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {chance_of_playing_next_round}% chance
            </span>
          )}
        </div>

        {/* Status change indicator */}
        {old_status && new_status && old_status !== new_status && (
          <div className="flex items-center gap-2 text-xs mb-2">
            <span className={statusColors[old_status] || 'text-gray-600'}>{statusLabels[old_status] || old_status}</span>
            <span className="text-gray-400">&rarr;</span>
            <span className={`font-semibold ${statusColors[new_status] || 'text-gray-600'}`}>
              {statusLabels[new_status] || new_status}
            </span>
          </div>
        )}

        {/* Recovery message */}
        {change_type === 'CLEARED_NEWS' && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Player has recovered and is available for selection
          </p>
        )}

        {/* Timestamp */}
        {created_at && (
          <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatRelativeTime(created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function DoubleGameweekDetails({ item }) {
  const { gameweek, teams, affected_players } = item;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
        <Calendar size={14} className="md:w-4 md:h-4" />
        <span>Gameweek {gameweek}</span>
      </div>

      {/* Affected Players */}
      <div>
        <h4 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2">Your Players with Double Fixtures:</h4>
        <div className="flex flex-wrap gap-2">
          {affected_players.map((player) => (
            <div key={player.id} className="bg-white dark:bg-gray-800 border border-green-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">{player.name}</span>
              <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300">{player.team}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Teams and Fixtures */}
      <div>
        <h4 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2">Fixtures:</h4>
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.team_id} className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-3 border border-green-200">
              <div className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">{team.team_name}</div>
              <div className="flex flex-wrap gap-2">
                {team.fixtures.map((fixture, idx) => (
                  <div key={idx} className="text-xs md:text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                    {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                    <span className={`ml-1 md:ml-2 text-[10px] md:text-xs ${
                      fixture.difficulty <= 2 ? 'text-green-600' : fixture.difficulty >= 4 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      (FDR: {fixture.difficulty})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlankGameweekDetails({ item }) {
  const { gameweek, affected_players } = item;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
        <Calendar size={14} className="md:w-4 md:h-4" />
        <span>Gameweek {gameweek}</span>
      </div>

      <div>
        <h4 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2">Players with No Fixture:</h4>
        <div className="flex flex-wrap gap-2">
          {affected_players.map((player) => (
            <div key={player.id} className="bg-white dark:bg-gray-800 border border-red-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">{player.name}</span>
              <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300">{player.team}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-2 md:p-3">
        <p className="text-xs md:text-sm text-yellow-900 dark:text-yellow-200">
          <strong>Tip:</strong> Consider transferring these players out or have substitutes ready.
        </p>
      </div>
    </div>
  );
}

function InjuryNewsDetails({ item }) {
  const { players } = item;

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.id} className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg p-2 md:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">{player.name}</span>
              <span className="text-[10px] md:text-sm text-gray-600 dark:text-gray-300">{player.team}</span>
            </div>
            {player.chance_of_playing !== null && (
              <span className={`text-xs md:text-sm font-semibold ${
                player.chance_of_playing >= 50 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {player.chance_of_playing}% chance of playing
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-gray-700 dark:text-gray-200">{player.news}</p>
          {player.news_added && (
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
              Updated: {new Date(player.news_added).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PriceChangeDetails({ item }) {
  const { players } = item;

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.id} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-2 md:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">{player.name}</span>
              <span className="text-[10px] md:text-sm text-gray-600 dark:text-gray-300">{player.team}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-through">£{player.old_price}m</span>
              <span className={`text-base md:text-lg font-bold ${player.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                £{player.new_price}m
              </span>
              <span className={`text-xs md:text-sm font-semibold ${player.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({player.change > 0 ? '+' : ''}{player.change}m)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
