# Quick Start Guide

## ✅ System Status

Your FPL Companion is **ready to run**!

---

## 🚀 Launch the App (3 Steps)

### Step 1: Open Terminal

Navigate to the project:
```bash
cd /Users/andreasttofi/Desktop/fplcompanion
```

### Step 2: Start Everything

```bash
docker-compose up -d
```

This will:
- ✅ Start Redis (cache)
- ✅ Start Backend API (port 3001)
- ✅ Start Frontend (port 3000)

### Step 3: Open Browser

Go to: **http://localhost:3000**

Enter your Team ID: **4604279** (or any valid FPL Team ID)

---

## 🎯 Your App is Running!

You should see:
- 🏠 **Homepage** with Team ID input
- 📊 **Dashboard** after entering Team ID with:
  - Overview tab
  - Current Gameweek tab
  - Leagues tab

---

## 📋 Useful Commands

### Check if containers are running
```bash
docker ps
```

You should see 3 containers:
- `fpl-frontend` (port 3000)
- `fpl-backend` (port 3001)
- `fpl-redis` (port 6379)

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Stop everything
```bash
docker-compose down
```

### Restart if needed
```bash
docker-compose restart
```

### Clean rebuild
```bash
docker-compose down
docker-compose up --build -d
```

---

## 🔧 What If Something Breaks?

### Frontend shows errors
```bash
docker-compose restart frontend
docker-compose logs -f frontend
```

### Backend can't connect
```bash
docker-compose restart backend redis
docker-compose logs -f backend
```

### Complete reset
```bash
docker-compose down -v
docker-compose up --build -d
```

---

## 📱 Access Points

Once running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main web app |
| **Backend API** | http://localhost:3001/api | REST API |
| **Health Check** | http://localhost:3001/health | Server status |

---

## 🎮 Try These Features

1. **Enter Team ID 4604279** (or yours)
2. Click **"Overview"** tab to see:
   - Overall rank and points
   - Last 5 gameweeks
   - Team value
   - Chips used
3. Click **"Current Gameweek"** tab:
   - See your starting XI
   - Toggle between **List View** and **Pitch View**
   - Check live points
4. Click **"Leagues"** tab:
   - See your league standings
   - Your position
   - Points behind leader

---

## 🔍 How to Find Your Team ID

1. Go to https://fantasy.premierleague.com
2. Log in to your account
3. Click "Points" or "My Team"
4. Look at the URL bar
5. Find: `https://fantasy.premierleague.com/entry/XXXXXX/`
6. **XXXXXX** is your Team ID

Example:
- URL: `https://fantasy.premierleague.com/entry/4604279/event/22`
- Team ID: **4604279**

---

## ✨ What's Working

✅ **Backend API**
- Successfully fetches data from FPL API
- Caches responses in Redis
- Serves data to frontend

✅ **Frontend**
- Beautiful landing page
- Team dashboard with 3 tabs
- Responsive design
- List & Pitch view modes

✅ **Caching**
- Redis stores API responses
- Reduces load on FPL servers
- Faster response times

---

## 📞 Need Help?

Check the logs first:
```bash
docker-compose logs -f
```

Look for errors in:
- **Red text** = errors
- **Yellow text** = warnings
- **Green text** = success

Common issues and fixes are in [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🎉 You're All Set!

Your FPL Companion is running and ready to use. Enjoy tracking your Fantasy Premier League team! ⚽

**Next Steps:**
- Use the app with your Team ID
- Explore all features
- Read [DEPLOYMENT.md](DEPLOYMENT.md) when ready to deploy to production
