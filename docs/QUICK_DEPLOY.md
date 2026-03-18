# Quick Deployment Steps for esimlaunch.com

## 🚀 Fastest Path to Production (Vercel + Railway)

### Step 1: Deploy Frontend to Vercel (15 min)

1. **Build and Test Locally First**:
   ```bash
   cd esim-connect-hub
   npm install
   npm run build
   npm run preview  # Test the build
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com and sign up/login
   - Click "Add New..." → "Project"
   - Import your Git repository (or drag & drop the `esim-connect-hub` folder)
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `esim-connect-hub`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click "Deploy"

3. **Add Environment Variables** (in Vercel project settings):
   ```
   VITE_API_BASE_URL=https://api.esimlaunch.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```
   - Redeploy after adding env vars

4. **Add Custom Domain**:
   - Go to Project Settings → Domains
   - Add `esimlaunch.com` and `www.esimlaunch.com`
   - Follow DNS instructions (you'll add these records in Step 3)

---

### Step 2: Deploy Backend to Railway (20 min)

1. **Sign up at Railway**: https://railway.app

2. **Create PostgreSQL Database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Wait for it to provision
   - Note the connection string

3. **Create Redis Instance**:
   - Click "New" → "Database" → "Redis"
   - Wait for it to provision
   - Note the connection URL

4. **Deploy Backend**:
   - Click "New" → "GitHub Repo" (or "Empty Project" and connect later)
   - Select your repository
   - Railway will auto-detect it's a Node.js project
   - Configure:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

5. **Add Environment Variables** (in Railway backend service):
   
   **Required Variables**:
   ```env
   NODE_ENV=production
   PORT=3000
   API_BASE_URL=https://api.esimlaunch.com
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=generate_a_random_string_here_min_32_chars
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://esimlaunch.com,https://www.esimlaunch.com
   FRONTEND_URL=https://esimlaunch.com
   ```
   
   **eSIM Access API**:
   ```env
   ESIM_ACCESS_API_URL=https://api.esimaccess.com
   ESIM_ACCESS_ACCESS_CODE=your_access_code
   ESIM_ACCESS_SECRET_KEY=your_secret_key
   ```
   
   **Email (Resend)**:
   ```env
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@esimlaunch.com
   ```
   
   **Clerk**:
   ```env
   CLERK_SECRET_KEY=sk_live_...
   ```
   
   **Stripe**:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_STARTER_PRICE_ID_MONTHLY=price_...
   STRIPE_STARTER_PRICE_ID_YEARLY=price_...
   STRIPE_GROWTH_PRICE_ID_MONTHLY=price_...
   STRIPE_GROWTH_PRICE_ID_YEARLY=price_...
   STRIPE_SCALE_PRICE_ID_MONTHLY=price_...
   STRIPE_SCALE_PRICE_ID_YEARLY=price_...
   ```

6. **Run Database Migrations**:
   - In Railway, click on your backend service
   - Open the "Deploy Logs" or "Shell" tab
   - Run:
     ```bash
     npx prisma migrate deploy
     npx prisma generate
     ```

7. **Add Custom Domain**:
   - Go to backend service → Settings → Networking
   - Click "Custom Domain"
   - Add: `api.esimlaunch.com`
   - Railway will provide DNS records (save for Step 3)

---

### Step 3: Configure DNS (5 min)

Go to your domain registrar (where you bought esimlaunch.com) and add these DNS records:

**For Frontend (Vercel)**:
```
Type: A
Name: @
Value: [IP provided by Vercel]

Type: CNAME
Name: www
Value: [CNAME provided by Vercel]
```

**For Backend API (Railway)**:
```
Type: CNAME
Name: api
Value: [CNAME provided by Railway]
```

**Wait for DNS propagation** (5-60 minutes, usually faster)

---

### Step 4: Update Stripe Webhook (5 min)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Find your webhook endpoint
3. Update the URL to: `https://api.esimlaunch.com/api/payments/webhook`
4. Copy the new webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Railway environment variables
6. Redeploy backend service

---

### Step 5: Update Clerk Configuration (5 min)

1. Go to Clerk Dashboard → Domains
2. Add your production domains:
   - `esimlaunch.com`
   - `www.esimlaunch.com`
3. Update allowed origins in Clerk settings
4. Update `CLERK_SECRET_KEY` in Railway if needed

---

### Step 6: Test Everything (10 min)

1. **Test Frontend**: Visit https://esimlaunch.com
   - [ ] Page loads
   - [ ] No console errors
   - [ ] Can navigate pages

2. **Test Backend API**: Visit https://api.esimlaunch.com/health
   - [ ] Returns `{"status":"ok",...}`

3. **Test Critical Flows**:
   - [ ] Sign up new account
   - [ ] Create store
   - [ ] Make a test payment
   - [ ] Check order processing

---

## ✅ Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created and connected
- [ ] Redis instance created and connected
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] DNS records configured
- [ ] SSL certificates active (automatic with Vercel/Railway)
- [ ] Stripe webhook updated
- [ ] Clerk domains configured
- [ ] Health check endpoint working
- [ ] Frontend can connect to backend API
- [ ] Test signup/login works
- [ ] Test payment flow works

---

## 🐛 Common Issues

### "CORS Error"
- Check `CORS_ORIGIN` includes your frontend domain
- Make sure frontend uses `https://` not `http://`

### "Database Connection Error"
- Verify `DATABASE_URL` is correct
- Check database is running in Railway
- Run migrations: `npx prisma migrate deploy`

### "API Not Found"
- Check `VITE_API_BASE_URL` in Vercel matches your backend URL (e.g. Railway domain)
- Verify backend is deployed and running
- Check Railway logs for errors

### "Webhook Not Working"
- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Check Railway logs for webhook errors

---

## 📊 Monitoring

After deployment, set up:
- **Uptime Monitoring**: https://uptimerobot.com (free)
- **Error Tracking**: Consider Sentry (free tier available)
- **Analytics**: Google Analytics or Plausible

---

## 💰 Estimated Costs

- **Vercel**: Free (Hobby) or $20/month (Pro)
- **Railway**: ~$5-20/month (pay-as-you-go)
- **Total**: ~$5-40/month depending on traffic

---

## 🎉 You're Live!

Your site should now be accessible at:
- Frontend: https://esimlaunch.com
- API: https://api.esimlaunch.com

Congratulations! 🚀







