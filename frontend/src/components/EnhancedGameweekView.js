import { useState } from 'react';
import { Activity, List, Grid3x3, Users as UsersIcon } from 'lucide-react';
import LivePointsView from './LivePointsView';
import ComparisonView from './ComparisonView';

export default function EnhancedGameweekView({ teamData }) {
  const [subView, setSubView] = useState('live'); // 'live', 'compare'
  const currentGW = teamData.current_gameweek;

  const views = [
    { id: 'live', label: 'Live Points', icon: <Activity size={18} /> },
    { id: 'compare', label: 'Compare', icon: <UsersIcon size={18} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-View Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setSubView(view.id)}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  subView === view.id
                    ? 'border-fpl-purple text-fpl-purple'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {view.icon}
                {view.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {subView === 'live' && (
            <LivePointsView teamId={teamData.team.id} gameweek={currentGW} />
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
