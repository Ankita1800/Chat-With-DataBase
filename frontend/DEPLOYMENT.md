# Frontend Deployment Guide (Vercel)

## Prerequisites
- GitHub account connected to Vercel
- Supabase project set up
- Backend deployed on Render

## Step 1: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel
```

### Option B: Using Vercel Dashboard
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `frontend` folder as the root directory
5. Vercel will auto-detect Next.js

## Step 2: Configure Environment Variables in Vercel

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://chat-with-database-7.onrender.com` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hmzknrufjikgflvjocge.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<your-anon-key>` | Production, Preview, Development |

**Important:**
- Use `NEXT_PUBLIC_` prefix for all client-side variables
- Add to ALL environments (Production, Preview, Development)
- Redeploy after adding variables

## Step 3: Update Backend CORS (Already Done ✅)

Backend has been updated to allow requests from Vercel:
```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",
    "*"
]
```

## Step 4: Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add these to **Redirect URLs**:
```
https://your-app.vercel.app/auth/google/callback
https://your-app-*.vercel.app/auth/google/callback
```

Add to **Site URL**:
```
https://your-app.vercel.app
```

## Step 5: Test the Deployment

1. Open your Vercel URL
2. Click "Sign In" or "Sign Up"
3. Login with email/Google
4. Upload a CSV file
5. Ask a question
6. Verify the backend responds

## Troubleshooting

### CORS Errors
- Check backend CORS settings in `main.py`
- Verify Vercel URL is allowed
- Check browser console for specific errors

### Authentication Issues
- Verify Supabase redirect URLs include Vercel domain
- Check environment variables are set correctly
- Ensure ANON_KEY is correct

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` points to Render backend
- Check backend is running at https://chat-with-database-7.onrender.com
- Test backend health: `curl https://chat-with-database-7.onrender.com/healthz`

## Architecture Overview

```
User Browser
    ↓
Vercel (Frontend - Next.js)
    ↓ API Calls
Render (Backend - FastAPI)
    ↓ Database
Supabase (PostgreSQL + Auth + Storage)
```

## Quick Commands

```bash
# Local development
cd frontend
npm install
npm run dev

# Build for production (test locally)
npm run build
npm start
```

## Environment Variables Reference

Copy `.env.example` to `.env.local` for local development:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values.
