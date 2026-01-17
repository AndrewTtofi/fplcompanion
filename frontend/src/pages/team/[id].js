import { useRouter } from 'next/router';
import { useState } from 'react';
import useSWR from 'swr';
import { api, handleApiError } from '@/lib/api';
import TeamOverview from '@/components/TeamOverview';
import GameweekView from '@/components/GameweekView';
import EnhancedGameweekView from '@/components/EnhancedGameweekView';
import LeagueView from '@/components/LeagueView';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

const fetcher = (url) => api.getTeamOverview(url).then(res => res.data);

export default function TeamPage() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState('overview');

  const { data: teamData, error, isLoading } = useSWR(
    id ? id : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-fpl-purple" size={48} />
            <p className="text-lg text-gray-600">Loading team data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    const errorInfo = handleApiError(error);
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Team</h2>
            <p className="text-red-700 mb-4">{errorInfo.message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-fpl-purple text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              Back to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!teamData) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'gameweek', label: 'Current Gameweek' },
    { id: 'leagues', label: 'Leagues' },
  ];

  return (
    <Layout teamData={teamData}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-fpl-purple text-fpl-purple'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <TeamOverview teamData={teamData} />}
            {activeTab === 'gameweek' && <EnhancedGameweekView teamData={teamData} />}
            {activeTab === 'leagues' && <LeagueView teamData={teamData} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
