import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { AlertCircle, TrendingUp, TrendingDown, Activity, Calendar, Bell } from 'lucide-react';

export default function MyFeeds({ teamId }) {
  const [currentGameweek, setCurrentGameweek] = useState(null);

  const { data: feedData, error, isLoading, mutate } = useSWR(
    ['team-feed', teamId, currentGameweek],
    () => api.getTeamFeed(teamId, currentGameweek).then(res => res.data),
    {
      revalidateOnFocus: true,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  // Get current gameweek
  useEffect(() => {
    api.getCurrentGameweek()
      .then(res => setCurrentGameweek(res.data.current_gameweek))
      .catch(err => console.error('Failed to fetch current gameweek:', err));
  }, []);

  if (isLoading || !currentGameweek) {
    return <LoadingSpinner size="lg" message="Loading your feeds..." />;
  }

  if (error || !feedData) {
    return (
      <ErrorMessage
        title="Failed to load feeds"
        message="We couldn't load your personalized feeds. Please try again."
        onRetry={() => mutate()}
      />
    );
  }

  const { feed_items, total_items } = feedData;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Feeds</h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Important updates and insights for your FPL team
          </p>
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
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <Activity className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">
              No important updates at the moment. Check back later for double gameweeks, injury news, and more.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {feed_items.map((item, index) => (
            <FeedItem key={index} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedItem({ item }) {
  const { type, priority, title, description } = item;

  // Determine icon and colors based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'DOUBLE_GAMEWEEK':
        return {
          icon: <TrendingUp size={24} />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-500',
          iconColor: 'text-white',
        };
      case 'BLANK_GAMEWEEK':
        return {
          icon: <AlertCircle size={24} />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-500',
          iconColor: 'text-white',
        };
      case 'INJURY_NEWS':
        return {
          icon: <Activity size={24} />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconBg: 'bg-orange-500',
          iconColor: 'text-white',
        };
      case 'PRICE_CHANGE':
        return {
          icon: <TrendingDown size={24} />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-500',
          iconColor: 'text-white',
        };
      default:
        return {
          icon: <Calendar size={24} />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconBg: 'bg-gray-500',
          iconColor: 'text-white',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3 md:gap-4">
        {/* Icon */}
        <div className={`${config.iconBg} ${config.iconColor} p-2 md:p-3 rounded-lg flex-shrink-0`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <h3 className="text-base md:text-lg font-bold text-gray-900">{title}</h3>
            {priority === 'high' && (
              <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full uppercase flex-shrink-0">
                High Priority
              </span>
            )}
          </div>
          <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">{description}</p>

          {/* Type-specific details */}
          {type === 'DOUBLE_GAMEWEEK' && <DoubleGameweekDetails item={item} />}
          {type === 'BLANK_GAMEWEEK' && <BlankGameweekDetails item={item} />}
          {type === 'INJURY_NEWS' && <InjuryNewsDetails item={item} />}
          {type === 'PRICE_CHANGE' && <PriceChangeDetails item={item} />}
        </div>
      </div>
    </div>
  );
}

function DoubleGameweekDetails({ item }) {
  const { gameweek, teams, affected_players } = item;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
        <Calendar size={14} className="md:w-4 md:h-4" />
        <span>Gameweek {gameweek}</span>
      </div>

      {/* Affected Players */}
      <div>
        <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2">Your Players with Double Fixtures:</h4>
        <div className="flex flex-wrap gap-2">
          {affected_players.map((player) => (
            <div key={player.id} className="bg-white border border-green-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900">{player.name}</span>
              <span className="text-[10px] md:text-xs text-gray-600">{player.team}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Teams and Fixtures */}
      <div>
        <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2">Fixtures:</h4>
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.team_id} className="bg-white rounded-lg p-2 md:p-3 border border-green-200">
              <div className="font-semibold text-sm md:text-base text-gray-900 mb-1">{team.team_name}</div>
              <div className="flex flex-wrap gap-2">
                {team.fixtures.map((fixture, idx) => (
                  <div key={idx} className="text-xs md:text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                    {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                    <span className={`ml-1 md:ml-2 text-[10px] md:text-xs ${
                      fixture.difficulty <= 2 ? 'text-green-600' : fixture.difficulty >= 4 ? 'text-red-600' : 'text-gray-600'
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
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
        <Calendar size={14} className="md:w-4 md:h-4" />
        <span>Gameweek {gameweek}</span>
      </div>

      <div>
        <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2">Players with No Fixture:</h4>
        <div className="flex flex-wrap gap-2">
          {affected_players.map((player) => (
            <div key={player.id} className="bg-white border border-red-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900">{player.name}</span>
              <span className="text-[10px] md:text-xs text-gray-600">{player.team}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3">
        <p className="text-xs md:text-sm text-yellow-900">
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
        <div key={player.id} className="bg-white border border-orange-200 rounded-lg p-2 md:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900">{player.name}</span>
              <span className="text-[10px] md:text-sm text-gray-600">{player.team}</span>
            </div>
            {player.chance_of_playing !== null && (
              <span className={`text-xs md:text-sm font-semibold ${
                player.chance_of_playing >= 50 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {player.chance_of_playing}% chance of playing
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-gray-700">{player.news}</p>
          {player.news_added && (
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
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
        <div key={player.id} className="bg-white border border-blue-200 rounded-lg p-2 md:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs md:text-sm text-gray-900">{player.name}</span>
              <span className="text-[10px] md:text-sm text-gray-600">{player.team}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 line-through">£{player.old_price}m</span>
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
