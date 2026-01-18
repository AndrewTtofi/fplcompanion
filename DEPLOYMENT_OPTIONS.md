# FPL Companion - Zero-Cost Deployment Options

This guide covers the **easiest and most reliable** ways to deploy your FPL Companion application for free.

---

## 🌟 Recommended Option: Vercel (Frontend) + Render (Backend)

This is the **easiest and most reliable** zero-cost deployment strategy.

### Why This Combination?

- ✅ **Vercel**: Perfect for Next.js (built by the same company!)
- ✅ **Render**: Great free tier for backend APIs
- ✅ **Zero configuration needed** - both auto-detect your setup
- ✅ **GitHub integration** - auto-deploys on push
- ✅ **Free SSL certificates** included
- ✅ **No credit card required**

---

## Step 1: Deploy Frontend to Vercel

### Setup (5 minutes)

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub

2. **Click "Add New Project"**

3. **Import your GitHub repository**: `AndrewTtofi/fplcompanion`

4. **Configure the project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

5. **Add Environment Variable**:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-app.onrender.com` (we'll get this in Step 2)

6. **Click "Deploy"**

That's it! Vercel will:
- Build your Next.js app
- Deploy it to a global CDN
- Give you a URL like `https://fplcompanion.vercel.app`
- Auto-deploy on every push to main

---

## Step 2: Deploy Backend to Render

### Setup (5 minutes)

1. **Go to [render.com](https://render.com)** and sign up with GitHub

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**: `AndrewTtofi/fplcompanion`

4. **Configure the service**:
   - **Name**: `fpl-companion-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variables** (if needed):
   - `NODE_ENV`: `production`
   - `PORT`: `3001`
   - Any API keys or database URLs

6. **Click "Create Web Service"**

7. **Copy your backend URL**: Something like `https://fpl-companion-backend.onrender.com`

8. **Go back to Vercel** and update the `NEXT_PUBLIC_API_URL` environment variable with your Render URL

9. **Redeploy frontend** on Vercel (it will pick up the new env var)

---

## ✅ You're Done!

Your app is now live:
- **Frontend**: `https://fplcompanion.vercel.app`
- **Backend**: `https://fpl-companion-backend.onrender.com`

Both will auto-deploy on every push to `main`!

---

## 📊 Free Tier Limits

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Perfect for personal projects

### Render Free Tier
- ✅ 750 hours/month (more than enough)
- ⚠️ **Spins down after 15 min of inactivity** (first request takes ~30 seconds to wake up)
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ✅ 100GB bandwidth/month

---

## Alternative Option: Railway

If you want both frontend and backend on one platform:

### Railway Setup

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub

2. **Click "New Project" → "Deploy from GitHub repo"**

3. **Select your repository**

4. Railway will auto-detect both frontend and backend and create:
   - ✅ Automatic service detection
   - ✅ Both services deployed
   - ✅ Free $5/month credit (enough for small apps)
   - ✅ No sleep/spin-down

---

## 🚀 Easiest Option: Vercel Only (Static Frontend)

If you don't need the backend running 24/7:

1. **Deploy frontend to Vercel** (as above)

2. **Run backend locally** when you need it:
   ```bash
   cd backend
   npm start
   ```

3. **Use localhost for API** during development:
   - Set `NEXT_PUBLIC_API_URL` to `http://localhost:3001` locally

This works great for personal use and costs absolutely nothing!

---

## Comparison Table

| Platform | Best For | Free Tier | Auto-Deploy | Spin Down? |
|----------|----------|-----------|-------------|------------|
| **Vercel** | Next.js frontend | 100GB/mo | Yes | No |
| **Render** | Node.js backend | 750hrs/mo | Yes | Yes (15min) |
| **Railway** | Full-stack apps | $5 credit/mo | Yes | No |
| **Netlify** | Static sites | 100GB/mo | Yes | No |

---

## My Recommendation

**For your FPL Companion app, use: Vercel + Render**

Why?
1. ✅ Completely free forever
2. ✅ Vercel is built for Next.js (best performance)
3. ✅ Render's free tier is perfect for low-traffic APIs
4. ✅ Both have excellent GitHub integration
5. ✅ Total setup time: ~10 minutes
6. ✅ No credit card required

The only downside is Render spins down after 15 minutes of inactivity. The first request takes ~30 seconds to wake up. For a personal FPL companion app, this is perfectly fine!

---

## Quick Start Commands

### Vercel CLI (optional - for local testing)
```bash
npm i -g vercel
cd frontend
vercel dev  # Test locally with Vercel environment
vercel --prod  # Deploy to production
```

### Render CLI (optional)
```bash
# No CLI needed - just use the dashboard!
# Render auto-deploys from GitHub
```

---

## Environment Variables You'll Need

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com
```

### Backend (Render)
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://fplcompanion.vercel.app
```

---

## Troubleshooting

### Frontend can't reach backend
- Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Make sure backend allows CORS from your frontend domain

### Backend is slow on first request
- This is normal with Render's free tier (spin-down after 15min)
- Upgrade to paid tier ($7/mo) for always-on

### Build fails
- Check build logs in Vercel/Render dashboard
- Make sure `package.json` scripts are correct
- Verify Node version compatibility

---

## 🎯 Next Steps

1. Deploy frontend to Vercel (5 min)
2. Deploy backend to Render (5 min)
3. Update environment variables (2 min)
4. Test your live app! (2 min)

**Total time: ~15 minutes**

Your app will be live at:
- `https://fplcompanion.vercel.app`
- `https://fpl-companion-backend.onrender.com`

And will auto-deploy every time you push to GitHub! 🚀
