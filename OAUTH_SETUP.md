# SETUP GUIDE FOR OAUTH AUTHENTICATION

## Google OAuth Setup

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing one
3. Click "CREATE CREDENTIALS" > "OAuth client ID"
4. Application type: "Web application"
5. Add Authorized redirect URIs:
   - http://localhost:3000/auth/google/callback
   - http://127.0.0.1:3000/auth/google/callback
6. Copy the Client ID and Client Secret
7. Add them to your `.env` file

## GitHub OAuth Setup

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: ChatWithDB
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/auth/github/callback
4. Click "Register application"
5. Copy the Client ID
6. Click "Generate a new client secret" and copy it
7. Add them to your `.env` file

## Environment Variables

Create `.env` file in the root directory:

```
# Backend OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
GROQ_API_KEY=your-groq-api-key-here
SECRET_KEY=your-secret-key-here
```

Create `frontend/.env.local` file:

```
# Frontend OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id-here
```

## Important Notes

- The Client IDs in both .env files should be the SAME
- Restart both backend and frontend servers after updating .env files
- Backend: `python main.py`
- Frontend: `npm run dev`
