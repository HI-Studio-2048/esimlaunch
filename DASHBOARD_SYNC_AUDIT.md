# Dashboard → Template Site Sync Audit

Full audit of settings that flow from the esimlaunch dashboard to the live template site. Identifies gaps and required fixes.

---

## Dashboard Pages & What They Configure

| Page | Path | Saves To | Status |
|------|------|----------|--------|
| **Onboarding** | `/onboarding` | businessName, subdomain, selectedPackages: [], pricingMarkup: {}, templateKey, branding (hardcoded colors) | Partially wired |
| **PackageSelector** | `/package-selector` | `Store.selectedPackages` (package slugs) | ✅ OK |
| **PricingConfig** | `/pricing-config` | `Store.pricingMarkup` (global/country/package/dataSize) | ✅ OK (fixed format) |
| **CurrencySettings** | `/stores/:id/currency` | `Store.defaultCurrency`, `Store.supportedCurrencies` | Partially wired |
| **StorePreview** | `/store-preview` | Links to other pages | — |

---

## Per-Setting Audit

### ✅ Correctly Wired

| Setting | Flow | Notes |
|---------|------|-------|
| **selectedPackages** | PackageSelector → DB → buildStorePublicResponse filters packages | Works |
| **pricingMarkup** | PricingConfig → DB → buildStorePublicResponse applies markup | Fixed: dashboard uses `{ type, value }`, backend now supports it |
| **packages** / **packagesTemplate** | Main backend → template StoreConfigService → EsimService → country pages | Works |
| **locations** | Same chain | Works |

### ⚠️ Partially Wired / Format Issues

| Setting | Issue | Severity |
|---------|-------|----------|
| **defaultCurrency** | Template `CurrencyController.detect()` always returns `USD`; does not use StoreConfig.`currency` | High |
| **supportedCurrencies** | Not in main backend public API; not in template | Medium |
| **storeId** | `GET /api/stores/:storeId/public` does not include `storeId` in response (by-subdomain does) | Low |

### ❌ Not Wired to Template Frontend

| Setting | Dashboard | Main API | Template Backend | Template Frontend |
|---------|-----------|----------|-----------------|-------------------|
| **businessName** | Onboarding | ✅ | ✅ StoreConfig | ❌ Hardcoded "eSIM Store" in Footer/Navbar |
| **primaryColor** | Onboarding (hardcoded) | ✅ | ✅ StoreConfig | ❌ Not used |
| **secondaryColor** | Onboarding (hardcoded) | ✅ | ✅ StoreConfig | ❌ Not used |
| **accentColor** | Onboarding (hardcoded) | ✅ | ✅ StoreConfig | ❌ Not used |
| **logoUrl** | Not editable | ✅ | ✅ StoreConfig | ❌ Not used |
| **templateKey** | Onboarding (default) | ✅ | ✅ StoreConfig | ❌ Not used (single template) |
| **templateSettings** | Admin only | ✅ | ✅ StoreConfig | ❌ Not used (FAQs, hero, contact, etc.) |

---

## Template Frontend Current State

- **Navbar/Footer**: Hardcoded "eSIM Store", violet theme, generic tagline
- **Currency**: Calls `/currency/detect` → always gets `USD`; never sees dashboard `defaultCurrency`
- **Currency selector**: Hardcoded `CURRENCIES` list; does not respect `supportedCurrencies`
- **No store config API**: Frontend has no endpoint to fetch branding/currency/templateSettings

---

## Implemented Fixes (Completed)

### 1. Currency Detection
- **Template backend**: CurrencyController injects StoreConfigService; when linked, returns `config.currency` from detect endpoint

### 2. Store Config API for Frontend
- **Template backend**: `GET /api/esim/store-config` returns `{ branding, currency, supportedCurrencies, templateSettings }`
- **Template frontend**: StoreConfigProvider fetches store config; Navbar/Footer use branding

### 3. storeId + supportedCurrencies in Public API
- **Main backend**: `buildStorePublicResponse` returns `storeId` and `supportedCurrencies`; both public endpoints include them

### 4. Branding in Template Frontend
- StoreConfigProvider + useStoreConfig hook
- Navbar: businessName, logoUrl, primaryColor, secondaryColor for logo and CTA buttons
- Footer: businessName, logoUrl, primaryColor
- CurrencySelector: primaryColor for selected state; supportedCurrencies filter

### 5. supportedCurrencies
- Main backend: In public response
- Template StoreConfigService: Maps supportedCurrencies
- Template CurrencySelector: Filters available currencies by supportedCurrencies

---

## File Reference

| Component | Path |
|-----------|------|
| Main backend public API | `backend/src/routes/stores.ts` |
| Template StoreConfigService | `esimlaunch-template/apps/backend/src/modules/esim/store-config.service.ts` |
| Template CurrencyController | `esimlaunch-template/apps/backend/src/modules/currency/currency.controller.ts` |
| Template CurrencyContext | `esimlaunch-template/apps/web/contexts/CurrencyContext.tsx` |
| Template Footer | `esimlaunch-template/apps/web/components/layout/Footer.tsx` |
| Dashboard PricingConfig | `esim-connect-hub/src/pages/PricingConfig.tsx` |
| Dashboard CurrencySettings | `esim-connect-hub/src/pages/CurrencySettings.tsx` |
