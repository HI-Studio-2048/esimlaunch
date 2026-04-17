# esimlaunch-template

A production-ready eSIM storefront template powered by the **esimlaunch** API.

This template mirrors the full flow, logic, and data model of a best-in-class eSIM selling site — including pending-order-first checkout, affiliate/referral system, V-Cash store credit, top-up, cron retry, and guest access — with a clean, simple UI ready for customisation.

## What's included

| Layer | Stack | Purpose |
|---|---|---|
| `apps/web` | Next.js 14 App Router + Clerk + Tailwind | Customer storefront |
| `apps/backend` | NestJS + Prisma + PostgreSQL | REST API, webhooks, cron |
| `apps/worker` | BullMQ + Redis | Async job queue (optional) |
| `libs/esimlaunch-sdk` | TypeScript + Axios | esimlaunch API client |

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or hosted)
- Redis (only if using the worker)
- A [Stripe](https://stripe.com) account
- A [Clerk](https://clerk.com) application
- An [esimlaunch](https://esimlaunch.com) API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

**Backend:**
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env and fill in all values
```

**Web app:**
```bash
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local and fill in all values
```

### 3. Set up the database

```bash
cd apps/backend
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # creates AdminSettings singleton
```

### 4. Start development servers

```bash
# From the monorepo root — runs backend and web concurrently:
npm run dev

# Or individually:
npm run dev:backend   # NestJS on http://localhost:3001
npm run dev:web       # Next.js on http://localhost:3000
```

---

## Architecture overview

```
Browser
  └── apps/web (Next.js 14)
        ├── GET /api/esim/locations      → Browse countries & regions
        ├── GET /api/esim/packages/:code → Plans for a destination
        ├── POST /api/orders             → Create pending order
        ├── POST /api/orders/:id/checkout → Stripe Checkout session
        ├── GET /api/user/esims          → My eSIMs (authenticated)
        └── POST /api/topup/checkout     → Top-up session
              ↓ (backend at localhost:3001)
        apps/backend (NestJS)
              ↓
        libs/esimlaunch-sdk
              ↓
        esimlaunch REST API
```

---

## Order & payment flow

1. User selects a plan → frontend calls `POST /api/orders` → **pending** order created.
2. Checkout page loads order details; user can update email, apply promo, or enter referral code.
3. User clicks "Pay" → `POST /api/orders/:id/checkout` → Stripe Checkout Session created with `orderId` in metadata → user redirected to Stripe.
4. Stripe payment succeeds → `POST /api/webhooks/stripe` fires with `checkout.session.completed` → backend:
   - Updates order to `paid`
   - Handles referral/commission
   - Calls esimlaunch `POST /api/v1/open/esim/order`
   - Polls `POST /api/v1/open/esim/query` until eSIM profile is available
   - Creates `EsimProfile` record
   - Sends order confirmation + eSIM ready emails
5. User is redirected to `/checkout/success` → shows order status.

> **Rule:** Provider is never called before payment is confirmed. V-Cash payment follows the same flow but debits the balance synchronously instead of going to Stripe.

---

## Location & plan data model

| Field | Type | Notes |
|---|---|---|
| `code` | string | ISO country code (e.g. `MY`) or region code (e.g. `GLO`) |
| `name` | string | Display name (e.g. "Malaysia", "Global") |
| `type` | 1 or 2 | **1 = single country**, **2 = multi-country region** |
| `subLocation` | array | Only on type 2; lists member countries |
| `slug` | string | URL-friendly (e.g. `malaysia-esim`, `global-esim`) |

Plan prices from the provider are in **1/10000 USD** units. Divide by 10000 to get USD. The backend's `EsimService` applies admin markup before returning prices to the frontend.

---

## Auth model (Voyage pattern)

- **Frontend auth:** Clerk handles sign-in/sign-up (email, Google, Apple).
- **Backend auth:** Protected routes require a valid Clerk JWT in the `Authorization: Bearer <token>` header. The backend verifies the JWT server-side using `@clerk/clerk-sdk-node`.
- **Guests:** Can buy eSIMs without an account. A guest user row is created by email. After payment, a signed guest-access token (7 days) lets them view the order without logging in.
- **Account linking:** When a guest signs up, all their guest orders are reassigned to their real user (via Clerk `user.created` webhook).

---

## Key environment variables

### Backend (`apps/backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ESIMLAUNCH_API_BASE` | esimlaunch API base URL |
| `ESIMLAUNCH_API_KEY` | esimlaunch Bearer API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `WEB_APP_URL` | Web app URL (for Stripe redirect and email links) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP for transactional email |
| `GUEST_TOKEN_SECRET` | Random secret for guest access tokens |

### Web (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL (e.g. `http://localhost:3001/api`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) |

---

## Stripe webhook setup

1. In Stripe dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://your-backend.com/api/webhooks/stripe`
3. Events to listen for — **all six are required**:
   - `checkout.session.completed` — creates the order after successful checkout
   - `charge.refunded` — reverses the order and refunds V-Cash + commissions
   - `payment_intent.payment_failed` — marks the order as failed
   - `payment_intent.succeeded` — retriggers stuck pending orders (added in Round 8)
   - `charge.dispute.created` — flags disputed orders + reverses affiliate commissions
   - `charge.dispute.updated` — tracks dispute-state changes from Stripe
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

> ⚠️ **Upgrading from an older deployment?** If your Stripe webhook only has
> `checkout.session.completed` and `charge.refunded`, you must add the other
> four events above or disputes and stuck payment intents will go unhandled.
> The backend handler expects all six.

For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen \
  --events checkout.session.completed,charge.refunded,payment_intent.payment_failed,payment_intent.succeeded,charge.dispute.created,charge.dispute.updated \
  --forward-to localhost:3001/api/webhooks/stripe
```

---

## Clerk webhook setup

1. In Clerk dashboard → Webhooks → Add endpoint.
2. URL: `https://your-backend.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`
4. Copy the signing secret to `CLERK_WEBHOOK_SECRET`.

---

## Admin settings

No admin UI is included — use the **esimlaunch dashboard** for provider-level management.

Backend admin settings (markup percent, mock mode, default currency) are stored in the `AdminSettings` table. To update them, either:
- Connect to the database directly and update the `singleton` row, or
- Add a simple internal endpoint (not included — add if needed).

---

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Browse all countries and regions |
| `/countries/[slug]` | Public | Plans for a destination (e.g. `/countries/malaysia-esim`) |
| `/checkout/[orderId]` | Public | Review order, apply promo/referral, pay |
| `/checkout/success` | Public | Order confirmation after Stripe redirect |
| `/orders/[orderId]` | Guest token | View order + QR without account |
| `/my-esims` | Auth | Authenticated user's eSIM profiles |
| `/topup/[profileId]` | Auth | Top-up a specific eSIM |
| `/account/settings` | Auth | Profile info + delete account |
| `/sign-in` | Public | Clerk sign-in page |
| `/sign-up` | Public | Clerk sign-up page |

---

## Deployment checklist

- [ ] Set all required env variables (see `.env.example` and `.env.local.example`)
- [ ] Run `prisma migrate deploy` in production (not `migrate dev`)
- [ ] Run `prisma/seed.ts` once to create the AdminSettings row
- [ ] Configure Stripe webhook endpoint and copy signing secret
- [ ] Configure Clerk webhook endpoint and copy signing secret
- [ ] Set `WEB_APP_URL` to your actual domain in backend env
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` to your actual backend API URL
- [ ] Rotate `GUEST_TOKEN_SECRET` to a secure random value
- [ ] Set `NODE_ENV=production`
