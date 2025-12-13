# Authentication Setup Guide

This application now includes a full authentication system with Google OAuth, GitHub OAuth, and email/password authentication.

## Features

- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Google OAuth**: Users can sign in with their Google account
- **GitHub OAuth**: Users can sign in with their GitHub account
- **JWT Tokens**: Secure authentication using JWT tokens with 7-day expiration
- **Password Security**: Bcrypt password hashing for secure storage
- **Duplicate Prevention**: System prevents duplicate accounts across different providers

## Quick Start

### 1. Backend Setup

The authentication backend is already configured in `auth.py` and integrated into `main.py`. Required packages are installed:

- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT token generation/validation
- `httpx` - Async HTTP client for OAuth
- `pydantic[email]` - Email validation

### 2. Environment Variables

Create or update your `.env` file with OAuth credentials:

```env
# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
```

### 3. Getting OAuth Credentials

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Application name: Your app name
4. Homepage URL: `http://localhost:3000`
5. Authorization callback URL: `http://localhost:3000/auth/github/callback`
6. Copy Client ID and Client Secret to `.env`

### 4. Frontend Setup

The frontend authentication UI is already integrated:

- **AuthModal Component**: Modal for sign in/sign up with all auth methods
- **OAuth Callback Pages**: Handle Google and GitHub OAuth redirects
- **Main Page Integration**: Sign In/Sign Up buttons open the auth modal
- **User State Management**: Displays user info and logout button when authenticated

## API Endpoints

### POST /auth/signup
Register new user with email/password
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

### POST /auth/login
Login with email/password
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### POST /auth/google/callback
Exchange Google OAuth code for JWT token
```json
{
  "code": "google-oauth-code"
}
```

### POST /auth/github/callback
Exchange GitHub OAuth code for JWT token
```json
{
  "code": "github-oauth-code"
}
```

### GET /auth/me
Get current authenticated user (requires Bearer token)

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with automatic salt generation
2. **JWT Tokens**: Secure tokens with configurable expiration (default 7 days)
3. **Bearer Authentication**: Protected endpoints require valid JWT token in Authorization header
4. **OAuth Security**: OAuth codes are exchanged server-side to keep secrets secure
5. **Email Uniqueness**: System prevents duplicate accounts with same email across providers

## Database Schema

The authentication system uses `users.db` with the following schema:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    provider TEXT DEFAULT 'email',
    provider_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
```

## User Flow

### Email/Password Sign Up
1. User clicks "Sign Up" button
2. Enters email, password, and full name
3. Backend creates user with hashed password
4. Returns JWT token and user data
5. Frontend stores token in localStorage
6. User is redirected to main page

### OAuth Sign In (Google/GitHub)
1. User clicks Google or GitHub button
2. Redirected to OAuth provider consent screen
3. User approves access
4. Provider redirects back with authorization code
5. Frontend sends code to backend callback endpoint
6. Backend exchanges code for access token
7. Backend fetches user info from provider
8. Backend creates/updates user and returns JWT token
9. Frontend stores token and redirects to main page

## Testing Authentication

### Test Email/Password Auth
1. Start backend: `python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Click "Sign Up" button
4. Fill in email, password, and name
5. Submit form
6. You should see your name in the header with a logout button

### Test OAuth (without credentials)
If you haven't set up OAuth credentials yet, you'll see error messages when clicking OAuth buttons. This is expected - the buttons will work once you add credentials to `.env`.

## Production Deployment

For production:

1. Generate a secure SECRET_KEY:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. Update OAuth redirect URIs to production URLs
3. Use environment variables (not .env files) for secrets
4. Enable HTTPS for all OAuth callbacks
5. Consider using a production database (PostgreSQL, MySQL)
6. Implement rate limiting on auth endpoints
7. Add CSRF protection
8. Implement refresh tokens for better security

## Troubleshooting

### "Invalid credentials" error
- Check that password meets minimum requirements
- Verify email format is correct
- Ensure user exists (for login) or doesn't exist (for signup)

### OAuth redirect errors
- Verify redirect URIs match exactly in OAuth app settings
- Check that CLIENT_ID and CLIENT_SECRET are correct
- Ensure OAuth app is enabled in provider console

### Token errors
- Check that SECRET_KEY is set in .env
- Verify token hasn't expired
- Ensure Authorization header format: `Bearer <token>`

## Files Modified/Created

### Backend
- `auth.py` - Complete authentication module (new)
- `main.py` - Added authentication endpoints
- `.env` - Added OAuth configuration

### Frontend
- `app/AuthModal.tsx` - Authentication modal component (new)
- `app/auth/google/callback/page.tsx` - Google OAuth callback (new)
- `app/auth/github/callback/page.tsx` - GitHub OAuth callback (new)
- `app/page.tsx` - Integrated authentication UI

## Next Steps

1. Set up Google OAuth credentials
2. Set up GitHub OAuth credentials
3. Test all authentication flows
4. Customize user profile page
5. Add protected routes requiring authentication
6. Implement role-based access control if needed
