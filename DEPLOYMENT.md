# Deployment Guide

## Local Development (Recommended for Testing)

### Quick Start

```bash
# Option 1: Use the start script
./start.sh

# Option 2: Use npm scripts
npm run dev:build
```

Access the application at: **http://localhost:3000**

---

## Production Deployment Options

### Option 1: Docker Compose (Easiest)

Perfect for VPS, dedicated servers, or local production deployment.

```bash
# Build and start in production mode
npm run prod:build

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
```

**Services will run on:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Redis: localhost:6379

**To stop:**
```bash
docker-compose -f docker-compose.prod.yml down
```

---

### Option 2: Cloud Platforms

#### AWS (ECS/EC2)

1. **Push images to ECR**
   ```bash
   # Backend
   cd backend
   docker build -f Dockerfile.prod -t fpl-backend .
   docker tag fpl-backend:latest <ecr-url>/fpl-backend:latest
   docker push <ecr-url>/fpl-backend:latest

   # Frontend
   cd ../frontend
   docker build -f Dockerfile.prod -t fpl-frontend .
   docker tag fpl-frontend:latest <ecr-url>/fpl-frontend:latest
   docker push <ecr-url>/fpl-frontend:latest
   ```

2. **Create ECS task definitions** for each service
3. **Set up ALB** for routing
4. **Use ElastiCache Redis** for production cache

#### Google Cloud Platform (Cloud Run)

```bash
# Deploy backend
cd backend
gcloud run deploy fpl-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend
cd ../frontend
gcloud run deploy fpl-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=<backend-url>
```

Use **Google Cloud Memorystore** for Redis.

#### DigitalOcean (App Platform)

1. Connect your GitHub repository
2. Add three components:
   - **Backend** (Node.js service from `backend/`)
   - **Frontend** (Node.js service from `frontend/`)
   - **Redis** (Managed database)
3. Set environment variables in the dashboard

#### Heroku

```bash
# Create apps
heroku create fpl-backend
heroku create fpl-frontend

# Add Redis
heroku addons:create heroku-redis:mini -a fpl-backend

# Deploy backend
cd backend
git init
heroku git:remote -a fpl-backend
git add .
git commit -m "Deploy backend"
git push heroku master

# Deploy frontend
cd ../frontend
git init
heroku git:remote -a fpl-frontend
heroku config:set NEXT_PUBLIC_API_URL=https://fpl-backend.herokuapp.com
git add .
git commit -m "Deploy frontend"
git push heroku master
```

---

### Option 3: Kubernetes

Create Kubernetes manifests:

**deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fpl-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fpl-backend
  template:
    metadata:
      labels:
        app: fpl-backend
    spec:
      containers:
      - name: backend
        image: fpl-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: REDIS_HOST
          value: redis-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fpl-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fpl-frontend
  template:
    metadata:
      labels:
        app: fpl-frontend
    spec:
      containers:
      - name: frontend
        image: fpl-frontend:latest
        ports:
        - containerPort: 3000
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Backend port | `3001` |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `FPL_API_BASE_URL` | FPL API URL | `https://fantasy.premierleague.com/api` |
| `CACHE_TTL` | Cache duration (seconds) | `300` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

---

## SSL/HTTPS Configuration

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name fplcompanion.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Add SSL with Let's Encrypt:
```bash
certbot --nginx -d fplcompanion.com
```

---

## Performance Optimization

### 1. Redis Configuration

For production, increase Redis memory:
```bash
# In docker-compose.prod.yml, add:
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 2. Backend Scaling

Use PM2 for clustering:
```bash
npm install pm2 -g
pm2 start src/server.js -i max
```

### 3. Frontend Optimization

Already included in production build:
- Static optimization
- Image optimization
- Code splitting
- Minification

---

## Monitoring

### Health Checks

- Backend: `http://localhost:3001/health`
- Returns: `{"status": "ok", "timestamp": "..."}`

### Logging

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### Metrics

Consider adding:
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Sentry** for error tracking

---

## Backup and Restore

### Redis Data Backup

```bash
# Backup
docker exec fpl-redis redis-cli SAVE
docker cp fpl-redis:/data/dump.rdb ./backup-$(date +%Y%m%d).rdb

# Restore
docker cp backup-20250117.rdb fpl-redis:/data/dump.rdb
docker restart fpl-redis
```

---

## Troubleshooting Production Issues

### High Memory Usage

Check Redis memory:
```bash
docker exec fpl-redis redis-cli INFO memory
```

Clear cache if needed:
```bash
docker exec fpl-redis redis-cli FLUSHALL
```

### Slow Response Times

1. Check Redis connection
2. Verify FPL API is responding
3. Check network latency
4. Increase cache TTL for less-critical data

### Container Crashes

View logs:
```bash
docker logs fpl-backend
docker logs fpl-frontend
```

Restart services:
```bash
docker-compose restart backend
docker-compose restart frontend
```

---

## Cost Estimates

### Minimal Setup (1-100 users)
- **DigitalOcean**: $12/month (Basic Droplet + Redis)
- **Heroku**: $16/month (2 dynos + Redis mini)
- **AWS**: ~$20/month (t3.micro + ElastiCache)

### Medium Setup (100-1000 users)
- **DigitalOcean**: $36/month (2GB Droplet + Redis)
- **AWS**: ~$50/month (t3.small + ElastiCache)
- **GCP**: ~$45/month (Cloud Run + Memorystore)

---

## Security Checklist

- [ ] Use HTTPS/SSL in production
- [ ] Set secure Redis password
- [ ] Enable CORS only for your domain
- [ ] Rate limit API endpoints
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable Docker security scanning
- [ ] Set up firewall rules
- [ ] Monitor for unusual traffic

---

## Maintenance

### Update Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Rebuild Containers

```bash
npm run prod:build
```

### Database Cleanup

Clear old cache entries (Redis auto-expires based on TTL):
```bash
docker exec fpl-redis redis-cli INFO keyspace
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check GitHub issues
4. Create a new issue with logs and error details
