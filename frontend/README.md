This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local Development & Testing

**For complete setup and testing instructions, see [LOCAL_TESTING.md](./LOCAL_TESTING.md).**

This Next.js application connects to a FastAPI backend and Supabase for authentication and data storage.

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Make sure backend is running on http://127.0.0.1:8000

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL (http://127.0.0.1:8000 for local)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_SITE_URL` - Your site URL (http://localhost:3000 for local)


## Learn More

- **[LOCAL_TESTING.md](./LOCAL_TESTING.md)** - Complete local testing guide
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features
- [Supabase Docs](https://supabase.com/docs) - Authentication and database docs

## Project Structure

```
frontend/
├── app/              # Next.js App Router
│   ├── page.tsx      # Main chat interface
│   ├── layout.tsx    # Root layout with providers
│   └── auth/         # OAuth callback handlers
├── lib/              # Utilities
│   ├── supabase.ts   # Supabase client
│   ├── config.ts     # App configuration
│   └── persistence.ts # Local storage helpers
└── .env.local        # Environment variables (create this)
```

---

This project is built with Next.js and integrates with Supabase for authentication and PostgreSQL database.
