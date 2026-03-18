# eSIMLaunch: Developer Guide — Easy Way Flow

> **For**: AI models, agents, and developers joining this codebase.  
> **Purpose**: Understand what eSIMLaunch is and how the Easy Way flow works so you can implement, debug, or extend it correctly.

---

## What Is eSIMLaunch?

**eSIMLaunch** is a B2B SaaS platform that lets entrepreneurs resell eSIMs (digital SIM cards for travel). Think "Shopify for eSIMs":

- Merchants sign up, pick a plan, and either get a **fully managed storefront** (Easy Way) or **API-only access** (Advanced Way).
- The platform proxies all eSIM operations to the **eSIM Access** provider API (HMAC-SHA256 auth).
- Main backend: Express + Prisma + PostgreSQL. Frontend: React + Vite (esim-connect-hub). Optional template: Next.js + NestJS (esimlaunch-template).

---

## Two Business Models

| Mode | Who | How They Sell | Data Model |
|------|-----|---------------|------------|
| **Easy Way** | Non-technical merchants | Managed storefront or deployable template | `CustomerOrder` (store orders), `Store` |
| **Advanced Way** | Developers | API keys, their own app/site | `Order` (API orders only) |

Easy Way merchants can control branding, pricing, packages, and support from the eSIMLaunch dashboard. Advanced users integrate via REST API and manage their own UI.

---

## Easy Way: Two Storefront Options

Easy Way merchants get a customer-facing store. There are **two** ways that store can be served:

### Option A: esimlaunch-template (Primary)

- **What**: A standalone Next.js + NestJS monorepo (`esimlaunch-template/`).
- **Where**: `apps/web` (Next.js), `apps/backend` (NestJS).
- **Use case**: Deployable template that merchants host (or eSIMLaunch hosts for them). Full control, custom domain support.
- **Linking**: When deployed, set env vars to connect to the main backend (see [Linking the Template](#linking-the-template)).

### Option B: Subdomain in esim-connect-hub

- **What**: Demo-store components in `esim-connect-hub` served at `*.esimlaunch.com` (e.g. `ezzawanesim.esimlaunch.com`).
- **Where**: `esim-connect-hub/src/pages/demo-store/`, `SubdomainStoreLoader`, routes `/store/:subdomain/*`.
- **Use case**: Quick subdomain stores without deploying the full template.

Most production Easy Way stores use **Option A (esimlaunch-template)**. This doc focuses on that flow.

---

## Easy Way Architecture (Template)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Merchant Dashboard (esim-connect-hub)                                    │
│  /dashboard → Pricing Config, Package Selector, Support, Orders, etc.     │
└─────────────────────────────┬─────────────────────────────────────────────┘
                              │
                              │  Saves to Store record
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Main Backend (backend/)                                                  │
│  - Store (branding, pricingMarkup, selectedPackages)                     │
│  - CustomerOrder (Easy Way orders from template)                         │
│  - Order (Advanced API orders + eSIM Access proxy)                       │
│  - GET /api/stores/:storeId/public                                        │
│  - GET /api/stores/by-subdomain/:subdomain                               │
│  - POST /api/integration/template-order                                    │
│  - POST /api/integration/topup                                            │
└─────────────────────────────┬─────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     Fetch store config   Sync orders    Support tickets
     (pricing, packages)   (template→hub)  (bidirectional)
              │               │               │
┌─────────────┴───────────────┴───────────────┴─────────────────────────────┐
│  esimlaunch-template (Next.js + NestJS)                                    │
│  - StoreConfigService: fetches config from main backend (60s cache)       │
│  - EsimService: uses config when linked; packages already have markup      │
│  - Orders: syncs to main backend via POST /api/integration/template-order  │
│  - Support: create via /api/support/tickets; list/reply via integration   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Linking the Template

For a template deployment to talk to the main backend, set:

```env
# Main backend URL
ESIMLAUNCH_HUB_API_URL=https://api.esimlaunch.com

# Link to a store (use one)
STORE_ID=<store-uuid-from-admin>       # or
STORE_SUBDOMAIN=ezzawanesim            # if store has subdomain

# Order sync secret (must match main backend TEMPLATE_ORDER_SYNC_SECRET)
TEMPLATE_ORDER_SYNC_SECRET=<shared-secret>
```

When these are set, `StoreConfigService.isLinked()` is true and:

1. The template fetches packages, pricing, and branding from the main backend.
2. Completed orders sync to the dashboard via `POST /api/integration/template-order`.
3. Top-ups sync via `POST /api/integration/topup`.
4. Support tickets use the main backend as the source of truth.

---

## Dashboard → Template Flows

| What | How | Endpoint | Cache |
|------|-----|----------|-------|
| **Pricing markup** | Merchant sets in Pricing Config → `Store.pricingMarkup` | `GET /api/stores/:id/public` or `GET /api/stores/by-subdomain/:sub` | ~60s |
| **Package selection** | Merchant picks packages → `Store.selectedPackages` | Same | Same |
| **Branding** | Colors, logo, business name in Store | Same | Same |
| **Template settings** | Hero style, FAQs, etc. in `Store.templateSettings` | Same | Same |

The main backend’s `buildStorePublicResponse()` in `backend/src/routes/stores.ts`:

- Filters packages by `selectedPackages`.
- Applies `pricingMarkup` (global → country → dataSize → package).
- Returns branding and templateSettings.

---

## Template → Dashboard Flows

| What | How | Endpoint | Auth |
|------|-----|----------|------|
| **Orders** | Template completes order → syncs to main backend | `POST /api/integration/template-order` | `x-template-sync-secret` |
| **Top-ups** | Template processes top-up → reports to main | `POST /api/integration/topup` | Same |
| **Support (create)** | Customer submits form on template | `POST /api/support/tickets` | None (uses `storeId`) |
| **Support (list/reply)** | Template fetches/updates via integration | `GET/POST /api/integration/support/tickets/...` | Same |

### Order Sync Payload

```json
{
  "storeId": "<uuid>",
  "templateOrderId": "<template-order-id>",
  "customerEmail": "customer@example.com",
  "customerName": "John",
  "totalAmountCents": 1999,
  "packageCount": 1,
  "status": "COMPLETED",
  "paymentRef": "pi_xxx"
}
```

Deduplication: main backend uses `paymentIntentId = template_{storeId}_{templateOrderId}` to avoid duplicates.

### Status Updates

If template order status changes (e.g. provisioning fails), call:

```
PATCH /api/integration/template-order
Body: { storeId, templateOrderId, status: "FAILED" | "PROCESSING" | ... }
```

---

## Data Models (Relevant to Easy Way)

| Table | Purpose | Created By |
|-------|---------|------------|
| **Store** | Branding, pricing, package selection, subdomain | Dashboard (Onboarding, Admin) |
| **CustomerOrder** | Easy Way store orders | Main backend (payment confirm, template sync) |
| **Order** | Advanced API orders + eSIM Access linkage | Main backend (API proxy) |
| **EsimProfile** | eSIM ICCIDs, QR codes | Main backend (webhook from eSIM Access) |
| **CustomerTopUp** | Customer data top-ups | Main backend (template sync) |

**Amount units**:

- `Order.totalAmount`: 1/10000 USD (eSIM Access format).
- `CustomerOrder.totalAmount`: cents (e.g. 1999 = $19.99).

---

## Key Files

| Area | Path |
|------|------|
| Main backend store config | `backend/src/routes/stores.ts` (`buildStorePublicResponse`) |
| Integration routes | `backend/src/routes/integration.ts` |
| Template store config | `esimlaunch-template/apps/backend/src/modules/esim/store-config.service.ts` |
| Template order sync | `esimlaunch-template/apps/backend/src/modules/orders/orders.service.ts` (`syncOrderToMainBackend`) |
| Template support | `esimlaunch-template/apps/backend/src/modules/support/support.service.ts` |
| Dashboard orders merge | `backend/src/routes/dashboard.ts` (Order + CustomerOrder) |

---

## Common Gotchas

1. **Amount units**: Template and `CustomerOrder` use **cents**. eSIM Access API uses **1/10000 USD**. Do not mix them.
2. **Sync is fire-and-forget**: Template order sync has no retry. If main backend is down, orders won’t appear in the dashboard.
3. **Template sync status**: `syncOrderToMainBackend` sends `status: 'COMPLETED'` at sync time. Use `PATCH /api/integration/template-order` if provisioning fails later.
4. **Support ticket creation**: Template uses `POST /api/support/tickets` (public), not the integration route. List/reply use integration routes with `x-template-sync-secret`.

---

## Quick Reference: Integration Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/integration/template-order` | x-template-sync-secret | Register template order in dashboard |
| PATCH | `/api/integration/template-order` | x-template-sync-secret | Update synced order status |
| POST | `/api/integration/topup` | x-template-sync-secret | Register customer top-up |
| GET | `/api/integration/support/tickets` | x-template-sync-secret | List tickets (template) |
| GET | `/api/integration/support/tickets/:id` | x-template-sync-secret | Get ticket + messages |
| POST | `/api/integration/support/tickets/:id/messages` | x-template-sync-secret | Add reply from customer |

---

## Related Docs

- `docs/PROJECT_OVERVIEW.md` — Full architecture, schema, API
- `docs/EASY_WAY_FLOWS.md` — Support tickets, emails, top-ups
- `docs/STORE_SUBDOMAINS_AND_STORE_REQUESTS.md` — Subdomain setup, DNS
- `docs/DASHBOARD_TO_SITE_SYNC.md` — Dashboard ↔ template sync design
