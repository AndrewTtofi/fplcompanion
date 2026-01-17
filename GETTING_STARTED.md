# Getting Started with FPL Companion

## What You Just Got

A complete, production-ready Fantasy Premier League companion application that:

- ✅ Is **fully containerized** with Docker
- ✅ Has a **modern React frontend** with Next.js
- ✅ Has a **robust Node.js backend** with Express
- ✅ Uses **Redis for caching** to avoid API rate limits
- ✅ Features **dual view modes** (list and pitch view)
- ✅ Shows **live gameweek data** and league standings
- ✅ Is ready to **deploy anywhere** (AWS, GCP, DigitalOcean, Heroku, etc.)

---

## 3 Steps to Run It Now

### Step 1: Make sure Docker is running

Open Docker Desktop or start Docker daemon.

### Step 2: Start the application

```bash
cd /Users/andreasttofi/Desktop/fplcompanion
./start.sh
```

**OR**

```bash
npm run dev:build
```

### Step 3: Open your browser

Go to: **http://localhost:3000**

Enter your FPL Team ID: **4604279** (or any valid Team ID)

---

## What You'll See

### 1. Home Page
- Clean landing page
- Team ID input
- Instructions on how to find your Team ID

### 2. Team Dashboard
Three main tabs:

**Overview Tab:**
- Overall points and rank
- Team value and bank
- Last 5 gameweeks performance
- Best/worst gameweek stats
- Chips used and remaining
- League summary

**Current Gameweek Tab:**
- Starting XI and bench
- Live points tracking
- Player stats (goals, assists, clean sheets, bonus)
- Toggle between **List View** and **Pitch View**
- Captain and vice-captain highlighting

**Leagues Tab:**
- All your classic leagues
- League standings with your position
- Points behind leader
- Rank changes

---

## Project Structure

```
fplcompanion/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Redis configuration
│   │   ├── services/          # FPL API integration
│   │   ├── routes/            # API endpoints
│   │   └── server.js          # Express server
│   ├── Dockerfile             # Development build
│   └── Dockerfile.prod        # Production build
│
├── frontend/                   # React + Next.js app
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Layout.js
│   │   │   ├── TeamOverview.js
│   │   │   ├── GameweekView.js
│   │   │   ├── PitchView.js
│   │   │   └── LeagueView.js
│   │   ├── lib/              # API client
│   │   ├── pages/            # Next.js pages
│   │   └── styles/           # TailwindCSS
│   ├── Dockerfile            # Development build
│   └── Dockerfile.prod       # Production build
│
├── docker-compose.yml         # Development setup
├── docker-compose.prod.yml    # Production setup
├── README.md                  # Main documentation
├── DEPLOYMENT.md              # Deployment guide
└── start.sh                   # Quick start script
```

---

## Available Commands

| Command | What It Does |
|---------|-------------|
| `./start.sh` | Quick start (builds and runs everything) |
| `npm run dev` | Start development (no rebuild) |
| `npm run dev:build` | Build and start development |
| `npm run prod` | Start production mode |
| `npm run prod:build` | Build and start production |
| `npm run stop` | Stop all containers |
| `npm run clean` | Stop containers and clear data |

---

## How It Works

### Data Flow

1. **User enters Team ID** in the frontend
2. **Frontend sends request** to backend API (http://localhost:3001)
3. **Backend checks Redis cache** for data
4. If cached: **Returns immediately**
5. If not cached:
   - **Fetches from FPL API** (https://fantasy.premierleague.com/api)
   - **Stores in Redis** with TTL (5 min default)
   - **Returns to frontend**
6. **Frontend displays** data in beautiful UI

### Caching Strategy

- **Bootstrap data** (players, teams): 10 minutes
- **Team data**: 5 minutes
- **Live gameweek**: 1 minute (for real-time updates)
- **Fixtures**: 10 minutes

This ensures fast responses while staying fresh!

---

## Customization Ideas

### Change Colors

Edit [frontend/tailwind.config.js](frontend/tailwind.config.js):

```js
colors: {
  fpl: {
    purple: '#37003c',  // Change these!
    pink: '#ff2882',
    green: '#00ff87',
    cyan: '#04f5ff',
  },
}
```

### Add New Features

1. **Backend**: Add endpoints in `backend/src/routes/index.js`
2. **Frontend**: Create components in `frontend/src/components/`
3. **Connect**: Update API client in `frontend/src/lib/api.js`

### Adjust Cache Duration

Edit `.env`:
```bash
CACHE_TTL=600  # 10 minutes instead of 5
```

---

## What to Do Next

### For Development
1. ✅ The app is running - try it out!
2. Explore the code
3. Make changes and see them live (hot reload enabled)
4. Check the browser console for errors/logs

### For Production
1. Read [DEPLOYMENT.md](DEPLOYMENT.md)
2. Choose your hosting platform
3. Set environment variables
4. Deploy!

### Add Features
Here are some ideas to extend it:

- [ ] **Team comparison**: Compare your team with league rivals
- [ ] **Transfer planner**: Suggest best transfers based on fixtures
- [ ] **Historical data**: Show past seasons performance
- [ ] **Player search**: Search players by name, team, or position
- [ ] **Price change tracker**: Track player price changes
- [ ] **Fixture ticker**: Live score updates
- [ ] **Mini-league chat**: Add comments/chat for leagues
- [ ] **Email notifications**: Alerts for gameweek deadlines

---

## Troubleshooting

### "Cannot connect to backend"

**Check backend is running:**
```bash
docker ps
```

You should see:
- `fpl-backend`
- `fpl-frontend`
- `fpl-redis`

**Check backend health:**
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok",...}`

### "Redis connection failed"

**Restart Redis:**
```bash
docker restart fpl-redis
```

### "Build failed" or "npm install error"

**Clean and rebuild:**
```bash
npm run clean
npm run dev:build
```

### Ports already in use

**Stop existing containers:**
```bash
docker stop $(docker ps -q)
```

Or change ports in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Change 3000 to 3002
```

---

## Files Overview

### Configuration Files
- `package.json` - Root package (workspace config)
- `docker-compose.yml` - Development container setup
- `docker-compose.prod.yml` - Production container setup
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules

### Backend Files
- `backend/src/server.js` - Express server entry point
- `backend/src/config/redis.js` - Redis client setup
- `backend/src/services/fplApi.js` - FPL API integration (all the data fetching)
- `backend/src/routes/index.js` - API endpoints
- `backend/Dockerfile` - Dev Docker build
- `backend/Dockerfile.prod` - Prod Docker build

### Frontend Files
- `frontend/src/pages/index.js` - Home page (Team ID input)
- `frontend/src/pages/team/[id].js` - Team dashboard page
- `frontend/src/components/TeamOverview.js` - Overview tab
- `frontend/src/components/GameweekView.js` - Gameweek tab
- `frontend/src/components/PitchView.js` - Jersey/pitch view
- `frontend/src/components/LeagueView.js` - Leagues tab
- `frontend/src/components/Layout.js` - App layout/header
- `frontend/src/lib/api.js` - API client (calls backend)
- `frontend/src/styles/globals.css` - Global styles
- `frontend/tailwind.config.js` - TailwindCSS config

### Documentation
- `README.md` - Main documentation
- `DEPLOYMENT.md` - Deployment guide
- `GETTING_STARTED.md` - This file!

---

## Tech Stack Details

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React + Next.js | Modern, fast, SEO-friendly |
| **Styling** | TailwindCSS | Utility-first, highly customizable |
| **Backend** | Node.js + Express | Fast, JavaScript everywhere |
| **Caching** | Redis | Blazing fast, perfect for API caching |
| **Data** | FPL Official API | Authoritative, free, public |
| **Containers** | Docker + Compose | Consistent, portable, easy deploy |

---

## API Endpoints Reference

### Team Endpoints
- `GET /api/team/:id` - Get team details
- `GET /api/team/:id/history` - Get season history
- `GET /api/team/:id/picks/:gw` - Get gameweek picks
- `GET /api/team/:id/overview` - Get full overview (recommended)

### Gameweek Endpoints
- `GET /api/gameweek/current` - Get current GW number
- `GET /api/gameweek/:gw/live` - Get live GW data
- `GET /api/players/top/gameweek/:gw` - Top GW scorers

### League Endpoints
- `GET /api/league/classic/:id` - Classic league standings
- `GET /api/league/h2h/:id` - H2H league standings

### Player Endpoints
- `GET /api/player/:id` - Player details
- `GET /api/players/top/alltime` - All-time top scorers

### General Endpoints
- `GET /api/bootstrap` - All players, teams, events
- `GET /api/fixtures` - Fixtures (optionally filtered)
- `GET /health` - Health check

---

## Performance Tips

### Frontend
- Data cached client-side with SWR
- Automatic revalidation on focus
- Images optimized by Next.js
- Code splitting enabled

### Backend
- Redis caching (5 min default)
- Connection pooling
- Compression enabled
- Helmet security headers

### Redis
- Memory limit: 256MB (configurable)
- LRU eviction policy
- AOF persistence enabled

---

## Next Steps

1. **Try the app** - Enter Team ID 4604279 or your own
2. **Explore the code** - It's well-commented and organized
3. **Make a change** - Try modifying colors or adding a feature
4. **Deploy it** - Follow DEPLOYMENT.md when ready
5. **Share it** - Show your FPL league mates!

---

## Support & Contributing

- **Found a bug?** Check the logs: `docker-compose logs -f`
- **Want to contribute?** Fork, branch, commit, PR!
- **Have questions?** Check README.md and DEPLOYMENT.md

---

## License

MIT - Feel free to use this however you like!

---

## Credits

Built with:
- Official FPL API
- React ecosystem
- Docker
- Love for Fantasy Premier League ⚽

**Enjoy your FPL Companion!** 🚀
