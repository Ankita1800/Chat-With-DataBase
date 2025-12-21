# Vercel Deployment Guide - Connect Frontend to Backend

## 🎯 Objective
Link the Next.js frontend deployed on Vercel to the FastAPI backend deployed on Render.

## 🔗 Deployment URLs

**Frontend (Vercel):** https://chat-with-data-base-ee6u.vercel.app  
**Backend (Render):** https://chat-with-database-7.onrender.com

## ⚙️ Step-by-Step Configuration

### 1️⃣ Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

#### Navigate to Settings:
1. Visit: https://vercel.com/dashboard
2. Select project: **chat-with-data-base-ee6u**
3. Click **Settings** → **Environment Variables**

#### Add These 3 Variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://chat-with-database-7.onrender.com` | Backend API endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hmzknrufjikgflvjocge.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtemtucnVmamlrZ2ZsdmpvY2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTAwMzYsImV4cCI6MjA4MTM4NjAzNn0.rfsg5PLBCdLNOYwJOs_MiC4999xZ55jAJW_yjOIEN2M` | Supabase anonymous key |

#### Important Settings:
- ✅ Select: **Production**, **Preview**, and **Development** for each variable
- ✅ Click **Save** after adding each variable

### 2️⃣ Redeploy the Frontend

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **3 dots menu** (⋯)
4. Select **Redeploy**
5. ✅ Confirm "Redeploy"

This ensures the new environment variables are loaded.

### 3️⃣ Verify Backend is Accessible

Test backend health endpoint:

```bash
curl https://chat-with-database-7.onrender.com/healthz
```

Expected response:
```json
{"status":"ok"}
```

### 4️⃣ Configure CORS (Already Done ✅)

The backend is already configured to allow requests from Vercel. This is set in `main.py`:

```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",
    "*"
]
```

### 5️⃣ Configure Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/hmzknrufjikgflvjocge
2. Click **Authentication** → **URL Configuration**
3. Set **Site URL:**
   ```
   https://chat-with-data-base-ee6u.vercel.app
   ```
4. Add **Redirect URLs:**
   ```
   https://chat-with-data-base-ee6u.vercel.app
   https://chat-with-data-base-ee6u.vercel.app/
   https://chat-with-data-base-ee6u.vercel.app/**
   ```
5. Click **Save**

## 🧪 Test the Integration

### Test 1: Frontend Loads
Visit: https://chat-with-data-base-ee6u.vercel.app
- ✅ Page should load without errors
- ✅ Open browser console (F12) - no errors

### Test 2: Check Environment Variables
In browser console, run:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```
Should NOT be `undefined`

### Test 3: Authentication Flow
1. Click **"Sign Up"**
2. Enter email and password
3. Create account
4. Should redirect to homepage

### Test 4: API Communication
1. After login, upload a CSV file
2. File should upload successfully
3. Backend should process it
4. Ask a question about the data
5. Should receive AI response

## 📊 Architecture Flow

```
User Browser
    ↓
Frontend (Vercel)
https://chat-with-data-base-ee6u.vercel.app
    ↓ [NEXT_PUBLIC_API_URL]
Backend API (Render)
https://chat-with-database-7.onrender.com
    ↓ [DATABASE_URL]
Supabase PostgreSQL + Storage
https://hmzknrufjikgflvjocge.supabase.co
```

## 🔍 Troubleshooting

### Issue: "Failed to fetch" error
**Cause:** Frontend cannot reach backend  
**Fix:** 
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Check backend is running: https://chat-with-database-7.onrender.com/healthz
- Redeploy Vercel after adding variables

### Issue: CORS error
**Cause:** Backend blocking frontend requests  
**Fix:** Backend already allows all origins (`"*"`). No action needed.

### Issue: Authentication fails
**Cause:** Supabase redirect URL mismatch  
**Fix:** Add Vercel URL to Supabase redirect URLs (Step 5)

### Issue: Environment variables not loading
**Cause:** Variables added but not redeployed  
**Fix:** Go to Vercel → Deployments → Redeploy

## ✅ Verification Checklist

Before testing, ensure:
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] All 3 variables applied to: Production, Preview, Development
- [ ] Vercel redeployed after adding variables
- [ ] Backend responds to /healthz
- [ ] Supabase redirect URLs include Vercel domain

## 📝 Environment Variable Template

For local development, create `frontend/.env.local`:

```bash
# Copy from .env.example
NEXT_PUBLIC_API_URL=https://chat-with-database-7.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://hmzknrufjikgflvjocge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtemtucnVmamlrZ2ZsdmpvY2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTAwMzYsImV4cCI6MjA4MTM4NjAzNn0.rfsg5PLBCdLNOYwJOs_MiC4999xZ55jAJW_yjOIEN2M
```

## 🚀 Quick Deploy Command

If deploying from CLI:

```bash
cd frontend
vercel --prod
```

Environment variables must still be set in Vercel dashboard.

---

**Questions?** Check the browser console for errors or backend logs in Render dashboard.
