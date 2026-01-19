# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nothing yet

---

## [v2.9.0] - 2026-01-19

### Changes
- feat: league tab fixes and FPL pitch background (#20) (75e1f8b)

## [v2.8.15] - 2026-01-19

### Changes
- fix: improve chips display with icons and fix rank unchanged icon (#19) (009bcfc)

## [v2.8.14] - 2026-01-19

### Changes
- fix: make league View buttons navigate to Leagues tab (#18) (9cb20b5)

## [v2.8.13] - 2026-01-19

### Changes
- fix: correct overall rank arrow color logic (#17) (2431f52)

## [v2.8.12] - 2026-01-19

### Changes
- fix: improve auto-substitution display and positioning (#16) (ba73c78)

## [v2.8.11] - 2026-01-18

### Changes
- fix: update Dockerfiles to install all dependencies for dev mode (#15) (32389ed)

## [v2.8.10] - 2026-01-18

### Changes
- chore: remove build artifacts from git tracking (#14) (0be2032)

## [v2.8.9] - 2026-01-18

### Changes
- fix: remove horizontal scroll from tabs navigation (#13) (5e8ec03)

## [v2.8.8] - 2026-01-18

### Changes
- fix: improve team field view UI and functionality (#12) (14da1c2)

## [v2.8.7] - 2026-01-18

### Changes
- fix: restructure header to prevent league filter overlap on desktop (6a84cd0)

## [v2.8.6] - 2026-01-18

### Changes
- fix: add relative positioning to header for desktop layout (453f1ad)

## [v2.8.5] - 2026-01-18

### Changes
- refactor: remove Fly.io config, add better deployment options (4685129)

## [v2.8.4] - 2026-01-18

### Changes
- fix: use npm install instead of npm ci (no lock files) (fc6a210)

## [v2.8.3] - 2026-01-18

### Changes
- fix: use --omit=dev instead of deprecated --only=production (deac5cf)

## [v2.8.2] - 2026-01-18

### Changes
- fix: update Dockerfiles for production deployment (eae7975)

## [v2.8.1] - 2026-01-18

### Changes
- fix: use separate Fly.io tokens for backend and frontend (2c5c576)

## [v2.8.0] - 2026-01-18

### Changes
- feat: add Fly.io deployment with GitHub Actions (e7354e0)
- Mobile Responsive Design (#11) (e218bf5)

## [v2.7.0] - 2026-01-18

### Changes
- feat: add global league filter with URL persistence (#10) (ac75917)
- Update README.md (db188fc)

## [v2.6.3] - 2026-01-18

### Changes
- fix: keep popup within screen bounds while staying beside player (#9) (b9b4a5c)

## [v2.6.2] - 2026-01-18

### Changes
- fix: keep popup within screen bounds while staying beside player (c868068)

## [v2.6.1] - 2026-01-18

### Changes
- fix: popup always opens beside player row (not above/below) (baacf04)

## [v2.6.0] - 2026-01-18

### Changes
- feat: dynamic popup positioning based on screen position (46023fd)

## [v2.5.6] - 2026-01-18

### Changes
- fix: prevent popup flash at top-left on first hover (ee7a4f6)

## [v2.5.5] - 2026-01-18

### Changes
- fix: improve Live Points hover - remove animation and show all player states (3366296)

## [v2.5.4] - 2026-01-18

### Changes
- fix: display hover points in Live Points view without breaking layout (427800d)
- Revert "fix: display hover points popup in Live Points view" (596f2cd)

## [v2.5.3] - 2026-01-18

### Changes
- fix: display hover points popup in Live Points view (5d8df02)

## [v2.5.2] - 2026-01-18

### Changes
- fix: ensure hover points display properly in field view (c653275)
- Add My Feeds tab and League Comparison features (#8) (5ff7ef5)

## [v2.5.1] - 2026-01-17

### Changes
- fix: improve field view layout and dimensions (#7) (225ea40)

## [v2.5.0] - 2026-01-17

### Changes
- feat: implement URL-based routing to preserve page state on refresh (#6) (d2e950a)

## [v2.4.0] - 2026-01-17

### Changes
- feat: beautify player hover popup in Live Points view (#5) (fffa36b)

## [v2.3.2] - 2026-01-17

### Changes
- fix: Display live points in Overview tab (#4) (20e97e1)

## [v2.3.1] - 2026-01-17

### Changes
- fix: display live points in header and league tab (#3) (da58e7d)

## [v2.3.0] - 2026-01-17

### Changes
- feat: Football Field View with Live Points and Auto-Substitutions (#2) (124327d)

## [v2.2.0] - 2026-01-17

### Changes
- Merge pull request #1 from AndrewTtofi/feat/enhance-ui-performance (2b405c7)
- fix(lint): resolve ESLint errors and CI secrets detection (e3109cf)
- fix(ci): resolve CI pipeline configuration issues (109b503)
- feat(ui): enhance UI performance and user experience (59263f8)

## [v2.1.0] - 2026-01-17

### Changes
- feat(ci): add comprehensive CI/CD pipeline and workflow documentation (b704c23)

## [v2.0.2] - 2026-01-17

### Changes
- docs: update workflow fixes with heredoc syntax error solution (aad231f)

## [v2.0.1] - 2026-01-17

### Changes
- fix(ci): resolve shell syntax error in changelog generation (7e1d70d)

## [2.0.0] - 2026-01-17

### Added - Major Feature Release 🎉

#### Live Points Tracking ⚡
- **Real-time gameweek performance** with auto-refresh (30-second intervals)
- **Live points calculation** including captain multiplier (2x)
- **Detailed player statistics** breakdown:
  - Minutes played, goals, assists, clean sheets
  - Bonus points (BPS), yellow/red cards, saves
  - Goals conceded, penalties saved/missed
- **Fixture information** displayed per player
  - Home vs away indicators
  - Live scores during matches
  - Match status (upcoming, live, finished)
- **Auto-refresh system** with toggle control
- **Live match indicators** with pulsing green animation
- **"Yet to Play" counter** for remaining players
- **Points on bench** tracking
- **Points breakdown** showing exactly how each point was earned
- New endpoint: `GET /api/team/:id/live/:gameweek`
- New component: `LivePointsView.js`

#### Team Comparison 🆚
- **Head-to-head analysis** with any FPL manager
- **Quick select** opponents from league standings
- **Manual entry** by Team ID
- **Comparison metrics:**
  - Gameweek points (live and final)
  - Overall points and rank
  - Net points (after transfer hits)
- **Shared players identification**
- **Differential analysis:**
  - Your unique players
  - Opponent's unique players
  - Points from differentials
- **Captain comparison:**
  - Points breakdown (base × multiplier)
  - Captain swing analysis
  - Same captain indicator
- **Auto-generated narrative summary:**
  - Who's ahead and by how much
  - Captain choice impact
  - Differential performance insights
- New endpoint: `GET /api/compare/:teamId1/:teamId2/:gameweek`
- New component: `ComparisonView.js`

#### Enhanced Pitch View 🏟️
- **Visual football pitch layout** with realistic background
- **Color-coded jerseys** by position:
  - Yellow (Goalkeepers)
  - Red (Defenders)
  - Blue (Midfielders)
  - Purple (Forwards)
  - Gray (Bench players)
- **Fixture display** on each jersey
- **Live match animations** (pulsing indicators)
- **Captain/Vice-captain badges** on jerseys
- **Hover tooltips** with detailed player stats:
  - Full player name
  - Price
  - All statistics
  - Complete fixture list
  - Points breakdown
- **Status indicators:**
  - Live (pulsing green dot)
  - Yet to play (blue badge)
  - Did not play (DNP)
- **Yellow/red card icons** displayed
- New component: `EnhancedPitchView.js`

#### Enhanced Player Statistics 📊
- **Comprehensive stats** for every player:
  - Minutes, goals, assists, clean sheets
  - Goals conceded, penalties, cards
  - Saves (for goalkeepers)
  - Bonus points breakdown
- **Points breakdown** explaining how each point was earned
- **Fixture information** with live updates
- Integrated into all views (list, pitch, live)

#### UI/UX Improvements
- **Sub-tab navigation** in Current Gameweek:
  - Live Points tab
  - Compare tab
- **Visual enhancements:**
  - Pulsing live indicators for active matches
  - Color-coded status badges
  - Smooth transitions
  - Improved loading states
  - Better error handling
- **Interactive elements:**
  - Toggle auto-refresh
  - Manual refresh button
  - Quick opponent selection
  - Hover tooltips
  - Responsive design improvements

### Changed
- **GameweekView** now uses `EnhancedGameweekView` component
- **API caching strategy** optimized:
  - Live gameweek data: 30 seconds (was 60)
  - Team data: 5 minutes (unchanged)
  - Bootstrap data: 10 minutes (unchanged)
- **Team page** restructured with new sub-tabs
- **API client** enhanced with new methods

### Fixed
- Path alias configuration in Next.js (added `jsconfig.json`)
- Module resolution for `@/` imports
- Container startup optimization

---

## [1.0.0] - 2026-01-17

### Added - Initial Release 🚀

#### Core Application
- **Fully containerized** FPL companion application
- **Docker Compose** setup for easy deployment
- **Three-tier architecture:**
  - Frontend (Next.js + React)
  - Backend (Node.js + Express)
  - Cache (Redis)

#### Backend Features
- **RESTful API** with comprehensive endpoints:
  - `GET /api/bootstrap` - All players, teams, gameweeks
  - `GET /api/team/:id` - Team details
  - `GET /api/team/:id/history` - Season history
  - `GET /api/team/:id/picks/:gw` - Gameweek picks
  - `GET /api/team/:id/overview` - Comprehensive overview
  - `GET /api/gameweek/current` - Current gameweek number
  - `GET /api/gameweek/:id/live` - Live gameweek data
  - `GET /api/league/classic/:id` - Classic league standings
  - `GET /api/league/h2h/:id` - H2H league standings
  - `GET /api/player/:id` - Player details
  - `GET /api/players/top/alltime` - All-time top scorers
  - `GET /api/players/top/gameweek/:gw` - GW top scorers
  - `GET /api/fixtures` - Fixtures data
- **FPL API integration** with error handling
- **Redis caching** for all endpoints:
  - 10 min for bootstrap data
  - 5 min for team data
  - 1 min for live gameweek data
- **Health check** endpoint
- **Compression** and security headers (Helmet)
- **CORS** support

#### Frontend Features
- **Landing page** with Team ID input
- **Team dashboard** with three main tabs:
  - Overview
  - Current Gameweek
  - Leagues

##### Team Overview Tab
- **Performance statistics:**
  - Overall points and rank
  - Rank change indicators
  - Team value and bank
  - Total transfers
- **Recent form:**
  - Last 5 gameweeks table
  - Best/worst gameweek stats
- **Chips tracking:**
  - Wildcard, Bench Boost, Free Hit, Triple Captain
  - Shows which are used/available
  - Displays gameweek when used
- **League summary** with quick links

##### Current Gameweek Tab
- **Squad display** with two view modes:
  - List/Table view
  - Pitch/Jersey view
- **Starting XI** with full details
- **Bench** players
- **Captain/Vice-captain** highlighting
- **Player statistics:**
  - Minutes, goals, assists, clean sheets, bonus
- **Transfer information:**
  - Number of transfers
  - Transfer costs (hits)

##### Leagues Tab
- **Classic league standings:**
  - Full table with rank changes
  - User position highlighted
  - Points behind leader
- **League statistics:**
  - League leader
  - Average points
  - Highest GW score
- **Multiple league support** with dropdown selector

##### Global Features
- **All-time top scorers** view
- **Gameweek top performers**
- **Responsive design** (mobile, tablet, desktop)
- **FPL official colors:**
  - Purple (#37003c)
  - Pink (#ff2882)
  - Green (#00ff87)
  - Cyan (#04f5ff)

#### Development Features
- **Hot reload** in development mode
- **SWR** for efficient data fetching
- **TailwindCSS** for styling
- **Lucide React** for icons
- **Error boundaries** and error handling
- **Loading states** throughout

#### DevOps & Deployment
- **Docker containerization:**
  - Development Dockerfile
  - Production Dockerfile (multi-stage builds)
- **Docker Compose:**
  - Development configuration
  - Production configuration
- **Environment configuration:**
  - `.env.example` template
  - Configurable cache TTL
  - Configurable ports
- **Scripts:**
  - `npm run dev` - Start development
  - `npm run dev:build` - Build and start dev
  - `npm run prod` - Start production
  - `npm run prod:build` - Build and start prod
  - `npm run stop` - Stop containers
  - `npm run clean` - Clean volumes
- **Start script** (`start.sh`) for quick launch

#### Documentation
- **README.md** - Complete project overview
- **DEPLOYMENT.md** - Deployment guide for:
  - AWS (ECS, EC2)
  - Google Cloud (Cloud Run)
  - DigitalOcean (App Platform)
  - Heroku
  - Kubernetes
  - Local/VPS deployment
- **GETTING_STARTED.md** - Beginner-friendly guide
- **QUICK_START.md** - Quick reference
- **STATUS.md** - System status and troubleshooting

#### Project Structure
- **Monorepo setup** with workspaces
- **Separated concerns:**
  - `/backend` - API server
  - `/frontend` - Next.js app
  - `/docker-compose.yml` - Orchestration
- **.gitignore** configured
- **Health checks** for all services

---

## Version History

- **2.0.0** (2026-01-17) - Major feature release: Live Points, Team Comparison, Enhanced Pitch View
- **1.0.0** (2026-01-17) - Initial release: Core application with team overview, gameweeks, leagues

---

## Upgrade Guide

### From 1.0.0 to 2.0.0

#### Backend
No breaking changes. New endpoints are additive.

**Action required:**
1. Restart backend container to load new code:
   ```bash
   docker-compose restart backend
   ```

#### Frontend
No breaking changes. New components are integrated seamlessly.

**Action required:**
1. Restart frontend container:
   ```bash
   docker-compose restart frontend
   ```

#### Database
No migration needed. Redis cache will auto-populate.

#### Configuration
No changes to environment variables needed.

---

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New features, backward-compatible
- **PATCH** version (0.0.X): Bug fixes, backward-compatible

### What triggers version bumps?

#### MAJOR (X.0.0)
- Breaking API changes
- Removed endpoints
- Changed response formats
- Database schema changes requiring migration
- Major UI overhaul changing core workflows

#### MINOR (0.X.0)
- New features
- New API endpoints
- New UI components
- Enhanced functionality
- Dependency updates (minor)

#### PATCH (0.0.X)
- Bug fixes
- Performance improvements
- Documentation updates
- Dependency patches
- Security fixes

---

## Contributing

See our contribution guidelines for how to:
- Report bugs
- Suggest features
- Submit pull requests
- Follow commit message conventions

---

## Links

- **GitHub Repository:** https://github.com/AndrewTtofi/fplcompanion
- **Issue Tracker:** https://github.com/AndrewTtofi/fplcompanion/issues
- **Releases:** https://github.com/AndrewTtofi/fplcompanion/releases

---

[Unreleased]: https://github.com/AndrewTtofi/fplcompanion/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/AndrewTtofi/fplcompanion/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/AndrewTtofi/fplcompanion/releases/tag/v1.0.0
