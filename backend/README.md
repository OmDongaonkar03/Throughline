# Throughline – Backend

The backend for Throughline - a system that treats daily progress as data and turns it into narrative over time.

Throughline is not just a CRUD app or an AI wrapper.
It is a memory + synthesis engine.

The backend is responsible for:

- Authentication (email + Google OAuth)
- User accounts and profiles
- Daily check-ins and activity tracking
- Long-term memory (Prisma + MySQL)
- AI orchestration for:
  - Weekly / monthly synthesis
  - Base post generation
  - Platform-specific adaptations
- Tone extraction from user samples
- Scheduling and background jobs
- Rate limiting, validation, and security
- Observability and error tracking (Sentry)

The core idea is simple:

> Users log fragments.  
> The system remembers.  
> Patterns emerge.  
> Narratives are generated.

Everything in this backend exists to support that loop.

---

## Tech Stack

- Node.js (Express, ESM)
- Prisma + MySQL
- Mastra / LLM orchestration layer
- Email (verification + password reset)
- OAuth (Google)
- Razorpay (billing)
- Sentry (error tracking)

---

## Running Locally

```bash
npm install
npm start
