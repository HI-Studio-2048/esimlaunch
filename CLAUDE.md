# CLAUDE.md

## Project Context

**eSIMLaunch** is a comprehensive eSIM reselling platform that enables businesses and entrepreneurs to start their own eSIM retail business—either through a fully managed storefront (Easy Way) or API-only access (Advanced Way).

---

## Tech Stack

- **Framework**: React 18 (Vite 5) for frontend; Express.js 4 for backend
- **Language**: TypeScript 5
- **Database**: PostgreSQL 14+ via Prisma 5 (local: postgres:16 in Docker)
- **Styling**: Tailwind CSS, Radix UI
- **Auth**: JWT, Clerk (optional), bcrypt, 2FA (speakeasy)
- **Payments**: Stripe
- **Email**: Resend
- **Rate limiting**: express-rate-limit (in-memory); BullMQ + Redis optional
- **Other**: TanStack Query, Framer Motion, Zod

---

## Key Directories

- `backend/` — Express API, Prisma schema, auth, eSIM proxy, webhooks, Stripe
- `esim-connect-hub/` — React frontend (has own git repo for Lovable)
- `docs/` — Project documentation (guides, deployment, testing)
- `esimaccess docs/` — eSIM Access API documentation (external reference)
- `esimlaunch-template/` — Template project (apps/libs structure)

---

## Commands

### Backend
- `cd backend && npm run dev` — Start backend dev server (port 3000)
- `cd backend && npm run build` — Build for production
- `cd backend && npm run prisma:migrate` — Run DB migrations
- `cd backend && npm run prisma:studio` — Open Prisma Studio
- `cd backend && npm run reset:db` — Reset database (scripts/reset-db.js)

### Frontend
- `cd esim-connect-hub && npm run dev` — Start Vite dev server (port 8080)
- `cd esim-connect-hub && npm run build` — Build frontend
- `cd esim-connect-hub && npm run lint` — Run ESLint
- `cd esim-connect-hub && npm run test` — Run Vitest

### Docker
- `cd backend && docker-compose up -d` — Start PostgreSQL locally (port 5432)

---

## How I Want You to Work

### Before Coding
- Ask clarifying questions before starting
- Draft a plan for complex work and confirm before coding
- If unsure, ask — don't assume

### While Coding
- Write complete, working code — no placeholders, no TODOs
- Keep it simple and readable over clever
- Follow existing patterns in the codebase
- One change at a time, verify as you go

### After Coding
- Run tests to verify your changes work
- Run linter/formatter before finishing
- Summarize what you changed and why

---

## Code Style
- Use ES modules (import/export)
- Functional components with hooks (if React)
- Type hints on all functions
- Descriptive variable names
- No commented-out code

---

## Do Not
- Edit files in `esim-connect-hub/.git/` or `.lovable/` without explicit instruction
- Commit directly to main — use branches for feature work
- Leave placeholder code or TODOs
- Make changes outside the scope of the task
- Assume — ask if unclear
- Commit or push the `CLONED SITE` folder — it is gitignored

---

## Verification Loop

After completing a task, verify:
1. Code compiles without errors
2. Tests pass
3. No linting warnings
4. Changes match the original request

If any fail, fix before marking complete.

---

## Quick Commands

When I type these shortcuts, do the following:

**"plan"** — Analyze the task, draft an approach, ask clarifying questions, don't write code yet

**"build"** — Implement the plan, run tests, verify it works

**"check"** — Review your changes like a skeptical senior dev. Check for bugs, edge cases, and code quality

**"verify"** — Run all tests and linting, summarize results

**"done"** — Summarize what changed, what was tested, and any notes for me

---

## Success Criteria

A task is complete when:
- [ ] Code works as requested
- [ ] Tests pass
- [ ] No errors or warnings
- [ ] Changes are minimal and focused
- [ ] I can understand what you did without explanation

---

## Dual Repository Setup

This project uses **two separate Git repos**:

1. **Monorepo** (`esimlaunch`) — backend, frontend, docs. Push here for most changes.
2. **Frontend-only** (`esim-connect-hub`) — Lovable repo. Push here when syncing frontend to Lovable.

- `esim-connect-hub/.git/` is gitignored in the monorepo
- For backend-only changes: push to monorepo only
- For frontend-only + Lovable: push to frontend repo (or both)
- See `docs/GIT_WORKFLOW.md` for details

---

## Environment Setup

### Backend (backend/.env)
- `DATABASE_URL` — PostgreSQL (postgresql://...)
- `PORT` (default 3000), `NODE_ENV`, `API_BASE_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `ESIM_ACCESS_API_URL`, `ESIM_ACCESS_ACCESS_CODE`, `ESIM_ACCESS_SECRET_KEY`
- `CORS_ORIGIN`, `FRONTEND_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `CLERK_SECRET_KEY` (optional)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER/GROWTH/SCALE/TEST_PRICE_ID_MONTHLY`, `*_YEARLY`
- `MAIN_DOMAIN`, `ALLOWED_BASE_DOMAIN`, `ADMIN_EMAIL`
- `REDIS_URL` (optional)

### Frontend (esim-connect-hub/.env.local)
- `VITE_API_BASE_URL` — Backend API URL (critical: wrong value causes ERR_CONNECTION_REFUSED). Fallback: `VITE_API_URL`
- `VITE_CLERK_PUBLISHABLE_KEY` (optional)
- `VITE_CLERK_JS_URL` (optional, custom Clerk domain workaround)
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## Service Types

- **EASY** — Fully managed storefront; store builder, white-label
- **ADVANCED** — API-only; full control via API keys

---

## Gotchas and Notes

- **CORS / 525**: If using custom Clerk domain, CORS/SSL issues may occur. Either fix custom domain or use `VITE_CLERK_JS_URL` to load Clerk from default CDN.
- **DATABASE_URL**: Must be `postgresql://` or `postgres://`. Do not use Redis or placeholder.
- **Prisma schema drift**: If production has “column does not exist” errors, run `npx prisma migrate deploy` from backend.
- **API docs**: Frontend route `/api-docs` (public; no auth required).
- **eSIM Access**: All eSIM operations proxy through our backend. HMAC-SHA256 auth; docs in `esimaccess docs/`.

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| `docs/PROJECT_OVERVIEW.md` | Architecture, features, schema, roadmap |
| `docs/DEPLOYMENT_GUIDE.md` | Vercel, Railway, VPS, env vars |
| `docs/GIT_WORKFLOW.md` | Dual-repo push workflow |
| `docs/CLERK_INTEGRATION.md` | Clerk setup |
| `docs/STRIPE_WEBHOOK_SETUP.md` | Stripe webhooks |
| `backend/IMPLEMENTATION_SUMMARY.md` | Backend implementation details |

---

## Issue Tracking

- **All issues are tracked in `ISSUES.md`** at the project root.
- After every code review, log new issues into `ISSUES.md` with status `[ ]`.
- When fixing an issue, update its status to `[x]` in `ISSUES.md`.
- **Never start fixing issues without user confirmation first.** Always present findings, wait for approval, then proceed.
- Update the "Review Log" table at the bottom of `ISSUES.md` after each review.

---

## Notes

- Last updated: 2026-03-18
- Core features implemented; Easy Way is a manual concierge process (team deploys stores using esimlaunch-template)
- Health check: `GET /health` on backend
