# Throughline

Throughline is a memory layer for what you’re building and thinking.

Instead of trying to write perfect posts every day, you log small, messy check-ins about your work, ideas, learnings, or struggles. Throughline remembers those fragments over time, finds patterns across days and weeks, and turns them into coherent stories in your own voice.

It’s not a journaling app.
It’s not just another AI writer.
It’s a system that treats your daily progress as data and helps it compound into narrative.

You don’t write stories here.
You live them. Throughline connects the dots.

---

## What it does

* Capture lightweight daily check-ins (raw, messy, unpolished)
* Remember your activity over time
* Synthesize weekly and monthly narratives
* Generate “base posts” from your real progress
* Adapt those posts for platforms like LinkedIn, X, and Reddit
* Learn your voice from samples and tone preferences
* Let you regenerate, refine, like/dislike, and evolve output
* Visualize momentum (streaks, calendar, activity)

The loop is simple:

> Log what matters → We remember → We connect → You share

---

## Why it’s different

Most tools generate content from a prompt.

Throughline generates content from **you over time**.

* You don’t start from a blank page
* You don’t need perfect thoughts
* You don’t have to remember everything

You just show up honestly.
Throughline handles continuity, context, and synthesis.

---

## Project Structure

This repository contains two main components:

1. **Backend** (`/backend`) - Express.js API with AI orchestration
2. **Frontend** (`/frontend`) - React + TypeScript web application

---

## Tech Stack

### Backend
- **Runtime**: Node.js (ESM modules)
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **AI/LLM**: Mastra framework with support for multiple providers (OpenRouter, Google Gemini, OpenAI, Anthropic, Groq)
- **Authentication**: JWT + Google OAuth
- **Email**: Resend API
- **Error Tracking**: Sentry
- **Scheduling**: node-cron (with optional external cron support)

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **State Management**: React Query (@tanstack/react-query)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm installed
- **MySQL** database (local or cloud-based like PlanetScale, Railway, etc.)
- **Google OAuth credentials** (for Google login)
- **LLM API Key** (at least one of: Groq, OpenRouter, Google Gemini, OpenAI, or Anthropic)
- **Resend API Key** (for email verification and password reset)
- **Sentry DSN** (optional but recommended for error tracking)

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend root directory by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
TZ=Asia/Kolkata

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173

# Application Mode
MODE=self-hosted  # or "saas" for managed service

# Application URLs
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database Configuration (MySQL)
DATABASE_URL=mysql://username:password@host:port/database

# JWT Secrets (MUST be at least 32 characters each)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_12345678
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars_12345678
JWT_VERIFICATION_SECRET=your_super_secret_verification_key_min_32_chars_12345678
JWT_PASSWORD_RESET_SECRET=your_super_secret_password_reset_key_min_32_chars_12345678

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# LLM Configuration (Choose at least one)
# Option 1: Groq (Free, Fast - Recommended for testing)
GROQ_API_KEY=gsk_...
# GROQ_MODEL=llama-3.3-70b-versatile  # Optional, this is the default

# Option 2: OpenRouter (Access to many models)
# OPENROUTER_API_KEY=sk-or-v1-...
# OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Option 3: Google Gemini
# GOOGLE_GENERATIVE_AI_API_KEY=AIza...
# GOOGLE_MODEL=gemini-2.0-flash

# Option 4: OpenAI
# OPENAI_API_KEY=sk-proj-...
# OPENAI_MODEL=gpt-4o-mini

# Option 5: Anthropic
# ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-sonnet-4

# Email Configuration (Resend)
RESEND_API_KEY=re_...

# Sentry Configuration (Optional)
SENTRY_DSN=https://...@sentry.io/...

# Scheduler Configuration (Optional)
# DISABLE_INTERNAL_CRON=false  # Set to true to use external cron
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run build

# Push database schema (creates tables)
npx prisma db push

# Optional: Open Prisma Studio to view your database
npx prisma studio
```

### 5. Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will start on `http://localhost:3000`

You should see output like:
```
============================================================
Starting Throughline Backend...
============================================================

Environment Configuration:
  • Mode: self-hosted
  • Node Environment: development
  • Port: 3000
  • Database: configured
  • Frontend URL: http://localhost:5173
  • Timezone: Asia/Kolkata
  • LLM Providers: Groq

Server running on port 3000
API URL: http://localhost:3000
Frontend URL: http://localhost:5173
============================================================
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the frontend root directory:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Important**: The `VITE_GOOGLE_CLIENT_ID` must match the one configured in your backend.

### 4. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## Getting Started - First Use

### 1. Create an Account

1. Open `http://localhost:5173` in your browser
2. Click "Sign Up" and create an account
3. Check your email for verification link (if RESEND is configured)
4. Verify your email and log in

### 2. Complete Onboarding

After logging in for the first time, you'll go through onboarding:
1. Add sample posts (examples of your writing style)
2. The system will extract your tone profile from these samples
3. Configure your post generation schedule (daily, weekly, monthly)

### 3. Start Using Throughline

- **Daily Check-ins**: Log your progress, thoughts, and activities
- **Generated Posts**: View AI-generated narratives based on your check-ins
- **Tone Profile**: Customize how the AI writes in your voice
- **Settings**: Configure notifications and generation schedules

---

## Google OAuth Setup

To enable Google login, you need to set up OAuth credentials:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2. Create OAuth Credentials

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - Your production frontend URL
5. Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for local)
   - Your production backend URL + `/auth/google/callback`

### 3. Get Client ID and Secret

Copy the Client ID and Client Secret to your `.env` files:
- Backend: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Frontend: `VITE_GOOGLE_CLIENT_ID`

---

## LLM Provider Setup

Throughline supports multiple LLM providers. Configure at least one:

### Groq (Recommended - Free & Fast)

1. Sign up at [https://groq.com](https://groq.com)
2. Get API key from [https://console.groq.com/keys](https://console.groq.com/keys)
3. Add to backend `.env`: `GROQ_API_KEY=gsk_...`

### OpenRouter (Access to Many Models)

1. Sign up at [https://openrouter.ai](https://openrouter.ai)
2. Get API key from [https://openrouter.ai/keys](https://openrouter.ai/keys)
3. Add to backend `.env`: `OPENROUTER_API_KEY=sk-or-v1-...`

### Google Gemini

1. Get API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Add to backend `.env`: `GOOGLE_GENERATIVE_AI_API_KEY=AIza...`

### OpenAI

1. Get API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to backend `.env`: `OPENAI_API_KEY=sk-proj-...`

### Anthropic

1. Get API key from [https://console.anthropic.com/](https://console.anthropic.com/)
2. Add to backend `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

---

## Database Configuration

### MySQL Connection String Format

```
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Examples:

**Local MySQL:**
```
DATABASE_URL=mysql://root:password@localhost:3306/throughline
```

**PlanetScale:**
```
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/throughline?sslaccept=strict
```

**Railway:**
```
DATABASE_URL=mysql://root:password@containers-us-west-123.railway.app:1234/railway
```

### Creating the Database

Make sure your MySQL database exists before running Prisma commands. You can create it using:

```sql
CREATE DATABASE throughline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Build for Production

### Backend

```bash
cd backend
npm install
npm run build
npx prisma db push
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

The build output will be in `frontend/dist/` directory. Deploy this to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.)

---

## Environment Modes

### Self-Hosted Mode (`MODE=self-hosted`)

Users configure their own LLM API keys. The system detects which provider is available and uses it.

**Provider Priority Order:**
1. Groq (checked first)
2. OpenRouter
3. Google Gemini
4. OpenAI
5. Anthropic

### SaaS Mode (`MODE=saas`)

Admin configures a single LLM provider for all users.

Required additional variables:
```env
MODE=saas
SAAS_LLM_PROVIDER=openrouter  # or google, openai, anthropic, groq
SAAS_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

---

## Cron Job Configuration

Throughline uses scheduled jobs for automatic post generation.

### Internal Cron (Default)

Jobs run inside the Node.js process using node-cron:
- Daily posts: 9:00 PM (user's timezone)
- Weekly posts: Sunday 8:00 PM
- Monthly posts: 28th of month at 8:00 PM

### External Cron (Recommended for Production)

For better reliability and resource usage:

1. Set in backend `.env`:
```env
DISABLE_INTERNAL_CRON=true
```

2. Set up external cron jobs to call:
```bash
# Daily job (run at 9:00 PM)
curl -X POST http://your-api-url/api/cron/daily

# Weekly job (run Sunday 8:00 PM)  
curl -X POST http://your-api-url/api/cron/weekly

# Monthly job (run on 28th at 8:00 PM)
curl -X POST http://your-api-url/api/cron/monthly
```

---

## API Routes

The backend exposes these main routes:

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Email/password login
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### User Profile
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `PATCH /profile/photo` - Update profile photo

### Check-ins
- `POST /checkin` - Create check-in
- `GET /checkin` - List check-ins
- `GET /checkin/:id` - Get specific check-in
- `DELETE /checkin/:id` - Delete check-in

### Sample Posts
- `POST /sample` - Add sample post
- `GET /sample` - List sample posts
- `DELETE /sample/:id` - Delete sample post

### Tone Profile
- `POST /tone/extract` - Extract tone from samples
- `GET /tone` - Get tone profile
- `PATCH /tone` - Update tone profile

### Generated Posts
- `GET /generation/posts` - List generated posts
- `GET /generation/posts/:id` - Get specific post
- `POST /generation/regenerate/:id` - Regenerate post
- `GET /generation/limits` - Check regeneration limits

### Notifications
- `GET /notifications` - Get notification settings
- `PATCH /notifications` - Update settings

### Schedule
- `GET /schedule` - Get generation schedule
- `PATCH /schedule` - Update schedule

### Feedback
- `POST /feedback` - Submit feedback on posts

### Health
- `GET /health` - Health check endpoint

---

## Database Schema Overview

### Key Models

**User**: Stores user accounts and authentication data
- Email/password or Google OAuth
- Profile information (name, bio, photo)
- Email verification status
- Onboarding completion status

**CheckIn**: Daily user check-ins/logs
- User-submitted content
- Timestamped entries

**SamplePost**: Example posts in user's writing style
- Used for tone extraction
- User-provided examples

**ToneProfile**: AI-extracted writing style
- Voice, sentence style, emotional range
- Manual customization options
- Writing goals and preferences

**GeneratedPost**: AI-generated narratives
- Daily, weekly, or monthly posts
- Base content and metadata
- Version tracking
- Token usage tracking

**GenerationSchedule**: User's post generation preferences
- Daily/weekly/monthly timing
- Timezone configuration

**GenerationJob**: Background job tracking
- Job status (pending, processing, completed, failed)
- Error logging

---

## Troubleshooting

### Backend won't start

**Error: Environment validation failed**
- Check all required environment variables are set
- Ensure JWT secrets are at least 32 characters
- Verify database connection string is correct

**Error: Cannot connect to database**
- Verify MySQL is running
- Check DATABASE_URL format
- Ensure database exists
- Test connection: `npx prisma db push`

**Error: No LLM provider configured**
- Add at least one LLM API key to `.env`
- Verify the API key is valid

### Frontend won't start

**Error: Cannot connect to backend**
- Ensure backend is running on the correct port
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS is configured correctly in backend

**Build errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (18+ required)

### Google OAuth not working

- Verify Google Client ID matches in both frontend and backend
- Check authorized redirect URIs in Google Console
- Ensure callback URL format: `{API_URL}/auth/google/callback`
- Clear browser cookies and try again

### Email not sending

- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for errors
- Ensure email domain is verified (for production)

### Posts not generating

- Check LLM API key is valid and has credits
- Review logs for specific error messages
- Verify user has check-ins in the relevant time period
- Check token usage limits haven't been exceeded

---

## Development Tips

### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Create a migration
npx prisma migrate dev --name description

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### Debugging

Enable debug logging:
```env
DEBUG=*  # Backend (in .env)
```

View Sentry errors:
- Check Sentry dashboard if configured
- Look for error logs in console

### Rate Limiting

Rate limits are applied to:
- Auth endpoints: 5 requests per 15 minutes
- LLM endpoints: 10 requests per hour
- Global: 100 requests per 15 minutes

To disable during development:
```env
SKIP_RATE_LIMIT=true
```

---

## Security Considerations

### Production Checklist

- [ ] Use strong, unique JWT secrets (32+ characters)
- [ ] Enable HTTPS for both frontend and backend
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Set `NODE_ENV=production`
- [ ] Enable Sentry error tracking
- [ ] Use environment variables, never commit secrets
- [ ] Configure rate limiting appropriately
- [ ] Set up database backups
- [ ] Use secure database connection (SSL/TLS)
- [ ] Keep dependencies updated (`npm audit`)

### Password Requirements

Users' passwords must be:
- At least 8 characters long
- Passwords are hashed with bcrypt before storage

---

## Architecture Notes

### AI Orchestration Flow

1. **Tone Extraction**: User provides sample posts → AI extracts writing style
2. **Check-in Collection**: User logs daily activities
3. **Scheduled Generation**: Cron jobs trigger at configured times
4. **AI Generation**: Mastra agents generate posts using:
   - User's tone profile
   - Recent check-ins
   - Configured platform specs
5. **Version Management**: Posts can be regenerated (with limits)
6. **Token Tracking**: All LLM usage is tracked for cost monitoring

### Memory Architecture

- **Short-term**: Check-ins from recent period
- **Long-term**: All historical check-ins in MySQL
- **Synthesis**: AI generates narratives connecting fragments over time
- **Tone Persistence**: User's writing style maintained across generations

---

## Support

For issues or questions:
1. Check this README first
2. Review error logs in console/Sentry
3. Verify all environment variables are correct
4. Check database connectivity with `npx prisma studio`

---

Make sure to:
1. Set all environment variables in platform settings
2. Configure build commands:
   - Backend: `npm run build && npx prisma db push`
   - Frontend: `npm run build`
3. Set start commands:
   - Backend: `npm start`
   - Frontend: Static site (no start command needed)