
# Phases 2-4: Complete Missing Features and Flows

Since Phase 1 (backend/auth) works in your local environment, this plan covers all remaining gaps to make the site fully functional.

---

## Phase 2: Connect Core User Flows

### 1. Fix Navbar Clerk `require()` call
**File:** `src/components/layout/Navbar.tsx`
- Replace the `require("@clerk/clerk-react")` (lines 11-17) with a conditional check using `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` -- same pattern as Login/Signup pages
- This prevents Vite ESM crashes even when Clerk IS configured

### 2. Connect Onboarding to Store Preview
**File:** `src/pages/Onboarding.tsx`
- Import `useDemoStore` from `DemoStoreContext`
- When the user completes onboarding (the `handleLaunch` function), save business name, primary color, and logo to the `DemoStoreContext` so `/store-preview` auto-populates with the values they already entered

### 3. Pricing CTA buttons
**File:** `src/pages/Pricing.tsx`
- "Start Free Trial" buttons --> wrap with `Link to="/signup"`
- "Contact Sales" button --> wrap with `Link to="/contact"`

### 4. Blog post detail page
**New file:** `src/pages/BlogPost.tsx`
- Create a mock blog post detail page with full article content, author info, related posts sidebar, and share buttons
- Uses the URL slug to match blog post title from the existing `blogPosts` array
**File:** `src/pages/Blog.tsx`
- Wrap each blog card and the featured post with `Link to={/blog/${slug}}`
**File:** `src/App.tsx`
- Add route: `/blog/:slug` pointing to `BlogPost`

### 5. Fix "View Demo" hero button
**File:** `src/pages/Index.tsx`
- Change `Link to="/dashboard"` (line 154) to `Link to="/demo-store"` so unauthenticated users see the demo store instead of being bounced to login

---

## Phase 3: Navigation Improvements

### 6. Add "Resources" dropdown to Navbar
**File:** `src/components/layout/Navbar.tsx`
- Add a "Resources" dropdown menu item between FAQ and Blog containing:
  - Coverage Checker (`/coverage`)
  - World Coverage (`/world-coverage`)
  - ROI Calculator (`/roi-calculator`)
  - Case Studies (`/case-studies`)
  - Partners (`/partners`)
  - Changelog (`/changelog`)

### 7. Make API Docs publicly accessible
**File:** `src/App.tsx`
- Remove the `ProtectedRoute` wrapper from the `/api-docs` route so developers can browse documentation without signing up

---

## Phase 4: Polish

### 8. Contact and Demo form mock submissions
**Files:** `src/pages/Contact.tsx`, `src/pages/Demo.tsx`
- Verify forms show a toast success message on submit rather than failing silently against a missing API
- If not, add mock `onSubmit` handlers that show a success toast and reset the form

### 9. Update social media footer links
**File:** `src/components/layout/Footer.tsx`
- Replace `href="#"` on Twitter, LinkedIn, GitHub, YouTube with placeholder URLs or add a tooltip saying "Coming soon" to prevent dead clicks

---

## Summary of Files

| Action | File |
|--------|------|
| Edit | `src/components/layout/Navbar.tsx` -- fix require(), add Resources dropdown |
| Edit | `src/pages/Onboarding.tsx` -- connect to DemoStoreContext |
| Edit | `src/pages/Pricing.tsx` -- add CTA links |
| Edit | `src/pages/Blog.tsx` -- make posts clickable |
| Create | `src/pages/BlogPost.tsx` -- blog detail page |
| Edit | `src/pages/Index.tsx` -- fix View Demo link |
| Edit | `src/App.tsx` -- add BlogPost route, make API Docs public |
| Edit | `src/pages/Contact.tsx` -- mock form submission |
| Edit | `src/pages/Demo.tsx` -- mock form submission |
| Edit | `src/components/layout/Footer.tsx` -- fix social links |
