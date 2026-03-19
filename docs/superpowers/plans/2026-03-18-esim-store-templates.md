# eSIM Store Templates (2, 3, 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 3 new eSIM store templates that look/feel like completely different websites while sharing identical backend, SDK, hooks, lib, and contexts.

**Architecture:** Each template is a full copy of `esimlaunch-template/` with only `apps/web/` redesigned. The design layer (tailwind.config, globals.css, layout.tsx, all components, all pages) gets rewritten from scratch per template. API calls, types, hooks, contexts, lib utils stay identical.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Clerk auth, Radix UI primitives, Recharts (optional)

---

## Shared Context for All Templates

### DO NOT TOUCH (already copied as-is):
- `apps/backend/` — NestJS API
- `apps/worker/` — Worker stub
- `libs/esimlaunch-sdk/` — SDK client
- Root config files (package.json, tsconfig, nest-cli)
- `apps/web/lib/` — apiClient, safe-fetch, types, utils, regions, country-slugs, operators, plan-flags, format-expiry, helpArticles
- `apps/web/hooks/` — useAuthFetch, useCurrency, useCountryPriceSummaries, useReferral
- `apps/web/contexts/` — StoreConfigContext, CurrencyContext
- `apps/web/app/sign-in/`, `apps/web/app/sign-up/` — Clerk pages
- `apps/web/middleware.ts` — Clerk auth guards
- `apps/web/components/ui/use-toast.ts` — Toast hook (keep file, pages may import it)

### REDESIGN FROM SCRATCH per template:
- `tailwind.config.ts` — New design tokens, fonts, shadows, radii
- `globals.css` — New CSS variables, base styles, scrollbar
- `layout.tsx` — New root layout, providers, nav/footer structure
- `components/layout/Navbar.tsx` — New navigation pattern
- `components/layout/Footer.tsx` — New footer design
- `components/CountryCard.tsx` — New card design
- `components/DestinationSearch.tsx` — New search UX
- `components/Breadcrumbs.tsx` — New breadcrumb style (or replace with back-nav)
- `components/SearchBar.tsx`, `SearchDropdown.tsx` — New search components
- `components/CurrencySelector.tsx` — Restyle
- `components/checkout/CheckoutProgress.tsx` — New progress indicator
- `components/skeletons/CountrySkeleton.tsx` — New skeleton
- `components/esim/expiry-countdown.tsx` — Restyle (logic same)
- `components/ui/*` — Keep Radix-based primitives, restyle as needed
- ALL `app/*/page.tsx` files (except sign-in/sign-up)

### API Contracts (must be preserved exactly):
- `GET /esim/locations` → `Location[]`
- `GET /esim/slug/:slug` → `Location`
- `GET /esim/packages/:code` → `Plan[]`
- `GET /esim/store-config` → branding, templateSettings
- `POST /orders` → `Order`
- `GET /orders/:id` → `Order`
- `POST /orders/:id/checkout` → `{ url }`
- `POST /orders/:id/validate-promo` → `{ newAmountCents, discount }`
- `POST /orders/:id/update-email` → `Order`
- `POST /orders/:id/remove-promo` → void
- `GET /orders/by-session/:sessionId` → `Order`
- `GET /user/esims` → `EsimProfile[]`
- `GET /user/profile` → user profile
- `GET /user/orders` → `Order[]`
- `GET /currency/detect` → currency
- `GET /currency/rates` → rates
- Affiliate: `GET /affiliate/stats`, `POST /affiliate/register`
- Support: `GET /support/tickets`, `POST /support/tickets`, `GET /support/tickets/:id`, `POST /support/tickets/:id/reply`
- Topup: `POST /topup/checkout`
- VCash: `GET /vcash/balance`

### Required Features (every template):
- localStorage persistence for promo, referral, email in checkout
- Success page: QR code + download/share, copy AC, numbered next steps, guest vs auth CTAs
- My eSIMs: QR modal, copy AC, toast on actions, topup success toast from `?topup_success=1`
- All key pages: navigation context (breadcrumbs or equivalent), skeleton loading, toast errors
- Homepage: price summaries on country cards ("From $X.XX", plan count)

---

## Template 2: Premium Travel Tech (Revolut/Wise vibe)

**Directory:** `esimlaunch-template-2/apps/web/`

**Design Language:**
- Font: Inter (tight, professional)
- Colors: Deep navy (#0a1628) + electric teal (#00d4aa) + white
- Dense information, no wasted space
- Sticky minimal navbar: logo + search icon + account
- Breadcrumb-heavy navigation, contextual back buttons
- Copy tone: Professional, confident ("Get connected in seconds", "Trusted by 50,000+ travelers")

### Task 1: Design System — tailwind.config.ts + globals.css

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/globals.css`

- [ ] **Step 1: Rewrite tailwind.config.ts**

New design tokens: Inter font, navy/teal palette, tight spacing, sharp radii (0.5rem), dense shadows, custom keyframes for slide-in animations.

- [ ] **Step 2: Rewrite globals.css**

New CSS variables: navy bg, teal accent, cool grays, dense scrollbar, no purple. Professional financial-app feel.

- [ ] **Step 3: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 2: Root Layout + Navbar + Footer

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/components/layout/Navbar.tsx`
- Modify: `apps/web/components/layout/Footer.tsx`

- [ ] **Step 1: Rewrite layout.tsx**

Inter font, same provider stack (Clerk → StoreConfig → Currency), new metadata title "eSIM Travel Hub". Layout: Navbar → Breadcrumbs → children → Footer → Toaster.

- [ ] **Step 2: Rewrite Navbar.tsx**

Sticky minimal navbar: logo left, center: nothing (clean), right: search icon (opens dropdown), currency selector, account/auth. Professional, Revolut-style. Mobile: hamburger menu.

- [ ] **Step 3: Rewrite Footer.tsx**

Compact 4-column footer: Destinations, Support, Legal, Company. Bottom: copyright + trust badges. Navy background.

- [ ] **Step 4: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 3: Search + Country Card + Breadcrumbs + Skeletons

**Files:**
- Modify: `apps/web/components/DestinationSearch.tsx`
- Modify: `apps/web/components/CountryCard.tsx`
- Modify: `apps/web/components/Breadcrumbs.tsx`
- Modify: `apps/web/components/SearchBar.tsx`
- Modify: `apps/web/components/SearchDropdown.tsx`
- Modify: `apps/web/components/CurrencySelector.tsx`
- Modify: `apps/web/components/skeletons/CountrySkeleton.tsx`

- [ ] **Step 1: Rewrite DestinationSearch.tsx** — Full-width search bar with animated search, typeahead dropdown, dense results list. Professional travel-search feel.

- [ ] **Step 2: Rewrite CountryCard.tsx** — Compact card: flag + name + "From $X.XX" + plan count. Hover: teal border. Dense grid-friendly.

- [ ] **Step 3: Rewrite Breadcrumbs.tsx** — Prominent breadcrumb trail with chevrons, always visible. Teal links.

- [ ] **Step 4: Restyle SearchBar, SearchDropdown, CurrencySelector** — Match navy/teal theme.

- [ ] **Step 5: Rewrite CountrySkeleton.tsx** — Matching skeleton.

- [ ] **Step 6: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 4: Homepage (page.tsx)

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Rewrite homepage**

Sections:
1. Large hero: Navy bg, animated search bar center, "Get connected in seconds" headline, trust badges
2. "Popular Destinations" — horizontal scroll cards with flags + pricing
3. "How It Works" — 3-step visual (Search → Buy → Connect) with icons
4. Country grid by region (reuse CountryCard)
5. Trust logos bar
6. FAQ section (from templateSettings)
7. Info cards section

Same API calls: `apiFetch('/esim/locations')`, `useCountryPriceSummaries`, `useStoreConfig`.

- [ ] **Step 2: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 5: Country Page + Plan Preview

**Files:**
- Modify: `apps/web/app/countries/[slug]/page.tsx`
- Modify: `apps/web/app/countries/[slug]/plan/[packageCode]/page.tsx`

- [ ] **Step 1: Rewrite country page**

Two-column layout:
- Left sidebar: filters (duration tabs as sidebar, price range display)
- Right: plan cards in grid (compact, dense information)
- Location header with flag, plan count, breadcrumbs
Same API calls: `apiFetch('/esim/slug/:slug')`, `apiFetch('/esim/packages/:code')`, `useCurrency`.

- [ ] **Step 2: Rewrite plan preview page**

Plan detail card with all info, prominent "Continue to Checkout" CTA. Two-column: left info, right summary.
Same API: creates order via `POST /orders` or `authFetch('/orders')`.

- [ ] **Step 3: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 6: Checkout (Multi-Step Wizard) + Success

**Files:**
- Modify: `apps/web/app/checkout/[orderId]/page.tsx`
- Modify: `apps/web/app/checkout/success/page.tsx`
- Modify: `apps/web/components/checkout/CheckoutProgress.tsx`

- [ ] **Step 1: Rewrite CheckoutProgress.tsx**

Multi-step wizard progress bar: 1. Review → 2. Details → 3. Payment. Horizontal steps with numbers, active/complete states.

- [ ] **Step 2: Rewrite checkout page**

Multi-step wizard UI wrapping the same logic:
- Step 1 (Review): Order summary card
- Step 2 (Details): Email, promo code, referral code fields
- Step 3 (Payment): Pay button + store credit option
All same API calls, localStorage persistence, same state management.

- [ ] **Step 3: Rewrite success page**

Same logic: QR code, download/share buttons, copy AC, numbered next steps, guest vs auth CTAs. Styled in navy/teal theme.

- [ ] **Step 4: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 7: My eSIMs (Card Grid + Donut Charts)

**Files:**
- Modify: `apps/web/app/my-esims/page.tsx`
- Modify: `apps/web/app/my-esims/[iccid]/page.tsx`
- Modify: `apps/web/app/my-esims/[iccid]/topup/page.tsx`
- Modify: `apps/web/components/esim/expiry-countdown.tsx`

- [ ] **Step 1: Rewrite my-esims list page**

Card grid (2-3 columns):
- Each card: status badge (top-right), plan name, ICCID, SVG donut chart for usage (replaces progress bar), quick action buttons
- Filters: status dropdown, search input, select all
- Bulk actions toolbar
- Same API: `authFetch('/user/esims')`, same toasts, same `?topup_success=1` handling

- [ ] **Step 2: Rewrite eSIM detail page**

Two-column: left detail card (status, plan info, ICCID), right: QR code + install instructions.
Donut chart for usage. Same API calls and logic.

- [ ] **Step 3: Rewrite topup page** — Same logic, new styling.

- [ ] **Step 4: Restyle expiry-countdown.tsx** — Match theme.

- [ ] **Step 5: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 8: Account Pages

**Files:**
- Modify: `apps/web/app/account/page.tsx`
- Modify: `apps/web/app/account/orders/page.tsx`
- Modify: `apps/web/app/account/orders/[id]/page.tsx`
- Modify: `apps/web/app/account/settings/page.tsx`
- Modify: `apps/web/app/account/affiliate/page.tsx`

- [ ] **Step 1: Rewrite account dashboard** — Dense stats grid, professional layout. Same API calls.
- [ ] **Step 2: Rewrite orders list** — Dense table view with status badges. Same API.
- [ ] **Step 3: Rewrite order detail** — Two-column: order info + eSIM profile. Same API.
- [ ] **Step 4: Rewrite settings** — Clean form layout. Same API.
- [ ] **Step 5: Rewrite affiliate dashboard** — Stats cards, referral code copy, commissions table. Same API.
- [ ] **Step 6: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 9: Support Pages

**Files:**
- Modify: `apps/web/app/support/page.tsx`
- Modify: `apps/web/app/support/tickets/page.tsx`
- Modify: `apps/web/app/support/tickets/[id]/page.tsx`
- Modify: `apps/web/app/support/tickets/new/page.tsx`
- Modify: `apps/web/app/support/device-check/page.tsx`

- [ ] **Step 1: Rewrite support hub** — Grid of help categories, dense layout. Same tab sections.
- [ ] **Step 2: Rewrite tickets list** — Table view with status. Same API.
- [ ] **Step 3: Rewrite ticket detail** — Chat-style messages. Same API + polling.
- [ ] **Step 4: Rewrite new ticket form** — Clean form. Same API.
- [ ] **Step 5: Rewrite device check page** — Same logic, new styling.
- [ ] **Step 6: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 10: Region Pages + Topup + Guest Orders

**Files:**
- Modify: `apps/web/app/regions/page.tsx`
- Modify: `apps/web/app/regions/[region]/page.tsx`
- Modify: `apps/web/app/topup/[profileId]/page.tsx`
- Modify: `apps/web/app/orders/[orderId]/page.tsx`

- [ ] **Step 1: Rewrite regions page** — Grid of region cards. Same API.
- [ ] **Step 2: Rewrite region detail** — Country grid filtered by region. Same API.
- [ ] **Step 3: Rewrite topup page** — Same logic, new styling.
- [ ] **Step 4: Rewrite guest order page** — Same logic, new styling.
- [ ] **Step 5: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 11: Legal + Info Pages

**Files:**
- Modify: `apps/web/app/terms/page.tsx`
- Modify: `apps/web/app/privacy/page.tsx`
- Modify: `apps/web/app/cookies/page.tsx`
- Modify: `apps/web/app/refund/page.tsx`
- Modify: `apps/web/app/about/page.tsx`
- Modify: `apps/web/app/contact/page.tsx`
- Modify: `apps/web/app/faq/page.tsx`
- Modify: `apps/web/app/esim-setup-guide/page.tsx`
- Modify: `apps/web/app/help-center/page.tsx`
- Modify: `apps/web/app/help-center/install/page.tsx`

- [ ] **Step 1: Restyle all legal pages** — Same content, navy/teal theme, professional typography.
- [ ] **Step 2: Restyle info pages** — About, contact, FAQ, setup guide, help center. Same content/API, new styling.
- [ ] **Step 3: Verify** — `cd apps/web && npx tsc --noEmit`

---

### Task 12: Final Verification

- [ ] **Step 1:** `cd esimlaunch-template-2/apps/web && npx tsc --noEmit` — must pass
- [ ] **Step 2:** Verify all 34 page.tsx files exist and import correctly
- [ ] **Step 3:** Verify no files in lib/, hooks/, contexts/ were modified (diff check)

---

## Template 3: Mobile App in a Browser (Airbnb/Uber vibe)

**Directory:** `esimlaunch-template-3/apps/web/`

**Design Language:**
- Font: DM Sans (rounded, friendly)
- Colors: White bg + coral (#FF5A5F) accent + warm grays
- Lots of whitespace, rounded everything (1.5rem+), illustration-friendly
- Bottom navigation bar on mobile, top tabs on desktop
- App-like: no breadcrumbs, back arrows instead
- Copy tone: Casual, warm ("Stay connected wherever life takes you", "You're all set!")

**Same task structure as Template 2 (Tasks 1-12), but with these design differences:**

### Key Differentiators:
- **Navbar:** Bottom nav bar on mobile (Browse, My eSIMs, Account, Support), top horizontal tabs on desktop
- **Homepage:** Search-first (full-width bar at top), visual grid below, "Near you" suggestions, recently viewed
- **Country page:** Full-width plan cards, swipeable feel, big CTAs
- **Checkout:** Single scrollable page, floating sticky pay button at bottom
- **My eSIMs:** Timeline/feed view, most recent first, each eSIM is a "story card"
- **No breadcrumbs** — back arrows and app-like navigation

Copy `esimlaunch-template/` → `esimlaunch-template-3/`, then apply same task structure with Template 3's design language.

---

## Template 4: High-End E-commerce (Apple Store vibe)

**Directory:** `esimlaunch-template-4/apps/web/`

**Design Language:**
- Font: SF Pro Display / Geist (clean, premium)
- Colors: Pure white + jet black + subtle gray gradients, blue accent (#0071e3)
- Full-width immersive layouts, edge-to-edge sections
- Transparent navbar that becomes solid on scroll
- Cinematic feel: large images, subtle parallax, elegant transitions
- Copy tone: Aspirational ("Experience seamless connectivity", "Crafted for the modern traveler")

### Key Differentiators:
- **Navbar:** Transparent, becomes solid on scroll, mega dropdown for destinations
- **Homepage:** Full-screen hero with destination photography, scroll to reveal, alternating L-R feature sections, testimonial carousel
- **Country page:** Hero banner with flag, plans as elegant product cards with hover effects
- **Checkout:** Two-column — left: order summary always visible, right: form fields
- **My eSIMs:** Minimal list with expandable rows, click to reveal full details + QR modal
- **Footer:** Minimal Apple-style footer

Copy `esimlaunch-template/` → `esimlaunch-template-4/`, then apply same task structure with Template 4's design language.

---

## Execution Strategy

Each template has 12 tasks. Templates are independent and can be built in parallel.

**Recommended execution order:**
1. Template 2 first (all 12 tasks)
2. Template 3 second (all 12 tasks)
3. Template 4 third (all 12 tasks)

Within each template, tasks 1-3 must be sequential (design system → layout → components), then tasks 4-11 can be parallelized in batches.

**Verification after each template:**
```bash
cd esimlaunch-template-N/apps/web && npx tsc --noEmit
```
