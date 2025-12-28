# 🤖 Chat with Database - Supabase Edition

A production-ready, multi-user AI application that allows users to query SQL databases using natural language. Built with **Next.js**, **FastAPI**, **Supabase**, and **Llama 3** (via Groq).

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Architecture](https://img.shields.io/badge/Architecture-Multi--User-blue)
![Security](https://img.shields.io/badge/Security-Production%20Grade-green)

---

## 🎉 Version 2.0 - Supabase Migration Complete!

This application has been completely migrated to **Supabase** for production-ready, multi-user support with enterprise-grade security.

### 🔄 What's New
- ✅ **Multi-User Support**: Complete data isolation per user
- ✅ **Supabase Authentication**: Email/password + OAuth (Google, GitHub)
- ✅ **PostgreSQL + RLS**: Row Level Security for database-level isolation
- ✅ **Cloud Storage**: User-scoped file storage with access policies
- ✅ **Production Ready**: Horizontally scalable, stateless architecture
- ✅ **Zero Breaking Changes**: Frontend UI/UX preserved exactly

---

## 📚 Documentation

**Start Here**:
- 📖 **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Quick overview of changes
- 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture
- 🚀 **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Step-by-step setup instructions
- 🗄️ **[supabase_schema.sql](./supabase_schema.sql)** - Database schema with RLS

---

## 🚀 Features

### Core Features
- 🤖 **Natural Language to SQL**: Convert English questions to SQL queries
- 📊 **Multi-Dataset Support**: Upload and query multiple CSV files
- 📈 **Query History**: Track all questions and confidence scores
- 🔍 **Smart AI**: Confidence scoring and error handling
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations

### Security & Scale
- 🔐 **Secure Auth**: Supabase Auth with JWT verification
- 👥 **Multi-User**: Complete data isolation with Row Level Security
- 🌐 **Scalable**: Stateless backend, managed PostgreSQL
- ☁️ **Cloud Native**: Supabase Storage for file uploads
- 🔒 **Production Grade**: Industry best practices followed

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Auth**: Supabase Auth Client

### Backend
- **Framework**: FastAPI (Python)
- **Auth**: Supabase JWT Verification
- **AI/ML**: LangChain, Groq API (Llama 3.3 70B)
- **ORM**: SQLAlchemy

### Infrastructure
- **Database**: Supabase PostgreSQL with Row Level Security
- **Storage**: Supabase Storage (S3-based)
- **Auth**: Supabase Auth (OAuth + Email/Password)

---

## 💻 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- [Supabase Account](https://supabase.com) (free)
- [Groq API Key](https://console.groq.com) (free)

### 1. Clone Repository
```bash
git clone <repository-url>
cd "Chat With DataBase"
```

### 2. Setup Supabase
1. Create project at [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run [supabase_schema.sql](./supabase_schema.sql)
3. Get API keys from **Project Settings → API**

### 3. Configure Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Configure Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local
# Edit with your Supabase URL and anon key
```

### 5. Run Application

**Backend** (Terminal 1):
```bash
python main.py
# Server: http://127.0.0.1:8000
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# App: http://localhost:3000
```

### 6. Test
1. Open http://localhost:3000
2. Sign up with email/password
3. Upload a CSV file
4. Ask questions about your data!

**See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions.**

---

## 📸 How It Works

```
1. User Signs In
   └─→ Supabase handles authentication
       └─→ Returns secure JWT token

2. User Uploads CSV
   └─→ File saved to Supabase Storage (user-scoped)
       └─→ Data inserted into PostgreSQL with user_id
           └─→ Metadata stored in user_datasets table

3. User Asks Question
   └─→ LangChain + Groq generates SQL query
       └─→ Query filtered by user_id (RLS enforced)
           └─→ Results returned + logged to history
```

---

## 🔐 Security Features

- ✅ **Supabase Auth**: Industry-standard JWT with secure session management
- ✅ **Row Level Security**: Database-level user data isolation
- ✅ **Storage Policies**: Per-user file access control
- ✅ **No Custom Auth**: Zero custom JWT/OAuth code
- ✅ **CORS Protection**: Specific origins only (no wildcards)
- ✅ **Input Validation**: CSV validation, SQL injection prevention
- ✅ **Secure Secrets**: Environment variables, no hardcoded keys

---

## 📊 Architecture

```
┌──────────────┐
│   Next.js    │  ← Supabase Auth SDK
│   Frontend   │  ← Session Management
└──────┬───────┘
       │ Bearer Token (JWT)
       ↓
┌──────────────┐
│   FastAPI    │  ← JWT Verification
│   Backend    │  ← User Isolation
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────┐
│      Supabase Platform           │
│  ┌──────────┐  ┌──────────────┐ │
│  │PostgreSQL│  │   Storage    │ │
│  │  + RLS   │  │  + Policies  │ │
│  └──────────┘  └──────────────┘ │
└──────────────────────────────────┘
```

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete details.**

---

## 🧪 Local Testing

**All testing is done locally** - no cloud deployment needed to get started!

### Quick Start
1. **Backend**: Run `python main.py` (starts on http://127.0.0.1:8000)
2. **Frontend**: Run `npm run dev` in `frontend/` folder (starts on http://localhost:3000)
3. **Database**: Uses your Supabase cloud database (free tier)

**See [frontend/LOCAL_TESTING.md](./frontend/LOCAL_TESTING.md) for complete step-by-step instructions.**

### What You Can Test Locally
- ✅ User authentication (email/password, OAuth)
- ✅ CSV file uploads and data ingestion
- ✅ Natural language to SQL queries
- ✅ Multi-user data isolation
- ✅ Query history and confidence scoring
- ✅ All API endpoints and features

---

## 📖 API Documentation

### Authentication
All endpoints require `Authorization: Bearer {token}` header.

### Endpoints
- `POST /upload` - Upload CSV file
- `POST /ask` - Query dataset with natural language
- `GET /datasets` - List user's datasets
- `GET /health` - Health check

**Interactive API docs**: http://127.0.0.1:8000/docs

---

## 🧪 Local Testing

**All testing is done locally** - no cloud deployment needed to get started!

### Quick Start
1. **Backend**: Run `python main.py` (starts on http://127.0.0.1:8000)
2. **Frontend**: Run `npm run dev` in `frontend/` folder (starts on http://localhost:3000)
3. **Database**: Uses your Supabase cloud database (free tier)

**See [frontend/LOCAL_TESTING.md](./frontend/LOCAL_TESTING.md) for complete step-by-step instructions.**

### What You Can Test Locally
- ✅ User authentication (email/password, OAuth)
- ✅ CSV file uploads and data ingestion
- ✅ Natural language to SQL queries
- ✅ Multi-user data isolation
- ✅ Query history and confidence scoring
- ✅ All API endpoints and features

---

## 📖 API Documentation

### Authentication
All endpoints require `Authorization: Bearer {token}` header.

### Endpoints
- `POST /upload` - Upload CSV file
- `POST /ask` - Query dataset with natural language
- `GET /datasets` - List user's datasets
- `GET /health` - Health check

**Interactive API docs**: http://127.0.0.1:8000/docs

---

## 🧪 Testing Checklist

### Multi-User Isolation Test
1. Create User A, upload `sales.csv`
2. Create User B, upload `customers.csv`
3. Verify User A cannot see User B's data
4. Verify queries only return own data

### Security Test
1. Verify JWT verification works
2. Test RLS with SQL Editor in Supabase
3. Try accessing another user's Storage file
4. Verify CORS restrictions (only localhost allowed)

---

## 🐛 Troubleshooting

**Common Issues**:

| Issue | Solution |
|-------|----------|
| "Invalid JWT" | Check `SUPABASE_JWT_SECRET` in `.env` |
| "RLS violated" | Verify RLS policies in SQL Editor |
| Storage upload fails | Check storage policies and bucket |
| Database connection error | Verify `SUPABASE_DB_PASSWORD` |
| CORS errors | Only localhost:3000 is allowed, verify frontend URL |

**See [frontend/LOCAL_TESTING.md](./frontend/LOCAL_TESTING.md#troubleshooting) for complete troubleshooting guide.**

---