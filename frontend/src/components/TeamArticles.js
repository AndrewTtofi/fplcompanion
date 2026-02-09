import { useState, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { Newspaper, ExternalLink, Clock, SlidersHorizontal, Users, X, ChevronDown } from 'lucide-react';

function formatRelativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const SOURCE_COLORS = {
  'BBC Sport': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'The Guardian': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Sky Sports': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'ESPN FC': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'FourFourTwo': 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  'TalkSport': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Football365': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Mirror Football': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  '90min': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'The Athletic': 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  'r/FantasyPL': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'r/PremierLeague': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Bournemouth FC': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Aston Villa FC': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'Burnley FC': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Crystal Palace FC': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Everton FC': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Fulham FC': 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
  'Man United FC': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  "Nott'm Forest FC": 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Sunderland AFC': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function TeamArticles({ teamId }) {
  const [sourceFilter, setSourceFilter] = useState(null);
  const [teamFilter, setTeamFilter] = useState('squad');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showFilters]);

  const { data, error, isLoading, mutate } = useSWR(
    teamId ? ['team-articles', teamId] : null,
    () => api.getTeamArticles(teamId).then(res => res.data),
    {
      revalidateOnFocus: false,
      refreshInterval: 300000,
    }
  );

  const sources = useMemo(() => {
    if (!data?.articles) return [];
    const srcSet = new Set();
    for (const article of data.articles) srcSet.add(article.source);
    return [...srcSet].sort();
  }, [data]);

  const filteredArticles = useMemo(() => {
    if (!data?.articles) return [];
    return data.articles.filter(article => {
      if (sourceFilter && article.source !== sourceFilter) return false;
      if (teamFilter === 'squad') {
        if (!article.matchedTeams || !data.squadTeams) return false;
        return article.matchedTeams.some(t => data.squadTeams.includes(t));
      }
      if (teamFilter && teamFilter !== 'squad') {
        if (!article.matchedTeams || !article.matchedTeams.includes(teamFilter)) return false;
      }
      return true;
    });
  }, [data, sourceFilter, teamFilter]);

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading team news..." />;
  }

  if (error || !data) {
    return (
      <ErrorMessage
        title="Failed to load articles"
        message="We couldn&apos;t load team news articles. Please try again."
        onRetry={() => mutate()}
      />
    );
  }

  const { allTeams = [], squadTeams = [] } = data;
  const activeFilterCount = (sourceFilter ? 1 : 0) + (teamFilter ? 1 : 0);

  // Build filter label summary
  const filterLabel = (() => {
    const parts = [];
    if (sourceFilter) parts.push(sourceFilter);
    if (teamFilter === 'squad') parts.push('My Squad');
    else if (teamFilter) parts.push(teamFilter);
    return parts.length > 0 ? parts.join(' + ') : 'All';
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Team News</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Latest articles and discussions from across the Premier League
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter button */}
          {data.articles.length > 0 && (
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors border ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-fpl-purple text-white border-fpl-purple dark:bg-fpl-green dark:text-gray-900 dark:border-fpl-green'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <SlidersHorizontal size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">{filterLabel}</span>
                <span className="sm:hidden">Filter</span>
                {activeFilterCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                      : 'bg-fpl-purple text-white'
                  }`}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown panel */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-[320px] md:w-[380px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* Dropdown header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Filters</span>
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => { setSourceFilter(null); setTeamFilter(null); }}
                          className="text-[10px] md:text-xs text-fpl-purple dark:text-fpl-green hover:underline"
                        >
                          Reset
                        </button>
                      )}
                      <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                    {/* Source section */}
                    <div>
                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Source</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          onClick={() => setSourceFilter(null)}
                          className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            !sourceFilter
                              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          All Sources
                        </button>
                        {sources.map(source => (
                          <button
                            key={source}
                            onClick={() => setSourceFilter(sourceFilter === source ? null : source)}
                            className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              sourceFilter === source
                                ? 'bg-fpl-purple text-white dark:bg-fpl-green dark:text-gray-900'
                                : (SOURCE_COLORS[source] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300') + ' hover:opacity-80'
                            }`}
                          >
                            {source}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700" />

                    {/* Team section */}
                    <div>
                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Team</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          onClick={() => setTeamFilter(null)}
                          className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            !teamFilter
                              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          All Teams
                        </button>
                        {squadTeams.length > 0 && (
                          <button
                            onClick={() => setTeamFilter(teamFilter === 'squad' ? null : 'squad')}
                            className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
                              teamFilter === 'squad'
                                ? 'bg-fpl-purple text-white dark:bg-fpl-green dark:text-gray-900'
                                : 'bg-fpl-purple/10 text-fpl-purple dark:bg-fpl-green/10 dark:text-fpl-green hover:opacity-80'
                            }`}
                          >
                            <Users size={10} />
                            My Squad
                          </button>
                        )}
                        {allTeams.map(team => {
                          const isSquadTeam = squadTeams.includes(team);
                          return (
                            <button
                              key={team}
                              onClick={() => setTeamFilter(teamFilter === team ? null : team)}
                              className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                teamFilter === team
                                  ? 'bg-fpl-purple text-white dark:bg-fpl-green dark:text-gray-900'
                                  : isSquadTeam
                                    ? 'bg-fpl-purple/10 text-fpl-purple dark:bg-fpl-green/10 dark:text-fpl-green hover:opacity-80 ring-1 ring-fpl-purple/30 dark:ring-fpl-green/30'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {team}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown footer */}
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 text-center">
                      Showing {filteredArticles.length} of {data.articles.length} articles
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Article count badge */}
          {data.articles.length > 0 && (
            <div className="flex items-center gap-2 bg-fpl-purple text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex-shrink-0">
              <Newspaper size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="font-semibold text-sm md:text-base">
                {filteredArticles.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active filter pills (shown below header when filters are active) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {sourceFilter && (
            <span className="flex items-center gap-1 text-[10px] md:text-xs bg-fpl-purple/10 text-fpl-purple dark:bg-fpl-green/10 dark:text-fpl-green px-2.5 py-1 rounded-full font-medium">
              {sourceFilter}
              <button onClick={() => setSourceFilter(null)} className="hover:opacity-60"><X size={10} /></button>
            </span>
          )}
          {teamFilter && (
            <span className="flex items-center gap-1 text-[10px] md:text-xs bg-fpl-purple/10 text-fpl-purple dark:bg-fpl-green/10 dark:text-fpl-green px-2.5 py-1 rounded-full font-medium">
              {teamFilter === 'squad' ? 'My Squad' : teamFilter}
              <button onClick={() => setTeamFilter(null)} className="hover:opacity-60"><X size={10} /></button>
            </span>
          )}
          <button
            onClick={() => { setSourceFilter(null); setTeamFilter(null); }}
            className="text-[10px] md:text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Articles List */}
      {data.articles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <Newspaper className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              No recent articles found. Check back later for the latest news.
            </p>
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No articles match the selected filters.
          </p>
          <button
            onClick={() => { setSourceFilter(null); setTeamFilter(null); }}
            className="mt-3 text-sm text-fpl-purple dark:text-fpl-green hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article, index) => (
            <ArticleCard key={`${article.link}-${index}`} article={article} squadTeams={squadTeams} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, squadTeams }) {
  const { title, link, snippet, source, pubDate, matchedTeams } = article;
  const sourceColor = SOURCE_COLORS[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md hover:border-fpl-purple dark:hover:border-fpl-green transition-all"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 md:p-3 rounded-lg flex-shrink-0">
          <Newspaper size={20} className="text-gray-500 dark:text-gray-400 md:w-6 md:h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white leading-snug">
              {title}
            </h3>
            <ExternalLink size={14} className="text-gray-400 flex-shrink-0 hidden sm:block" />
          </div>

          {snippet && (
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {snippet}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${sourceColor}`}>
              {source}
            </span>
            {matchedTeams && matchedTeams.map(team => {
              const isSquad = squadTeams?.includes(team);
              return (
                <span
                  key={team}
                  className={`text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${
                    isSquad
                      ? 'bg-fpl-purple/15 text-fpl-purple dark:bg-fpl-green/15 dark:text-fpl-green ring-1 ring-fpl-purple/20 dark:ring-fpl-green/20'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {team}
                </span>
              );
            })}
            {pubDate && (
              <span className="flex items-center gap-1 text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
                <Clock size={10} className="md:w-3 md:h-3" />
                {formatRelativeTime(pubDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
