# FPL Companion

A fully containerized Fantasy Premier League companion application that helps FPL managers track their team, gameweeks, and leagues without logging in.

## Features

- **Team Overview**: Complete dashboard with performance stats, team value, and league positions
- **Gameweek Analysis**: Detailed breakdown of any gameweek with live points tracking
- **League Standings**: Classic and Head-to-Head league tables
- **Dual View Modes**: Switch between list/table view and FPL-style pitch/jersey view
- **Transfer History**: Review all transfers, hits, and chip usage
- **Global Stats**: Highest FPL scorers and gameweek top performers
- **Real-time Data**: Cached data from official FPL API with automatic refresh
- **Podcast Insights**: Auto-transcribed Official FPL Podcast episodes (requires Google AI API key)

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Next.js + TailwindCSS
- **Caching**: Redis
- **Containerization**: Docker + Docker Compose
- **API**: Official Fantasy Premier League API

## Quick Start

### Prerequisites

- Docker
- Docker Compose
- Your FPL Team ID (found in the URL when viewing your team on the official FPL website)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AndrewTtofi/fplcompanion.git
   cd fplcompanion
   ```

2. **Start the application** (Development mode)
   ```bash
   npm run dev:build
   ```

   This will:
   - Build all Docker containers
   - Start Redis for caching
   - Start the backend API on port 3001
   - Start the frontend on port 3000

3. **Access the application**
   - Open your browser and go to: http://localhost:3000
   - Enter your FPL Team ID
   - Explore your FPL dashboard!

### Production Deployment

For production deployment:

```bash
npm run prod:build
```

This uses optimized Docker builds with:
- Multi-stage builds for smaller images
- Production-optimized Next.js build
- Node.js production mode
- Automatic container restarts

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development environment |
| `npm run dev:build` | Build and start development environment |
| `npm run prod` | Start production environment |
| `npm run prod:build` | Build and start production environment |
| `npm run stop` | Stop all containers |
| `npm run clean` | Stop containers and remove volumes |

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port: 3000    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│   Backend API   │◄────►│     Redis       │
│   (Express)     │      │    (Cache)      │
│   Port: 3001    │      │   Port: 6379    │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│   FPL API       │
│ (External)      │
└─────────────────┘
```

## API Endpoints

The backend exposes the following endpoints:

- `GET /api/bootstrap` - Get all players, teams, and gameweeks
- `GET /api/team/:id` - Get team details
- `GET /api/team/:id/history` - Get team history
- `GET /api/team/:id/picks/:gameweek` - Get team picks for gameweek
- `GET /api/team/:id/overview` - Get comprehensive team overview
- `GET /api/gameweek/current` - Get current gameweek number
- `GET /api/gameweek/:id/live` - Get live gameweek data
- `GET /api/league/classic/:id` - Get classic league standings
- `GET /api/league/h2h/:id` - Get H2H league standings
- `GET /api/players/top/alltime` - Get highest FPL scorers
- `GET /api/players/top/gameweek/:gw` - Get gameweek top scorers
- `GET /api/player/:id` - Get player details
- `GET /api/fixtures` - Get fixtures
- `GET /api/podcast/transcript` - Get latest podcast transcript
- `GET /api/podcast/status` - Get podcast processing status

## Configuration

### Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

```bash
# Backend
NODE_ENV=development
PORT=3001
REDIS_HOST=redis
REDIS_PORT=6379
FPL_API_BASE_URL=https://fantasy.premierleague.com/api
CACHE_TTL=300

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional: Podcast Insights (see below)
GOOGLE_AI_API_KEY=your_api_key_here
```

### Podcast Insights

The app can automatically extract FPL insights (transfers, captaincy picks, chip strategy) from the Official FPL Podcast using Google's Gemini AI. This feature is **optional** - the app works fine without it.

**To enable podcast insights:**

1. **Get a Google AI API key** (free):
   - Go to https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Add the key to your configuration**:

   Option A - In `docker-compose.yml`:
   ```yaml
   environment:
     - GOOGLE_AI_API_KEY=your_actual_api_key_here
   ```

   Option B - In `.env` file:
   ```bash
   GOOGLE_AI_API_KEY=your_actual_api_key_here
   ```

3. **Restart the containers**:
   ```bash
   docker-compose down && docker-compose up -d
   ```

The latest podcast episode will be automatically processed on startup - transcribed and analyzed for FPL insights. Results are cached for 7 days.

**Cost**: Google AI provides a free tier with 1,000 requests/day, which is more than enough for this feature.

### Cache Configuration

- Default cache TTL: 5 minutes (300 seconds)
- Live gameweek data: 1 minute cache
- Bootstrap data (players, teams): 10 minutes cache

You can adjust cache duration by modifying `CACHE_TTL` in the environment variables.

## Development

### Project Structure

```
fplcompanion/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── redis.js
│   │   ├── services/
│   │   │   └── fplApi.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── server.js
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   ├── TeamOverview.js
│   │   │   ├── GameweekView.js
│   │   │   ├── PitchView.js
│   │   │   └── LeagueView.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── index.js
│   │   │   ├── team/[id].js
│   │   │   └── _app.js
│   │   └── styles/
│   │       └── globals.css
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
└── README.md
```

### Adding New Features

1. **Backend**: Add new endpoints in `backend/src/routes/index.js`
2. **Backend Services**: Add FPL API integrations in `backend/src/services/fplApi.js`
3. **Frontend**: Create new components in `frontend/src/components/`
4. **API Client**: Update `frontend/src/lib/api.js` with new API methods

## Troubleshooting

### Containers won't start

```bash
# Clean everything and rebuild
npm run clean
npm run dev:build
```

### Backend can't connect to Redis

Check Redis is running:
```bash
docker ps | grep redis
```

### Frontend can't reach backend

Ensure both containers are running:
```bash
docker ps
```

Check the backend logs:
```bash
docker logs fpl-backend
```

### Cache issues

Clear Redis cache:
```bash
docker exec -it fpl-redis redis-cli FLUSHALL
```

## How to Find Your Team ID

1. Go to https://fantasy.premierleague.com and log in
2. Click on "Points" or "My Team"
3. Look at the URL - it will be like: `/entry/XXXXXX/`
4. The numbers (XXXXXX) are your Team ID

Example: If URL is `https://fantasy.premierleague.com/entry/4604279/event/22`
Your Team ID is: **4604279**

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Commit message conventions
- Semantic versioning
- Development workflow
- Pull request process

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.

## Versioning

This project uses [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for version history.

**Current Version:** v2.13.3

- **MAJOR** version for incompatible API changes
- **MINOR** version for new features (backward-compatible)
- **PATCH** version for bug fixes

Versions are automatically managed through commit messages on merge to `main`.

## Links

- **Live Site:** https://fplcompanion.com
- **GitHub Repository:** https://github.com/AndrewTtofi/fplcompanion
- **Issue Tracker:** https://github.com/AndrewTtofi/fplcompanion/issues
- **Releases:** https://github.com/AndrewTtofi/fplcompanion/releases
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Buy Me a Coffee:** https://buymeacoffee.com/fplcompanion

## License

MIT - See [LICENSE](LICENSE) for details

## Acknowledgments

- Data provided by the official Fantasy Premier League API
- Built with React, Next.js, Express, and Redis
- Containerized with Docker for easy deployment

## Roadmap

- [x] Team comparison feature
- [x] Podcast insights (transcript)
- [x] Podcast insights (AI-extracted picks)
- [x] Transfer planner
- [x] Dark mode
- [x] Mobile-responsive improvements
- [x] SEO & search engine indexing
- [ ] Fixture difficulty analyzer
- [x] Player search by name
- [ ] Historical season data
- [ ] Email/push notifications for gameweek updates
