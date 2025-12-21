# Production Deployment Setup Guide

## 🌐 Live URLs

**Frontend (User Interface):**
- https://chat-with-data-base-ee6u.vercel.app

**Backend (API Server):**
- https://chat-with-database-7.onrender.com
- Health Check: https://chat-with-database-7.onrender.com/healthz
- API Docs: https://chat-with-database-7.onrender.com/docs

## ✅ Current Status

- ✅ Backend deployed: https://chat-with-database-7.onrender.com
- ✅ Frontend deployed: https://chat-with-data-base-ee6u.vercel.app
- ✅ Code is production-ready
- ⚠️ External services need configuration

## 🔧 Required Configuration (Do This Now)

### Step 1: Configure Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project: `chat-with-data-base-ee6u`
3. Click **Settings** → **Environment Variables**
4. Delete all existing variables (if you added backend secrets)
5. Add these 3 variables:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://chat-with-database-7.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hmzknrufjikgflvjocge.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtemtucnVmamlrZ2ZsdmpvY2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTAwMzYsImV4cCI6MjA4MTM4NjAzNn0.rfsg5PLBCdLNOYwJOs_MiC4999xZ55jAJW_yjOIEN2M` |

**Important:** 
- Select **Production, Preview, Development** for all 3 variables
- Click **Save**
- Redeploy: Go to **Deployments** → Click the 3 dots on latest deployment → **Redeploy**

### Step 2: Configure Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard
2. Select your project: `hmzknrufjikgflvjocge`
3. Click **Authentication** (left sidebar)
4. Click **URL Configuration**
5. Update these fields:

**Site URL:**
```
https://chat-with-data-base-ee6u.vercel.app
```

**Redirect URLs:** (Add all of these, one per line)
```
https://chat-with-data-base-ee6u.vercel.app
https://chat-with-data-base-ee6u.vercel.app/
https://chat-with-data-base-ee6u.vercel.app/**
http://localhost:3000
http://localhost:3000/
```

6. Click **Save**

### Step 3: Enable Google OAuth in Supabase (Optional)

If you want Google Sign-In to work:

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and click **Edit**
3. Enable it and add:
   - **Authorized Client IDs:** Your Google OAuth Client ID
   - **Authorized redirect URIs:** 
     ```
     https://hmzknrufjikgflvjocge.supabase.co/auth/v1/callback
     ```
4. Save

## 🧪 Testing After Configuration

### Test 1: Backend Health
```bash
curl https://chat-with-database-7.onrender.com/healthz
```
Expected: `{"status":"ok"}`

### Test 2: Frontend Loads
Visit: https://chat-with-data-base-ee6u.vercel.app
- Should see the landing page
- No console errors

### Test 3: Authentication Flow
1. Go to https://chat-with-data-base-ee6u.vercel.app
2. Click **"Sign Up"**
3. Enter email and password
4. Create account
5. Should redirect back to homepage logged in

### Test 4: Upload and Query
1. After logging in
2. Upload a CSV file
3. Wait for "Upload successful"
4. Ask a question: "What are the column names?"
5. Should get AI response

## ❌ Troubleshooting

### Issue: "Invalid Redirect URL" Error
**Fix:** Make sure you added the Vercel URL to Supabase Redirect URLs (Step 2)

### Issue: "Network Error" or "Failed to fetch"
**Fix:** Check NEXT_PUBLIC_API_URL is set correctly in Vercel (Step 1)

### Issue: Login works but upload fails
**Fix:** Check browser console for errors. Verify backend is running at https://chat-with-database-7.onrender.com

### Issue: "Missing environment variables"
**Fix:** Redeploy Vercel after adding environment variables

## 📱 Quick Verification Checklist

- [ ] Vercel has 3 NEXT_PUBLIC_* variables
- [ ] Vercel redeployed after adding variables
- [ ] Supabase Site URL set to Vercel URL
- [ ] Supabase Redirect URLs include Vercel URL
- [ ] Backend responds to /healthz
- [ ] Frontend loads without errors
- [ ] Can sign up with email
- [ ] Can upload CSV file
- [ ] Can ask questions and get responses

## 🎯 Architecture Overview

```
User Browser
    ↓
Vercel (Frontend)
https://chat-with-data-base-ee6u.vercel.app
    ↓ (Fetch API calls)
Render (Backend API)
https://chat-with-database-7.onrender.com
    ↓ (Database queries + Storage)
Supabase (PostgreSQL + Auth + Storage)
https://hmzknrufjikgflvjocge.supabase.co
```

## 🚀 After Everything is Working

Consider these improvements:
1. Restrict CORS in backend to only your Vercel domain
2. Add custom domain to Vercel
3. Enable email confirmation in Supabase
4. Add rate limiting to API endpoints
5. Set up monitoring/logging

---

**Need Help?** Check browser console (F12) for errors and backend logs in Render dashboard.
