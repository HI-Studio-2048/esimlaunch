# Prompt: Create 3 New eSIM Store Templates

## Context

eSIMLaunch is a platform that lets merchants start their own eSIM reselling business. The "Easy Way" gives merchants a fully managed storefront. We have **one completed template** (`esimlaunch-template/`) that is production-ready. Your job is to create **3 more templates** that look and feel like **completely different websites** — like Shopify themes where no one could tell they share the same backend.

Every template must be its own distinct site with its own personality — different layout structures, different navigation patterns, different page compositions, different copy tone, different component designs. A customer visiting Template 2 and Template 3 should have zero sense they're built from the same codebase.

## What the base template is

- **Location:** `esimlaunch-template/`
- **Stack:** Next.js 14 (App Router) frontend + NestJS backend + Prisma + PostgreSQL
- **Auth:** Clerk
- **Payments:** Stripe
- **eSIM provider:** Calls eSIMLaunch hub API (NOT eSIM Access directly) via `libs/esimlaunch-sdk/`
- **Structure:**
  - `apps/web/` — Next.js frontend (Tailwind CSS)
  - `apps/backend/` — NestJS API
  - `apps/worker/` — Optional BullMQ worker (disabled, cron handles everything)
  - `libs/esimlaunch-sdk/` — SDK client for eSIMLaunch hub API

## What to copy vs what to change

### DO NOT CHANGE (copy as-is):
- `apps/backend/` — Entire backend (API, services, prisma schema, webhooks, cron, guards, email)
- `apps/worker/` — Worker stub
- `libs/esimlaunch-sdk/` — SDK client
- Root config files (package.json, tsconfig, nest-cli, etc.)
- `apps/web/lib/` — API client, types, utilities, regions, country-slugs
- `apps/web/hooks/` — useAuthFetch, useCurrency, useCountryPriceSummaries
- `apps/web/contexts/` — StoreConfigContext (fetches branding/config from hub)
- `apps/web/app/sign-in/`, `apps/web/app/sign-up/` — Clerk auth pages

### REDESIGN FROM SCRATCH:
- `apps/web/app/layout.tsx` — Root layout, navigation, footer, fonts
- `apps/web/app/page.tsx` — Home page
- `apps/web/app/checkout/` — Checkout + success pages
- `apps/web/app/my-esims/` — eSIM management pages
- `apps/web/app/topup/` — Top-up pages
- `apps/web/app/account/` — Account dashboard, orders, settings, affiliate
- `apps/web/app/support/` — Support hub + tickets
- `apps/web/app/countries/` — Country + plan pages
- `apps/web/app/regions/` — Region pages
- `apps/web/app/privacy/`, `terms/`, `cookies/`, `refund/` — Legal pages
- `apps/web/app/about/`, `contact/`, `faq/`, `esim-setup-guide/`, `help-center/` — Info pages
- `apps/web/components/` — ALL components
- `apps/web/app/globals.css` — Theme
- `apps/web/tailwind.config.ts` — Design tokens

### KEEP THE SAME FUNCTIONALITY:
Every page must do the same thing functionally — same API calls, same data flow, same user flows. Only the visual presentation and page structure changes.

## What makes templates feel like different sites

Think about what makes Shopify themes (Dawn, Craft, Sense, Taste) feel completely different. It's NOT just colors:

- **Navigation:** Top navbar vs sidebar vs hamburger-first vs bottom tabs on mobile vs sticky minimal bar
- **Homepage structure:** Hero-search-first vs destination-grid-first vs map-based vs featured-deals-first vs storytelling scroll
- **Country browsing:** Card grid vs list view vs interactive map vs carousel vs tabbed regions
- **Plan selection:** Side-by-side comparison table vs stacked cards vs slider vs minimal list
- **Checkout:** Single page vs multi-step wizard vs slide-out drawer vs two-column layout
- **My eSIMs:** Card grid vs detailed list vs timeline view vs tabs-per-status
- **Typography & spacing:** Tight/dense vs spacious/airy vs editorial vs technical
- **Copywriting tone:** Professional/corporate vs casual/friendly vs luxury/premium vs technical/direct
- **Page transitions:** Instant vs animated vs slide-based
- **Information density:** Show everything upfront vs progressive disclosure vs expandable sections
- **Footer:** Mega footer vs minimal footer vs no footer (app-like)
- **Mobile-first vs desktop-first:** Completely different responsive strategies

## The 3 new templates

### Template 2: `esimlaunch-template-2/`
**Feel like:** A premium travel tech company (think Revolut or Wise for eSIMs)
- Sticky minimal navbar with just logo + search icon + account
- Homepage: Large hero with animated search, "Popular destinations" horizontal scroll, featured deals section, "How it works" 3-step visual, trust logos bar
- Country page: Two-column — left sidebar with filters (data, duration, price range), right side plan cards
- Checkout: Multi-step wizard with progress bar (1. Review → 2. Details → 3. Payment)
- My eSIMs: Card grid (2-3 columns), each card shows status badge, usage donut chart, quick actions
- Navigation: Breadcrumb-heavy, contextual back buttons
- Copy tone: Professional, confident ("Get connected in seconds", "Trusted by 50,000+ travelers")
- Dense information, everything visible, no accordions

### Template 3: `esimlaunch-template-3/`
**Feel like:** A modern mobile app in a browser (think Airbnb or Uber)
- Bottom navigation bar on mobile, top tabs on desktop
- Homepage: Search-first (full-width search bar at top), map or visual grid below, "Near you" suggestions, recently viewed
- Country page: Full-width plan cards, swipe-able on mobile, big CTAs
- Checkout: Single scrollable page, floating sticky pay button at bottom
- My eSIMs: Timeline/feed view — most recent first, each eSIM is a "story card" with status, usage inline, expandable details
- Navigation: App-like — bottom bar (Browse, My eSIMs, Account, Support), no breadcrumbs, back arrows instead
- Copy tone: Casual, warm ("Stay connected wherever life takes you", "You're all set!")
- Lots of whitespace, rounded everything, illustration-friendly

### Template 4: `esimlaunch-template-4/`
**Feel like:** A high-end e-commerce site (think Apple Store or premium product page)
- Full-width immersive layouts, edge-to-edge sections
- Homepage: Full-screen hero with destination photography, scroll to reveal content, alternating left-right feature sections, testimonial carousel
- Country page: Hero banner with country flag/photo, plans displayed as elegant product cards with hover effects
- Checkout: Two-column layout — left: order summary always visible, right: form fields
- My eSIMs: Minimal list with expandable rows, click to reveal full details + QR modal
- Navigation: Transparent navbar that becomes solid on scroll, mega dropdown for destinations
- Copy tone: Aspirational, premium ("Experience seamless connectivity", "Crafted for the modern traveler")
- Cinematic feel — large images, subtle parallax, elegant transitions

## How to create each template

1. Copy `esimlaunch-template/` to the new folder name
2. Redesign `apps/web/` completely — new layout, new components, new page structures
3. Keep `apps/backend/`, `apps/worker/`, `libs/` identical (don't touch)
4. Keep `apps/web/lib/`, `apps/web/hooks/`, `apps/web/contexts/` identical (don't touch)
5. Rewrite `tailwind.config.ts`, `globals.css`, `layout.tsx` for the new design language
6. Rewrite all page files and components from scratch (don't just re-skin — re-think the layout)
7. Ensure all pages call the same API endpoints with the same data shapes
8. Test: `cd apps/web && npx tsc --noEmit` must pass

## Key files to reference in the base template

- **Types:** `apps/web/lib/types.ts` — Order, EsimProfile, Plan, Location interfaces
- **API client:** `apps/web/lib/apiClient.ts` — `apiFetch()` function
- **Auth hook:** `apps/web/hooks/useAuthFetch.ts` — `authFetch()` for authenticated requests
- **Store config:** `apps/web/contexts/StoreConfigContext.tsx` — branding, currency, templateSettings
- **Currency:** `apps/web/hooks/useCurrency.ts` — `formatProviderPrice()`, `currency` state
- **Toast:** `apps/web/components/ui/use-toast.ts` — `useToast()` hook (keep or replace with own toast)
- **Price summaries:** `apps/web/hooks/useCountryPriceSummaries.ts` — lazy price loading for country cards

## Required features every template must have (from base template)

These were added during the production-readiness audit and must be present in every template:

- **Checkout:** localStorage persistence for promo code, referral code, and email
- **Success page:** QR code with download/share, copy activation code, numbered next steps, guest vs auth differentiation
- **My eSIMs:** QR modal on click, copy activation code button, toast notifications on actions, topup success toast from `?topup_success=1` param
- **All key pages:** Breadcrumbs (or equivalent navigation context), skeleton loading states (not bare spinners), toast notifications for errors
- **Home page:** Price summaries on country cards ("From $X.XX", plan count)

## Important notes

- Each template's env files are deployment-specific — merchants configure their own credentials
- The store config provides branding (businessName, logoUrl, colors) and templateSettings (heroHeadline, heroSubheadline, FAQs) — use these
- Don't add new backend endpoints or change the SDK — frontend-only changes
- Don't add heavy npm dependencies — keep it Tailwind + shadcn/ui (or rewrite UI components)
- The `CLONED SITE/Voyage` folder is a reference site — don't copy from it
- Each template should feel like it was designed by a completely different agency for a completely different brand
