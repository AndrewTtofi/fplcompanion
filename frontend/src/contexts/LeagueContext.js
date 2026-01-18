import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const LeagueContext = createContext();

export function LeagueProvider({ children, teamData }) {
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState(null);

  // Available leagues from teamData
  const availableLeagues = teamData?.team?.leagues?.classic || [];

  // Initialize selected league from URL parameter or localStorage
  useEffect(() => {
    const leagueIdFromUrl = router.query.league;

    if (leagueIdFromUrl && availableLeagues.length > 0) {
      // Find league from URL parameter
      const league = availableLeagues.find(l => l.id.toString() === leagueIdFromUrl);
      if (league) {
        setSelectedLeague(league);
        return;
      }
    }

    // Try to load from localStorage
    const savedLeagueId = localStorage.getItem('selectedLeagueId');
    if (savedLeagueId && availableLeagues.length > 0) {
      const league = availableLeagues.find(l => l.id.toString() === savedLeagueId);
      if (league) {
        setSelectedLeague(league);
        // Update URL to reflect saved league
        updateUrlWithLeague(league.id);
        return;
      }
    }

    // Default: no league selected (show all leagues)
    setSelectedLeague(null);
  }, [router.query.league, availableLeagues.length]);

  // Update URL with league parameter
  const updateUrlWithLeague = (leagueId) => {
    const currentQuery = { ...router.query };

    if (leagueId) {
      currentQuery.league = leagueId.toString();
    } else {
      delete currentQuery.league;
    }

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  // Function to select a league
  const selectLeague = (league) => {
    setSelectedLeague(league);

    // Save to localStorage
    if (league) {
      localStorage.setItem('selectedLeagueId', league.id.toString());
      updateUrlWithLeague(league.id);
    } else {
      localStorage.removeItem('selectedLeagueId');
      updateUrlWithLeague(null);
    }
  };

  const value = {
    selectedLeague,
    selectLeague,
    availableLeagues,
    isFiltered: selectedLeague !== null,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}
