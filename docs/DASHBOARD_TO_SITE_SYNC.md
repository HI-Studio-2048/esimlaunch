# Dashboard → Site Sync: How Merchant Settings Flow to Their Store

This doc explains how to connect the **esim-connect-hub dashboard** (where merchants set markup, pricing, support tickets, users, etc.) to the **esimlaunch-template** sites you build for them, so changes in the dashboard automatically appear on the site—no manual coding.

---

## Current State

### What Already Works (Subdomain / Easy Way Stores)

For stores at `*.esimlaunch.com` (e.g. `ezzawanesim.esimlaunch.com`):

- Storefront calls `GET /api/stores/by-subdomain/:subdomain` on the **main backend**
- Main backend returns packages **with markup already applied** from `Store.pricingMarkup`
- Merchant updates markup in **Pricing Config** → saved to `Store.pricingMarkup` → **next request** gets new prices
- **No extra work** – it’s request-based, so changes are live immediately

### What Doesn’t Work (Standalone Template)

The **esimlaunch-template** is a separate app with its own backend:

- Calls esimlaunch/eSIM Access API directly via `ESIMLAUNCH_API_KEY`
- Uses its own `AdminSettings` table for markup (local DB)
- **No link** to the dashboard – merchant changes in esim-connect-hub never reach the template

---

## Solution: Template as a Client of the Main Backend

Make the template backend **fetch store config** (markup, branding, etc.) from the main backend instead of (or in addition to) local AdminSettings.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  esim-connect-hub (Dashboard)                                    │
│  Merchant sets: markup, pricing, support, users, plans, etc.      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Main Backend (backend/)                                         │
│  - Store.pricingMarkup, Store.selectedPackages, etc.             │
│  - GET /api/stores/:storeId/public                               │
│  - GET /api/stores/by-subdomain/:subdomain                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │  Template backend fetches config
                             │  (by storeId or subdomain)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  esimlaunch-template (Site you build for merchant)               │
│  - Backend fetches store config from main backend                 │
│  - Applies markup when serving packages                          │
│  - Uses branding, currency, etc. from config                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### 1. Link Each Template Deployment to a Store

When you deploy a template for a merchant, store one of these in env:

```env
# Option A: by store ID (from Admin → Store requests)
STORE_ID=clxxxxxxxxxxxxx

# Option B: by subdomain (if store has subdomain)
STORE_SUBDOMAIN=ezzawanesim
```

Also need the main backend URL:

```env
ESIMLAUNCH_HUB_API_URL=https://api.esimlaunch.com
```

**Order sync to dashboard:** When `TEMPLATE_ORDER_SYNC_SECRET` is set (same value on main backend and template), completed template orders are reported to the main backend and appear in the merchant's Recent Orders.

### 2. Template Backend: Fetch Store Config

Add a **StoreConfigService** (or extend EsimService) that:

1. Calls `GET {ESIMLAUNCH_HUB_API_URL}/api/stores/:storeId/public` or  
   `GET {ESIMLAUNCH_HUB_API_URL}/api/stores/by-subdomain/:subdomain`
2. Caches the response (e.g. 5 min TTL) so we don’t hit the main backend on every request
3. Returns: packages (with markup), branding, defaultCurrency, templateSettings

**Packages**: The main backend already returns packages with markup applied. The template can either:

- **Option A (recommended)**: Use those packages directly – template backend proxies package data from the main backend instead of calling esimlaunch API
- **Option B**: Use the main backend only for config (markup %), and continue calling esimlaunch API from the template, applying the fetched markup locally

### 3. Template Backend: Use Config for Packages

**Current flow:**

```
Template backend → esimlaunch API (raw packages) → apply AdminSettings.markupPercent → return
```

**New flow (Option A – proxy through main backend):**

```
Template backend → main backend GET /api/stores/:storeId/public → return packages (already marked up)
```

**New flow (Option B – fetch config, apply locally):**

```
Template backend → main backend GET store config (markup) → cache
Template backend → esimlaunch API (raw packages) → apply markup from config → return
```

### 4. Support Tickets, Users, Plans

Same pattern: the template should call the **main backend** for merchant-scoped data instead of maintaining its own.

| Data           | Main backend endpoint (to add or use) | Template change                          |
|----------------|----------------------------------------|------------------------------------------|
| Support tickets| `GET /api/support-tickets` (merchant-scoped) | Template calls this instead of local DB |
| Users          | `GET /api/users` or Clerk               | Template uses main backend / Clerk      |
| Plans          | Already in store config                | From `GET /api/stores/:id/public`        |

The main backend already has merchant context (JWT or API key). For the template, you need a way to authenticate as that merchant:

- **Store-scoped API key**: When creating a store, generate an API key that is tied to that store. Template uses this key to call the main backend.
- **Or**: Main backend exposes a **public** store endpoint that only needs `storeId` or `subdomain` (no auth) – you already have `GET /api/stores/:storeId/public` and `by-subdomain/:subdomain`.

For **support tickets** and **users**, those are typically merchant-private, so the template would need a store-scoped or merchant-scoped token to call the main backend.

---

## Concrete Steps

### Phase 1: Packages & Pricing (Markup) ✅ Implemented

1. **Template env**
   - Add `STORE_ID` or `STORE_SUBDOMAIN` and `ESIMLAUNCH_HUB_API_URL` to template `.env`.

2. **Template backend**
   - Add a service that fetches `GET /api/stores/:storeId/public` or `by-subdomain/:subdomain`.
   - Cache the response (e.g. 5 min).
   - When serving packages:
     - **Option A**: Return packages from that response (no direct esimlaunch call for packages).
     - **Option B**: Fetch markup from the response, keep calling esimlaunch for packages, apply markup in the template.

3. **Fallback**
   - If `STORE_ID` / `STORE_SUBDOMAIN` is not set, keep current behavior (AdminSettings, direct esimlaunch API).

### Phase 2: Support Tickets, Users

1. **Main backend**
   - Ensure merchant-scoped endpoints exist for support tickets and users (or add them).

2. **Template**
   - Use a store-scoped API key (or similar) to call those endpoints.
   - Replace any local support-ticket or user logic with calls to the main backend.

### Phase 3: API Key Generation for Merchants

1. **Dashboard**
   - In Settings or Developer, add “Generate store API key”.
   - Creates an API key linked to the merchant’s store.
   - Merchant copies the key once; you (or they) add it to the template’s env.

2. **Main backend**
   - Store API keys with `storeId` (or `merchantId`).
   - Validate the key and scope requests to that store/merchant.

---

## Summary

| Merchant action in dashboard | How it reaches the site |
|-----------------------------|--------------------------|
| Set global markup 150%      | Saved to `Store.pricingMarkup` → template fetches store config → uses it on next package request |
| Set country-specific markup | Same – part of `Store.pricingMarkup` |
| Add support ticket          | Stored in main backend → template calls main backend for tickets |
| Update users                | Stored in main backend / Clerk → template uses main backend for user data |
| Change plans / packages     | Stored in `Store.selectedPackages` → included in store config → template uses it |

The core idea: **the template is a client of the main backend**. It fetches store config (and optionally packages) from the main backend instead of keeping its own copy of markup and related settings. Caching (e.g. 5 min) keeps it fast while still reflecting dashboard changes quickly.
