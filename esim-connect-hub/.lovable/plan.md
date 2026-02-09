
# Bring the Website to Life: Replace All Placeholders with Real Visuals + Fix Build Errors

## Overview
Replace every empty placeholder, generic gradient box, and dull container across the entire site with relevant Unsplash images, meaningful icon compositions, and rich visual mock-ups. Also fix 3 build errors blocking deployment.

---

## Build Error Fixes (Priority)

### 1. DNSInstructions.tsx - Line 54: `setIsExpanded` called with argument
The `setIsExpanded` fallback is `() => setInternalExpanded(!internalExpanded)` which takes 0 args, but is called with `!isExpanded`. Fix by making the fallback accept a parameter.

### 2. Login.tsx - Line 126: `authenticateWithRedirect` does not exist on `LoadedClerk`
Remove the direct `useClerk()` import and `clerk.authenticateWithRedirect` call. Replace with Clerk's `SignInButton` component for OAuth, or simply show a "Coming Soon" toast since Clerk isn't configured.

### 3. Signup.tsx - Line 103: Same `authenticateWithRedirect` issue
Same fix as Login.tsx.

---

## Visual Enhancements by Page

### Features Page (`src/pages/Features.tsx`)
Each of the 6 feature sections currently shows an identical grid of empty gradient squares. Replace each with a **unique, contextual visual**:

- **Multi-Provider Integration**: Show a mock UI with provider logo cards (Airalo, eSIM Go, etc.) arranged in a connected grid with status indicators
- **Smart Pricing Engine**: Show a mock pricing table/slider UI with currency symbols and percentage badges
- **Built-in SEO Tools**: Show a mock search console view with ranking charts and keyword badges
- **Powerful User Dashboard**: Show a mini dashboard mockup with charts, stats cards, and activity feed
- **Enterprise Security**: Show a shield icon with lock indicators, encryption badges, and compliance checkmarks
- **Automatic Updates**: Show a deployment pipeline visual with version badges and checkmarks

Each visual will be built with Tailwind-styled mock UI elements (not just images) to look like real product screenshots.

### Blog Page (`src/pages/Blog.tsx`)
- **Featured post image**: Replace the empty gradient box with a relevant Unsplash image (person using phone while traveling)
- **Blog post thumbnails**: Add unique Unsplash images per category:
  - Technology: circuit board / tech imagery
  - Marketing: social media / growth charts
  - Business: office / meeting imagery
  - Industry: airplane / travel imagery
  - Customer Service: support / headset imagery

### Homepage (`src/pages/Index.tsx`)
- The hero dashboard mockup is already decent with skeleton UI elements -- enhance it with more realistic labels and mini-chart data
- Add images to the testimonial cards (avatar photos already referenced but not shown)

### Community Page (`src/pages/Community.tsx`)
- Already uses Unsplash images for avatars -- looks good, no changes needed

### About Page (`src/pages/About.tsx`)
- Already uses Unsplash images for team and story -- looks good, no changes needed

### Case Studies Page (`src/pages/CaseStudies.tsx`)
- Currently uses only Lucide icons for company logos -- no image placeholders to fix, already well-structured

### Partners Page (`src/pages/Partners.tsx`)
- Uses gradient icon boxes for providers -- replace with more distinctive visual identifiers (emoji or styled initials per provider)

### Pricing Page (`src/pages/Pricing.tsx`)
- Already clean with icon + text cards -- no empty placeholders

### Dashboard Page (`src/pages/Dashboard.tsx`)
- Uses skeleton loading states appropriately -- no empty placeholders

---

## Technical Approach

### Images
Use high-quality Unsplash URLs with appropriate `w=` and `q=` parameters for performance:
- Blog thumbnails: `w=600&q=80`
- Featured images: `w=800&q=80`
- All images use `object-cover` with proper `aspect-ratio` containers

### Feature Visuals
Build custom mini-UI mockups using Tailwind classes rather than external images. This keeps them theme-aware (works in dark/light mode) and eliminates loading delays. Each feature section will have a unique composition of:
- Mock cards, badges, and status indicators
- Relevant Lucide icons
- Progress bars, charts, and data visualizations
- All styled to look like actual product screenshots

### Files Modified
1. `src/pages/Features.tsx` -- Replace generic grid with 6 unique feature visuals
2. `src/pages/Blog.tsx` -- Add Unsplash images to featured post and all blog cards
3. `src/pages/Index.tsx` -- Minor enhancements to hero mockup realism
4. `src/pages/Login.tsx` -- Fix Clerk `authenticateWithRedirect` build error
5. `src/pages/Signup.tsx` -- Fix Clerk `authenticateWithRedirect` build error
6. `src/components/shared/DNSInstructions.tsx` -- Fix `setIsExpanded` argument error
