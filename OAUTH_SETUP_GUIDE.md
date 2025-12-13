# 🔐 Quick OAuth Setup Guide

## Why Are You Seeing Errors?

You're seeing **"Error 401: invalid_client"** (Google) and **"404 Page not found"** (GitHub) because:
1. OAuth Client IDs are not configured (currently empty)
2. Environment variables need to be set up

## ✅ Step-by-Step Fix

### 1️⃣ Get Google OAuth Credentials

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Sign in** with your Google account
3. **Create a Project** (or select existing):
   - Click "Select a project" → "NEW PROJECT"
   - Name it "ChatWithDB"
   - Click "CREATE"
4. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "ENABLE"
5. **Create OAuth Credentials**:
   - Go back to "Credentials"
   - Click "CREATE CREDENTIALS" → "OAuth client ID"
   - If asked, configure consent screen first:
     - User Type: "External"
     - App name: "ChatWithDB"
     - User support email: your email
     - Developer email: your email
     - Save and continue through all steps
   - Application type: **"Web application"**
   - Name: "ChatWithDB Web Client"
   - **Authorized redirect URIs** - Add BOTH:
     ```
     http://localhost:3000/auth/google/callback
     http://127.0.0.1:3000/auth/google/callback
     ```
   - Click "CREATE"
6. **Copy** the Client ID and Client Secret that appear

### 2️⃣ Get GitHub OAuth Credentials

1. **Go to**: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name**: `ChatWithDB`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Click **"Register application"**
5. **Copy the Client ID**
6. Click **"Generate a new client secret"**
7. **Copy the Client Secret** (you won't see it again!)

### 3️⃣ Update Environment Variables

#### Backend (.env file in root directory)

Open `e:\Chat With DataBase\.env` and update:

```env
GROQ_API_KEY=your-groq-api-key-here

SECRET_KEY=dev-secret-key-change-this-in-production-use-secrets-token-urlsafe-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 👇 PASTE YOUR GOOGLE CREDENTIALS HERE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# 👇 PASTE YOUR GITHUB CREDENTIALS HERE
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID_HERE
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET_HERE
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
```

#### Frontend (.env.local file in frontend directory)

Open `e:\Chat With DataBase\frontend\.env.local` and update:

```env
# 👇 PASTE THE SAME CLIENT IDs (NOT SECRETS!)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
NEXT_PUBLIC_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID_HERE
```

⚠️ **IMPORTANT**: The Client IDs must be EXACTLY THE SAME in both files!

### 4️⃣ Restart Servers

**Backend:**
```bash
# Stop the current backend (Ctrl+C)
# Then restart:
python main.py
```

**Frontend:**
```bash
# Stop the current frontend (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

### 5️⃣ Test OAuth

1. Go to http://localhost:3000
2. Click "Sign In"
3. Click the Google or GitHub button
4. You should now be redirected properly! ✅

---

## 🔍 Troubleshooting

### Still seeing "invalid_client"?
- Make sure you copied the ENTIRE Client ID (no spaces)
- Check that redirect URIs in Google Console match exactly: `http://localhost:3000/auth/google/callback`
- Restart both servers after updating .env files

### GitHub 404 Error?
- Verify the callback URL in GitHub settings: `http://localhost:3000/auth/github/callback`
- Make sure Client ID is set in `frontend/.env.local`

### "undefined" in URL?
- This means `NEXT_PUBLIC_GOOGLE_CLIENT_ID` or `NEXT_PUBLIC_GITHUB_CLIENT_ID` is not set
- Check `frontend/.env.local` exists and has the correct values
- Restart the frontend server

---

## 📝 Example (with fake credentials)

**Backend `.env`:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-Ab12Cd34Ef56Gh78
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

---

## 🎉 Done!

After following these steps, Google and GitHub sign-in should work perfectly!
