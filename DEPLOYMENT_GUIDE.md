# Deployment Guide for esimlaunch.com

This guide will help you deploy your eSIM Launch platform to production using your domain `esimlaunch.com`.

## 📋 Overview

Your application consists of:
- **Frontend**: React/Vite application (`esim-connect-hub`)
- **Backend**: Express.js API server (`backend`)
- **Database**: PostgreSQL (via Prisma)
- **Additional Services**: Redis (for job queues), Stripe, Clerk, Resend

## 🚀 Recommended Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend) - **RECOMMENDED**

**Best for**: Easy setup, automatic deployments, good free tiers

#### Frontend Deployment (Vercel)

1. **Prepare Frontend Build**
   ```bash
   cd esim-connect-hub
   npm run build
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login
   - Click "New Project"
   - Import your Git repository or upload the `esim-connect-hub` folder
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `esim-connect-hub`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Environment Variables** (in Vercel dashboard):
   ```
   VITE_API_URL=https://api.esimlaunch.com
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

4. **Custom Domain**
   - In Vercel project settings → Domains
   - Add `esimlaunch.com` and `www.esimlaunch.com`
   - Follow DNS instructions (add A/CNAME records)

#### Backend Deployment (Railway)

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or upload code)

3. **Add Services**:
   - **PostgreSQL Database**: Click "New" → "Database" → "PostgreSQL"
   - **Redis**: Click "New" → "Database" → "Redis"
   - **Backend API**: Click "New" → "GitHub Repo" → Select your repo

4. **Configure Backend Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: Railway auto-assigns, use `PORT` env var

5. **Environment Variables** (in Railway):
   ```env
   NODE_ENV=production
   PORT=3000
   API_BASE_URL=https://api.esimlaunch.com
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=your_secure_random_string_here
   JWT_EXPIRES_IN=7d
   
   # CORS - Allow your frontend domain
   CORS_ORIGIN=https://esimlaunch.com,https://www.esimlaunch.com
   FRONTEND_URL=https://esimlaunch.com
   
   # eSIM Access API
   ESIM_ACCESS_API_URL=https://api.esimaccess.com
   ESIM_ACCESS_ACCESS_CODE=your_access_code
   ESIM_ACCESS_SECRET_KEY=your_secret_key
   
   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@esimlaunch.com
   
   # Clerk
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_STARTER_PRICE_ID_MONTHLY=price_xxx
   STRIPE_STARTER_PRICE_ID_YEARLY=price_xxx
   STRIPE_GROWTH_PRICE_ID_MONTHLY=price_xxx
   STRIPE_GROWTH_PRICE_ID_YEARLY=price_xxx
   STRIPE_SCALE_PRICE_ID_MONTHLY=price_xxx
   STRIPE_SCALE_PRICE_ID_YEARLY=price_xxx
   ```

6. **Run Database Migrations**:
   - In Railway, open backend service terminal
   - Run: `npx prisma migrate deploy`
   - Run: `npx prisma generate`

7. **Custom Domain for API**:
   - In Railway, go to backend service → Settings → Networking
   - Add custom domain: `api.esimlaunch.com`
   - Update DNS records as instructed

---

### Option 2: VPS with Docker (Full Control)

**Best for**: Full control, cost-effective for high traffic

#### Prerequisites
- VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Ubuntu 22.04 or similar
- Domain DNS access

#### Setup Steps

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo apt install docker-compose -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Clone Repository**
   ```bash
   git clone <your-repo-url> /var/www/esimlaunch
   cd /var/www/esimlaunch
   ```

3. **Create Docker Compose File** (`docker-compose.prod.yml`):
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_USER: esimlaunch
         POSTGRES_PASSWORD: ${DB_PASSWORD}
         POSTGRES_DB: esimlaunch
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: always
       
     redis:
       image: redis:7-alpine
       restart: always
       
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       environment:
         NODE_ENV: production
         DATABASE_URL: postgresql://esimlaunch:${DB_PASSWORD}@postgres:5432/esimlaunch
         REDIS_URL: redis://redis:6379
         # ... add all other env vars
       depends_on:
         - postgres
         - redis
       restart: always
       ports:
         - "3000:3000"
   ```

4. **Create Backend Dockerfile** (`backend/Dockerfile`):
   ```dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

5. **Build and Deploy**
   ```bash
   # Build frontend
   cd esim-connect-hub
   npm install
   npm run build
   
   # Deploy backend
   cd ../backend
   docker-compose -f docker-compose.prod.yml up -d
   npx prisma migrate deploy
   ```

6. **Nginx Configuration** (`/etc/nginx/sites-available/esimlaunch.com`):
   ```nginx
   # Frontend
   server {
       listen 80;
       server_name esimlaunch.com www.esimlaunch.com;
       
       root /var/www/esimlaunch/esim-connect-hub/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   
   # Backend API
   server {
       listen 80;
       server_name api.esimlaunch.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d esimlaunch.com -d www.esimlaunch.com -d api.esimlaunch.com
   ```

---

### Option 3: Render (All-in-One)

**Best for**: Simple deployment, good for small to medium apps

1. **Frontend (Static Site)**
   - Go to [render.com](https://render.com)
   - New → Static Site
   - Connect repo, set:
     - **Build Command**: `cd esim-connect-hub && npm install && npm run build`
     - **Publish Directory**: `esim-connect-hub/dist`

2. **Backend (Web Service)**
   - New → Web Service
   - Connect repo, set:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **PostgreSQL & Redis**
   - Add PostgreSQL database
   - Add Redis instance
   - Link to backend service

4. **Custom Domains**
   - Add `esimlaunch.com` to frontend
   - Add `api.esimlaunch.com` to backend

---

## 🔧 Pre-Deployment Checklist

### 1. Update Environment Variables

**Backend** (`backend/.env`):
- [ ] Set `NODE_ENV=production`
- [ ] Update `API_BASE_URL` to production URL
- [ ] Update `CORS_ORIGIN` to include production domains
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Use production Stripe keys
- [ ] Use production Clerk keys
- [ ] Set secure `JWT_SECRET` (generate random string)

**Frontend** (`esim-connect-hub/.env`):
- [ ] Set `VITE_API_URL` to production API URL
- [ ] Update Stripe publishable key
- [ ] Update Clerk publishable key

### 2. Database Setup

```bash
cd backend
npx prisma migrate deploy  # Run migrations
npx prisma generate         # Generate Prisma client
```

### 3. Build Frontend

```bash
cd esim-connect-hub
npm install
npm run build
```

### 4. Test Production Build Locally

```bash
# Backend
cd backend
npm run build
npm start

# Frontend (in another terminal)
cd esim-connect-hub
npm run preview
```

### 5. Update Stripe Webhook URL

- Go to Stripe Dashboard → Webhooks
- Update webhook endpoint to: `https://api.esimlaunch.com/api/payments/webhook`
- Update webhook secret in environment variables

### 6. Update Clerk Configuration

- Go to Clerk Dashboard → Domains
- Add `esimlaunch.com` and `www.esimlaunch.com`
- Update allowed origins

---

## 🌐 DNS Configuration

Configure these DNS records with your domain provider:

### For Vercel + Railway Setup:
```
Type    Name    Value
A       @       Vercel IP (provided by Vercel)
CNAME   www     cname.vercel-dns.com
CNAME   api     your-railway-domain.railway.app
```

### For VPS Setup:
```
Type    Name    Value
A       @       Your VPS IP address
A       www     Your VPS IP address
A       api     Your VPS IP address
```

---

## 🔒 Security Checklist

- [ ] Use HTTPS everywhere (SSL certificates)
- [ ] Set secure environment variables
- [ ] Enable CORS only for your domains
- [ ] Use strong JWT secret
- [ ] Enable rate limiting (already in code)
- [ ] Keep dependencies updated
- [ ] Set up monitoring/logging
- [ ] Configure firewall (if using VPS)

---

## 📊 Monitoring & Maintenance

### Recommended Tools:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics, Plausible
- **Logs**: Railway/Render built-in, or CloudWatch (AWS)

### Health Check Endpoint:
Your backend has a health check at: `https://api.esimlaunch.com/health`

---

## 🚨 Troubleshooting

### Frontend not loading
- Check build output for errors
- Verify environment variables are set
- Check browser console for API connection errors

### Backend API errors
- Check backend logs
- Verify database connection
- Check Redis connection
- Verify all environment variables are set

### Database connection issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from backend
- Run migrations: `npx prisma migrate deploy`

### CORS errors
- Verify `CORS_ORIGIN` includes your frontend domain
- Check frontend is using correct `VITE_API_URL`

---

## 📝 Post-Deployment

1. **Test Critical Flows**:
   - [ ] User signup/login
   - [ ] Store creation
   - [ ] Payment processing
   - [ ] eSIM delivery
   - [ ] Webhooks

2. **Set up Backups**:
   - Database backups (automated if using Railway/Render)
   - Environment variable backups

3. **Performance**:
   - Enable CDN for frontend (Vercel does this automatically)
   - Monitor API response times
   - Set up caching where appropriate

---

## 💰 Cost Estimates

### Option 1 (Vercel + Railway):
- Vercel: Free tier (hobby) or $20/month (pro)
- Railway: ~$5-20/month depending on usage
- **Total**: ~$5-40/month

### Option 2 (VPS):
- VPS: $5-20/month (DigitalOcean, Linode)
- Domain: ~$10-15/year
- **Total**: ~$5-20/month

### Option 3 (Render):
- Static Site: Free
- Web Service: $7/month (starter)
- PostgreSQL: $7/month (starter)
- Redis: $10/month (starter)
- **Total**: ~$24/month

---

## 🎯 Quick Start (Recommended: Vercel + Railway)

1. **Deploy Frontend to Vercel** (15 minutes)
2. **Deploy Backend to Railway** (20 minutes)
3. **Configure DNS** (5 minutes)
4. **Run Migrations** (2 minutes)
5. **Test** (10 minutes)

**Total Time**: ~1 hour

---

## 📞 Need Help?

If you encounter issues:
1. Check the logs in your hosting platform
2. Verify all environment variables are set correctly
3. Test the health endpoint: `/health`
4. Check database migrations are applied

Good luck with your deployment! 🚀


