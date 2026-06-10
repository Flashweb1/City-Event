# City Event — Production Deployment Guide

## Overview
- **Frontend**: Netlify or Vercel (static hosting)
- **Backend**: Render (Node.js app server)
- **Repo**: GitHub (Flashweb1/City-Event)

---

## 1. Backend Deployment (Render)

### Setup Render Web Service
1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click **New +** → **Web Service**
4. Select repo: `Flashweb1/City-Event`
5. Fill in:
   - **Name**: `City Event Backend`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)` (or your preference)
   - **Branch**: `main`
   - **Root Directory**: `city-event/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or `Starter` for production)

### Add Environment Variables (in Render UI)
Copy and paste these into the **Environment** section:

```
DATABASE_URL=postgres://user:password@host:5432/city_event
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
FIREBASE_PROJECT_ID=city-event-6c6ec
JWT_SECRET=your-very-strong-random-secret-key-here
CSRF_SECRET=your-csrf-secret-key-here
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
PAYSTACK_SECRET_KEY=your-paystack-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important**: Replace placeholder values with your actual production keys:
- Stripe keys from stripe.com dashboard
- SendGrid API key from sendgrid.com
- Firebase project from Firebase Console
- Strong random secrets for JWT_SECRET and CSRF_SECRET
- SMTP credentials if using email
- `FRONTEND_URL` and `ALLOWED_ORIGINS` once you know your frontend domain

### Create Database
You'll need a PostgreSQL database for production:
- **Option A**: Use Render's managed PostgreSQL (easiest)
  - In Render, create a new PostgreSQL database
  - Copy the connection string to `DATABASE_URL`
- **Option B**: Use external DB (AWS RDS, Railway, etc.)
  - Get the connection string and paste it as `DATABASE_URL`

---

## 2. Frontend Deployment (Netlify)

### Option A: Deploy on Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Select GitHub → authorize → choose `Flashweb1/City-Event`
4. Fill in:
   - **Base directory**: `city-event/frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**

Netlify will use the root `netlify.toml` config automatically.

### Update Environment Variables (in Netlify UI)
Go to **Site settings** → **Build & deploy** → **Environment** and add:
```
VITE_API_URL=https://your-backend-url.onrender.com
```
Replace with your actual Render backend URL (e.g., `https://city-event-backend.onrender.com`)

---

## 2. Frontend Deployment (Vercel)

### Option B: Deploy on Vercel (Alternative)

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import GitHub repo → select `Flashweb1/City-Event`
4. Fill in:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `city-event/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**

Vercel will use the root `vercel.json` config automatically.

### Update Environment Variables (in Vercel UI)
Go to **Settings** → **Environment Variables** and add:
```
VITE_API_URL=https://your-backend-url.onrender.com
```
Replace with your actual Render backend URL.

---

## 3. Update CORS (Backend)

Once your frontend is deployed and has a live domain:

1. Go to Render dashboard
2. Select your **City Event Backend** service
3. Click **Environment** tab
4. Update `ALLOWED_ORIGINS`:
   ```
   https://your-frontend-domain.netlify.app,https://www.your-frontend-domain.com
   ```
5. Save and redeploy

---

## 4. Verify Deployment

### Backend Health Check
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Frontend
Visit your Netlify/Vercel deployed URL and test:
- Event listings load
- Login works
- API calls succeed (check browser console for errors)

---

## 5. Production Checklist

- [ ] Backend running on Render
- [ ] Frontend deployed on Netlify/Vercel
- [ ] Environment variables set correctly
- [ ] Database connected (not SQLite)
- [ ] CORS configured with frontend domain
- [ ] API calls work from frontend to backend
- [ ] Stripe webhooks configured (if using payments)
- [ ] Email service configured (SendGrid or SMTP)
- [ ] SSL/TLS working (automatic on Netlify/Vercel/Render)

---

## Troubleshooting

### Backend won't start
- Check env vars in Render UI
- Look at deploy logs for errors
- Ensure `DATABASE_URL` is valid PostgreSQL connection string

### Frontend can't reach backend
- Check `VITE_API_URL` in frontend env vars
- Check `ALLOWED_ORIGINS` in backend env vars
- Check browser console for CORS errors

### Payments not working
- Verify Stripe keys in backend env vars
- Check Stripe webhooks point to: `https://your-backend-url.onrender.com/api/webhooks/stripe`

### Emails not sending
- Verify SENDGRID_API_KEY or SMTP credentials
- Check email logs in SendGrid/Gmail

---

## Next Steps

1. Create a PostgreSQL database (or use Render managed DB)
2. Gather all production secrets:
   - Stripe keys
   - SendGrid / SMTP credentials
   - Firebase project ID
   - JWT secrets
3. Deploy backend to Render
4. Deploy frontend to Netlify or Vercel
5. Test both services together
