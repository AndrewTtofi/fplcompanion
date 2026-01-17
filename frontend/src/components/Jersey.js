// Team colors and badge codes mapping based on Premier League teams
const TEAM_DATA = {
  'ARS': { primary: '#EF0107', secondary: '#FFFFFF', code: 3 },      // Arsenal
  'AVL': { primary: '#95BFE5', secondary: '#670E36', code: 7 },      // Aston Villa
  'BOU': { primary: '#DA291C', secondary: '#000000', code: 91 },     // Bournemouth
  'BRE': { primary: '#e30613', secondary: '#FBB800', code: 94 },     // Brentford
  'BHA': { primary: '#0057B8', secondary: '#FFCD00', code: 36 },     // Brighton
  'CHE': { primary: '#034694', secondary: '#FFFFFF', code: 8 },      // Chelsea
  'CRY': { primary: '#1B458F', secondary: '#C4122E', code: 31 },     // Crystal Palace
  'EVE': { primary: '#003399', secondary: '#FFFFFF', code: 11 },     // Everton
  'FUL': { primary: '#FFFFFF', secondary: '#000000', code: 54 },     // Fulham
  'IPS': { primary: '#0E4FA0', secondary: '#FFFFFF', code: 40 },     // Ipswich
  'LEI': { primary: '#003090', secondary: '#FDBE11', code: 13 },     // Leicester
  'LIV': { primary: '#C8102E', secondary: '#00B2A9', code: 14 },     // Liverpool
  'MCI': { primary: '#6CABDD', secondary: '#1C2C5B', code: 43 },     // Man City
  'MUN': { primary: '#DA291C', secondary: '#FBE122', code: 1 },      // Man United
  'NEW': { primary: '#241F20', secondary: '#FFFFFF', code: 4 },      // Newcastle
  'NFO': { primary: '#DD0000', secondary: '#FFFFFF', code: 17 },     // Nottingham Forest
  'SOU': { primary: '#D71920', secondary: '#130C0E', code: 20 },     // Southampton
  'TOT': { primary: '#132257', secondary: '#FFFFFF', code: 6 },      // Tottenham
  'WHU': { primary: '#7A263A', secondary: '#1BB1E7', code: 21 },     // West Ham
  'WOL': { primary: '#FDB913', secondary: '#231F20', code: 39 },     // Wolves
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
  const teamData = TEAM_DATA[teamShort] || { primary: '#6B7280', secondary: '#FFFFFF', code: 0 };
  const colors = { primary: teamData.primary, secondary: teamData.secondary };
  const badgeUrl = teamData.code > 0
    ? `https://resources.premierleague.com/premierleague/badges/t${teamData.code}.png`
    : null;

  const sizes = {
    sm: { width: 60, height: 75, fontSize: 9, nameY: 62 },
    md: { width: 80, height: 100, fontSize: 11, nameY: 82 },
    lg: { width: 100, height: 125, fontSize: 13, nameY: 102 }
  };

  const s = sizes[size] || sizes.md;

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

      {/* Points Badge */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-fpl-purple font-bold text-sm px-2 py-1 rounded-full shadow-md min-w-[2rem] text-center z-10">
        {isCaptain && multiplier > 1 ? points * multiplier : points}
      </div>

      {/* Live Indicator */}
      {isPlaying && (
        <div className="absolute -top-1 -left-1 z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      )}

      {/* Jersey SVG */}
      <svg
        width={s.width}
        height={s.height}
        viewBox="0 0 100 125"
        className={`drop-shadow-lg transform transition-all group-hover:scale-110 ${
          isPlaying ? 'animate-pulse' : ''
        }`}
      >
        {/* Jersey body */}
        <path
          d="M 30,15 L 25,25 L 20,35 L 20,90 C 20,95 25,100 30,100 L 70,100 C 75,100 80,95 80,90 L 80,35 L 75,25 L 70,15 L 65,12 L 60,15 L 50,20 L 40,15 L 35,12 Z"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="2"
        />

        {/* Sleeves */}
        <ellipse cx="20" cy="35" rx="8" ry="15" fill={colors.primary} stroke={colors.secondary} strokeWidth="1.5"/>
        <ellipse cx="80" cy="35" rx="8" ry="15" fill={colors.primary} stroke={colors.secondary} strokeWidth="1.5"/>

        {/* Collar */}
        <path
          d="M 40,15 L 45,20 L 50,18 L 55,20 L 60,15 L 55,12 L 50,14 L 45,12 Z"
          fill={colors.secondary}
          stroke={colors.secondary}
          strokeWidth="1"
        />

        {/* Stripe detail (optional decorative element) */}
        <line x1="35" y1="30" x2="35" y2="90" stroke={colors.secondary} strokeWidth="1" opacity="0.3"/>
        <line x1="65" y1="30" x2="65" y2="90" stroke={colors.secondary} strokeWidth="1" opacity="0.3"/>

        {/* Team Badge - embedded as image */}
        {badgeUrl && (
          <image
            href={badgeUrl}
            x="35"
            y="40"
            width="30"
            height="30"
            opacity="0.9"
          />
        )}

        {/* Player name on jersey */}
        <text
          x="50"
          y={s.nameY}
          textAnchor="middle"
          fill={colors.secondary}
          fontSize={s.fontSize}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          stroke={colors.primary}
          strokeWidth="0.5"
        >
          {playerName?.toUpperCase().slice(0, 10)}
        </text>
      </svg>
    </div>
  );
}
