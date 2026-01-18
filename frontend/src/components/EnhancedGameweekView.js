import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LayoutGrid, Users as UsersIcon } from 'lucide-react';
import ComparisonView from './ComparisonView';
import FootballFieldView from './FootballFieldView';

export default function EnhancedGameweekView({ teamData }) {
  const router = useRouter();
  const { view } = router.query;

  const [subView, setSubView] = useState(view || 'field'); // 'field', 'compare'
  const currentGW = teamData.current_gameweek;

  // Update subView when URL changes
  useEffect(() => {
    if (view) {
      setSubView(view);
    }
  }, [view]);

  const views = [
    { id: 'field', label: 'Team View', icon: <LayoutGrid size={18} /> },
    { id: 'compare', label: 'Compare', icon: <UsersIcon size={18} /> },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sub-View Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {views.map((viewItem) => (
              <button
                key={viewItem.id}
                onClick={() => {
                  setSubView(viewItem.id);
                  // Update URL with both tab and view query parameters
                  const currentTab = router.query.tab || 'gameweek';
                  router.push(`/team/${teamData.team.id}?tab=${currentTab}&view=${viewItem.id}`, undefined, { shallow: true });
                }}
                className={`flex-1 md:flex-initial py-3 md:py-4 px-4 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors flex items-center justify-center gap-1.5 md:gap-2 ${
                  subView === viewItem.id
                    ? 'border-fpl-purple text-fpl-purple'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {viewItem.icon}
                <span className="hidden sm:inline">{viewItem.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 md:p-6">
          {subView === 'field' && (
            <FootballFieldView teamId={teamData.team.id} gameweek={currentGW} />
          )}

          {subView === 'compare' && (
            <ComparisonView
              myTeamId={teamData.team.id}
              myTeamName={teamData.team.name}
              gameweek={currentGW}
              leagues={teamData.team.leagues}
            />
          )}
        </div>
      </div>
    </div>
  );
}
