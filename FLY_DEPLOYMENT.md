# FPL Companion - Fly.io Deployment Guide

This guide will help you deploy your FPL Companion application to Fly.io with **zero costs** using GitHub Actions for automatic deployment.

## Prerequisites

- GitHub account
- Fly.io account (free, no credit card required)
- Your application code pushed to GitHub

## Step 1: Install Fly.io CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

## Step 2: Sign Up for Fly.io

```bash
flyctl auth signup
```

Or if you already have an account:

```bash
flyctl auth login
```

## Step 3: Create Fly.io Applications

### Create Backend App

```bash
cd backend
flyctl apps create fpl-companion-backend
```

### Create Frontend App

```bash
cd ../frontend
flyctl apps create fpl-companion-frontend
```

**Note:** The app names must be globally unique. If these names are taken, choose different names and update the `app` field in `backend/fly.toml` and `frontend/fly.toml` accordingly.

## Step 4: Get Your Fly.io API Token

```bash
flyctl auth token
```

Copy the token that appears - you'll need it for GitHub Actions.

## Step 5: Add Fly.io Token to GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings**
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `FLY_API_TOKEN`
6. Value: Paste the token from Step 4
7. Click **Add secret**

## Step 6: Initial Manual Deployment

Deploy both applications manually for the first time:

### Deploy Backend

```bash
cd backend
flyctl deploy
```

After deployment completes, get your backend URL:

```bash
flyctl status
```

The URL will be something like: `https://fpl-companion-backend.fly.dev`

### Update Frontend Configuration

Edit `frontend/fly.toml` and uncomment/update the backend URL:

```toml
[env]
  PORT = "3000"
  NODE_ENV = "production"
  NEXT_PUBLIC_API_URL = "https://fpl-companion-backend.fly.dev"
```

Also update your `frontend/src/lib/api.js` to use this environment variable:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

### Deploy Frontend

```bash
cd frontend
flyctl deploy
```

## Step 7: Verify Deployment

After deployment, you can access your application:

- **Frontend**: `https://fpl-companion-frontend.fly.dev`
- **Backend**: `https://fpl-companion-backend.fly.dev`

Check logs:

```bash
# Backend logs
cd backend
flyctl logs

# Frontend logs
cd frontend
flyctl logs
```

## Step 8: Automatic Deployment via GitHub Actions

Now that everything is set up, automatic deployment is configured!

Every time you push to the `main` branch:
1. GitHub Actions will automatically trigger
2. Backend will deploy first
3. Frontend will deploy after backend is ready
4. You can watch the progress in the **Actions** tab on GitHub

### Manual Trigger

You can also trigger deployment manually:
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy to Fly.io** workflow
4. Click **Run workflow**

## Free Tier Limits

Fly.io free tier includes:
- **3 shared-cpu-1x VMs** (we use 2: frontend + backend)
- **3GB persistent storage** (we don't use any currently)
- **160GB outbound data transfer/month**
- **Automatic sleep after inactivity** (wakes up on first request)

This is more than enough for a personal FPL companion app!

## Cost Optimization

The configuration uses:
- **Auto-stop/auto-start machines**: Apps sleep when not in use
- **min_machines_running = 0**: No always-on instances
- **256MB RAM per service**: Minimal resource usage
- **Shared CPU**: Free tier compatible

## Troubleshooting

### App won't start

Check logs:
```bash
cd backend  # or frontend
flyctl logs
```

### Out of memory

Increase memory in `fly.toml`:
```toml
[[vm]]
  memory_mb = 512  # Increased from 256
```

Note: This might exceed free tier limits.

### Environment variables

Set secrets (not visible in logs):
```bash
flyctl secrets set MY_SECRET=value --app fpl-companion-backend
```

View current secrets:
```bash
flyctl secrets list --app fpl-companion-backend
```

### Custom Domain (Optional - Free)

Add your own domain:
```bash
flyctl certs add yourdomain.com --app fpl-companion-frontend
```

Then add the DNS records shown in the output.

## Useful Commands

```bash
# Check app status
flyctl status

# View logs (real-time)
flyctl logs

# SSH into your app
flyctl ssh console

# Scale to always-on (exits free tier)
flyctl scale count 1 --app fpl-companion-backend

# Scale back to free tier
flyctl scale count 0 --app fpl-companion-backend

# Delete an app
flyctl apps destroy fpl-companion-backend
```

## Monitoring

View your apps dashboard:
```bash
flyctl dashboard
```

Or visit: https://fly.io/dashboard

## Alternative: One-Command Deploy

If you prefer a simpler setup without GitHub Actions:

```bash
# Deploy backend
cd backend && flyctl deploy && cd ..

# Deploy frontend
cd frontend && flyctl deploy && cd ..
```

## Production Considerations

For a production-ready deployment, consider:

1. **Database**: Add a PostgreSQL database (free tier available)
   ```bash
   flyctl postgres create --name fpl-companion-db
   ```

2. **Redis**: For caching (not in free tier)
3. **Environment-specific configs**: Separate staging/production apps
4. **Health checks**: Already configured in fly.toml
5. **Monitoring**: Use Fly.io built-in metrics

## Need Help?

- Fly.io Documentation: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- Check deployment logs in GitHub Actions tab

---

**Your app is now live and will automatically deploy on every push to main! 🚀**
