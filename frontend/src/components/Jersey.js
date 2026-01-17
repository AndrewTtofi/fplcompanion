// Team shirt mapping - using local shirt images
const TEAM_SHIRTS = {
  'ARS': 'ars2',
  'AVL': 'avl2',
  'BOU': 'bou2',
  'BRE': 'bre2',
  'BHA': 'bha2',
  'CHE': 'che2',
  'CRY': 'cry2',
  'EVE': 'eve2',
  'FUL': 'ful2',
  'IPS': 'ips2',
  'LEI': 'lei2',
  'LIV': 'liv2',
  'MCI': 'mci2',
  'MUN': 'mun2',
  'NEW': 'new2',
  'NFO': 'nfo2',
  'SOU': 'sou2',
  'TOT': 'tot2',
  'WHU': 'whu2',
  'WOL': 'wol2',
  'SUN': 'sun2', // Sunderland
};

export default function Jersey({
  teamShort,
  playerName,
  isCaptain,
  isViceCaptain,
  points,
  multiplier = 1,
  isPlaying,
  size = 'md'
}) {
  const shirtCode = TEAM_SHIRTS[teamShort] || 'ars'; // Default to Arsenal if team not found
  const shirtUrl = `/shirts/${shirtCode}.png`;

  return (
    <div className="relative flex flex-col items-center group">
      {/* Captain/Vice-Captain Badge */}
      {(isCaptain || isViceCaptain) && (
        <div className={`absolute -top-2 -right-2 ${
          isCaptain ? 'bg-fpl-purple' : 'bg-gray-700'
        } text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10`}>
          {isCaptain ? 'C' : 'V'}
        </div>
      )}

      {/* Live Indicator */}
      {isPlaying && (
        <div className="absolute -top-1 -left-1 z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      )}

      {/* Jersey Image */}
      <div className="relative">
        <img
          src={shirtUrl}
          alt={`${teamShort} jersey`}
          className="w-20 h-20 object-contain drop-shadow-lg"
        />

        {/* Player name overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
          {playerName?.toUpperCase().slice(0, 9)}
        </div>

        {/* Points overlay - below name */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
          {isCaptain && multiplier > 1 ? points * multiplier : points}p
        </div>
      </div>
    </div>
  );
}
