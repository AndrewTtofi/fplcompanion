import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Search, BookOpen } from 'lucide-react';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'FPL Companion',
  url: 'https://fplcompanion.com',
  description: 'Free Fantasy Premier League dashboard with live points tracking, team analysis, league standings, and transfer planning tools.',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Live Gameweek Points',
    'Team Overview & Analysis',
    'League Standings',
    'Pitch View with Player Cards',
    'Transfer History & Planning',
    'Fixture Difficulty Ratings',
  ],
};

export default function Home() {
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!teamId.trim()) {
      alert('Please enter a Team ID');
      return;
    }

    setLoading(true);

    // Navigate to team page
    router.push(`/team/${teamId.trim()}`);
  };

  return (
    <>
      <Head>
        <title>FPL Companion — Free Fantasy Premier League Dashboard</title>
        <meta name="description" content="Free FPL dashboard with live gameweek points, team analysis, league standings, pitch view, and transfer planning. Enter your Team ID to get started." />
        <link rel="canonical" href="https://fplcompanion.com" />
        <meta property="og:title" content="FPL Companion — Free Fantasy Premier League Dashboard" />
        <meta property="og:description" content="Free FPL dashboard with live gameweek points, team analysis, league standings, pitch view, and transfer planning. Enter your Team ID to get started." />
        <meta property="og:url" content="https://fplcompanion.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <div className="min-h-screen gradient-fpl flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              FPL Companion
            </h1>
            <p className="text-xl text-fpl-green">
              Your Fantasy Premier League Dashboard
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Get Started
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Enter your FPL Team ID to view your complete dashboard
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Team ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="teamId"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="e.g., 4604279"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-fpl-purple focus:border-transparent outline-none text-lg"
                    disabled={loading}
                  />
                  <Search className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-400" size={24} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-fpl-purple hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'View My Team'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">How to find your Team ID:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>Go to the official FPL website and log in</li>
                <li>Click on &quot;Points&quot; or &quot;My Team&quot;</li>
                <li>Look at the URL - it will contain /entry/XXXXXX/</li>
                <li>The numbers (XXXXXX) are your Team ID</li>
              </ol>
            </div>

            <div className="mt-6 p-4 bg-fpl-purple bg-opacity-5 dark:bg-fpl-purple/10 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Features:</h3>
              <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="text-fpl-pink mr-2">✓</span>
                  Team Overview
                </li>
                <li className="flex items-center">
                  <span className="text-fpl-pink mr-2">✓</span>
                  Gameweek Analysis
                </li>
                <li className="flex items-center">
                  <span className="text-fpl-pink mr-2">✓</span>
                  League Standings
                </li>
                <li className="flex items-center">
                  <span className="text-fpl-pink mr-2">✓</span>
                  Pitch View
                </li>
                <li className="flex items-center">
                  <span className="text-fpl-pink mr-2">✓</span>
                  Transfer History
                </li>
                <li className="flex items-center">
                  <span className="text-fpl-pink mr-2">✓</span>
                  Global Stats
                </li>
              </ul>
            </div>
          </div>

          <a
            href="/blog"
            className="block mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-fpl-green/20 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-fpl-green" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">FPL Tips & Guides</h3>
                <p className="text-white/60 text-xs mt-0.5">Learn how to get the most out of FPL Companion</p>
              </div>
              <span className="text-fpl-green text-sm font-medium group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </a>

          <div className="text-center mt-6 text-white text-sm">
            <p>No login required • Public data only • Fast & Secure</p>
          </div>
        </div>
      </div>
    </>
  );
}
