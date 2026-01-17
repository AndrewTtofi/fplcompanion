import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function Layout({ children, teamData }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-fpl text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <Home size={24} />
              <span className="text-xl font-bold">FPL Companion</span>
            </Link>

            {teamData && (
              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="text-fpl-green">Points:</span>{' '}
                  <span className="font-bold">{teamData.performance.overall_points?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-fpl-green">GW{teamData.current_gameweek}:</span>{' '}
                  <span className="font-bold">{teamData.performance.last_gw_points}</span>
                </div>
                <div>
                  <span className="text-fpl-green">Value:</span>{' '}
                  <span className="font-bold">£{teamData.performance.team_value}m</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>FPL Companion - Unofficial Fantasy Premier League Dashboard</p>
            <p className="mt-1">Data provided by the official FPL API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
