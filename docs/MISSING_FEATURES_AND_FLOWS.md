# Missing Features & Flows - Comprehensive Analysis

## 🔴 CRITICAL: Core Business Flows Missing

### 1. Payment Processing & Checkout Flow
**Status:** ❌ Not Implemented

**What's Missing:**
- No payment gateway integration (Stripe/PayPal mentioned but not connected)
- No checkout page/flow for customers purchasing eSIMs
- No payment processing backend endpoints
- No order creation from customer purchases
- No payment confirmation handling
- No refund processing

**Impact:** Customers cannot actually purchase eSIMs. The "Buy Now" buttons in demo store do nothing.

**What Needs to Be Built:**
- **Backend:**
  - Payment gateway integration (Stripe or PayPal)
  - `/api/payments/create-intent` - Create payment intent
  - `/api/payments/confirm` - Confirm payment and create order
  - `/api/payments/webhook` - Handle payment webhooks
  - Refund processing endpoints
  
- **Frontend:**
  - Checkout page (`/checkout` or `/store/:storeId/checkout`)
  - Payment form with Stripe Elements or PayPal SDK
  - Order confirmation page
  - Payment status tracking

**Files to Create/Modify:**
- `backend/src/routes/payments.ts` (NEW)
- `backend/src/services/paymentService.ts` (NEW)
- `esim-connect-hub/src/pages/Checkout.tsx` (NEW)
- `esim-connect-hub/src/pages/demo-store/DemoStoreCheckout.tsx` (NEW)
- Update `DemoStoreCountry.tsx` - Connect "Buy Now" to checkout

---

### 2. Customer Order Processing (Easy Way)
**Status:** ❌ Not Implemented

**What's Missing:**
- No connection between customer checkout and merchant order creation
- No automatic order creation when customer pays
- No eSIM profile generation after payment
- No order-to-customer mapping

**Impact:** Even if payment works, orders won't be created in the merchant's dashboard.

**What Needs to Be Built:**
- **Backend:**
  - Customer order model (link customer email to merchant order)
  - Automatic order creation after payment confirmation
  - eSIM profile generation via eSIM Access API
  - Order status updates (PENDING → PROCESSING → COMPLETED)
  
- **Frontend:**
  - Order tracking page for customers
  - Order history (if customer accounts exist)

**Files to Create/Modify:**
- `backend/prisma/schema.prisma` - Add CustomerOrder model
- `backend/src/services/orderService.ts` - Enhance with customer order creation
- `esim-connect-hub/src/pages/OrderTracking.tsx` (NEW)

---

### 3. eSIM Delivery System
**Status:** ❌ Not Implemented

**What's Missing:**
- No email sending after purchase
- No QR code generation for eSIM profiles
- No email templates for order confirmation
- No delivery status tracking

**Impact:** Customers won't receive their eSIM QR codes after purchase.

**What Needs to Be Built:**
- **Backend:**
  - Email service integration (Resend is installed but not used for eSIM delivery)
  - QR code generation from eSIM profile data
  - Email templates (order confirmation, QR code delivery)
  - `/api/orders/:orderId/resend-email` - Resend QR code
  
- **Frontend:**
  - Email template customization UI (for merchants)
  - Resend QR code button in order details

**Files to Create/Modify:**
- `backend/src/services/emailService.ts` - Add eSIM delivery methods
- `backend/src/services/qrCodeService.ts` (NEW)
- `backend/src/templates/order-confirmation.html` (NEW)
- `backend/src/templates/esim-delivery.html` (NEW)

---

### 4. Store Domain/Subdomain Routing
**Status:** ❌ Not Implemented

**What's Missing:**
- No routing for custom domains (e.g., `esim.merchant.com`)
- No routing for subdomains (e.g., `merchant.esimlaunch.com`)
- No domain verification system
- No SSL certificate management

**Impact:** Stores can't be accessed via custom domains. They only work on `/demo-store` route.

**What Needs to Be Built:**
- **Backend:**
  - Domain verification endpoint
  - Subdomain routing logic
  - Store lookup by domain/subdomain
  
- **Frontend:**
  - Domain verification UI
  - DNS setup instructions (partially exists in Onboarding)
  - Store routing middleware (detect domain and load correct store)

**Files to Create/Modify:**
- `backend/src/routes/stores.ts` - Add domain verification
- `backend/src/middleware/storeRouter.ts` (NEW)
- `esim-connect-hub/src/middleware/StoreRouter.tsx` (NEW)

---

### 5. Store Creation from Onboarding
**Status:** ❌ Not Connected

**What's Missing:**
- Onboarding `handleLaunch` function doesn't actually call `apiClient.createStore()`
- It only simulates store creation with `setTimeout`
- Store data is only saved to `DemoStoreContext`, not backend
- No actual store record created in database

**Impact:** Stores created during onboarding don't exist in the database. They only work in the demo store preview.

**What Needs to Be Fixed:**
- Update `Onboarding.tsx` `handleLaunch` to call `apiClient.createStore(storeData)`
- Handle logo upload (convert to URL or base64)
- Error handling for store creation failures
- Redirect to actual store after creation

**Files to Modify:**
- `esim-connect-hub/src/pages/Onboarding.tsx` - Line 107-169, replace simulation with actual API call

---

### 6. Package Selection & Management UI
**Status:** ⚠️ Partial (Backend exists, UI missing)

**What's Missing:**
- No UI for merchants to browse and select packages from eSIM Access
- No package search/filter interface
- No package curation (select which packages to sell in store)
- No bulk package selection

**Impact:** Merchants can't choose which eSIM packages to sell in their store.

**What Needs to Be Built:**
- **Frontend:**
  - Package browser page (`/onboarding/packages` or `/settings/packages`)
  - Package search and filter (by country, data amount, validity)
  - Package selection interface (checkboxes, select all by country)
  - Selected packages preview
  - Save selected packages to store configuration

**Files to Create/Modify:**
- `esim-connect-hub/src/pages/PackageSelector.tsx` (NEW)
- Update `Onboarding.tsx` - Add package selection step
- Update `StorePreview.tsx` - Show selected packages

---

### 7. Pricing Markup Configuration UI
**Status:** ⚠️ Partial (Backend supports it, UI missing)

**What's Missing:**
- No UI to set custom pricing/markup
- No pricing rules (percentage, fixed amount, by country)
- No bulk pricing updates

**Impact:** Merchants can't set custom prices. They're stuck with eSIM Access prices.

**What Needs to Be Built:**
- **Frontend:**
  - Pricing configuration page (`/settings/pricing`)
  - Markup calculator (show base price + markup = final price)
  - Pricing rules UI (global markup, country-specific, package-specific)
  - Preview pricing changes

**Files to Create/Modify:**
- `esim-connect-hub/src/pages/PricingConfig.tsx` (NEW)
- Update `StorePreview.tsx` - Apply custom pricing to displayed packages

---

## 🟡 IMPORTANT: User Experience Flows

### 8. Customer Account System
**Status:** ❌ Not Implemented

**What's Missing:**
- No customer registration/login
- No customer dashboard
- No order history for customers
- No saved payment methods
- No customer profile management

**Impact:** Customers can't track orders or manage their eSIMs.

**What Needs to Be Built:**
- **Backend:**
  - Customer model (separate from Merchant)
  - Customer authentication endpoints
  - Customer order history endpoint
  
- **Frontend:**
  - Customer signup/login pages
  - Customer dashboard
  - Order history page
  - Profile settings

**Files to Create/Modify:**
- `backend/prisma/schema.prisma` - Add Customer model
- `backend/src/routes/customers.ts` (NEW)
- `esim-connect-hub/src/pages/customer/Login.tsx` (NEW)
- `esim-connect-hub/src/pages/customer/Dashboard.tsx` (NEW)

---

### 9. Webhook Configuration UI
**Status:** ⚠️ Partial (Backend exists, UI missing)

**What's Missing:**
- No UI to configure webhook URLs
- No webhook event type selection
- No webhook testing tool
- No webhook delivery logs viewer

**Impact:** Merchants can't set up webhooks to receive order updates.

**What Needs to Be Built:**
- **Frontend:**
  - Webhook configuration page (`/settings/webhooks`)
  - Add/edit webhook URL form
  - Event type checkboxes (ORDER_STATUS, ESIM_STATUS, etc.)
  - Webhook secret input
  - Webhook test button
  - Webhook delivery logs table

**Files to Create/Modify:**
- `esim-connect-hub/src/pages/WebhookSettings.tsx` (NEW)
- `backend/src/routes/webhooks.ts` - Add webhook testing endpoint

---

### 10. Subscription & Billing System
**Status:** ❌ Not Implemented

**What's Missing:**
- No subscription management (Starter, Growth, Scale plans)
- No billing cycle handling
- No subscription upgrade/downgrade
- No usage-based billing
- No invoice generation

**Impact:** The pricing page shows plans, but there's no actual subscription system.

**What Needs to Be Built:**
- **Backend:**
  - Subscription model
  - Billing cycle management
  - Subscription status tracking
  - Invoice generation
  
- **Frontend:**
  - Subscription management page
  - Plan upgrade/downgrade UI
  - Billing history
  - Invoice download

**Files to Create/Modify:**
- `backend/prisma/schema.prisma` - Add Subscription model
- `backend/src/routes/subscriptions.ts` (NEW)
- `esim-connect-hub/src/pages/Billing.tsx` (NEW)

---

### 11. Customer Support Tools
**Status:** ❌ Not Implemented

**What's Missing:**
- No support ticket system
- No live chat
- No knowledge base integration
- No customer support dashboard for merchants

**Impact:** No way for customers to get help or for merchants to manage support.

**What Needs to Be Built:**
- **Backend:**
  - Support ticket model
  - Ticket creation/update endpoints
  - Email notifications for tickets
  
- **Frontend:**
  - Support ticket creation form
  - Ticket list/view page
  - Merchant support dashboard

**Files to Create/Modify:**
- `backend/prisma/schema.prisma` - Add SupportTicket model
- `backend/src/routes/support.ts` (NEW)
- `esim-connect-hub/src/pages/Support.tsx` (NEW)

---

## 🟢 NICE-TO-HAVE: Enhanced Features

### 12. Multi-Currency Support
**Status:** ❌ Not Implemented

**What's Missing:**
- No currency conversion
- No multi-currency pricing display
- No currency selection for customers

**What Needs to Be Built:**
- Currency conversion service
- Currency selector in store
- Multi-currency pricing display

---

### 13. Advanced Analytics for Store Owners
**Status:** ⚠️ Basic (Dashboard has basic stats, but store-specific analytics missing)

**What's Missing:**
- No store-specific analytics
- No conversion rate tracking
- No customer behavior analytics
- No revenue by package/country breakdown

**What Needs to Be Built:**
- Store analytics dashboard
- Conversion funnel visualization
- Revenue breakdown charts

---

### 14. SEO Tools & Configuration
**Status:** ❌ Not Implemented

**What's Missing:**
- No meta tags configuration
- No sitemap generation
- No schema markup configuration
- No SEO preview tool

**What Needs to Be Built:**
- SEO settings page
- Meta tags editor
- Sitemap generator
- SEO score checker

---

### 15. Email Template Customization
**Status:** ❌ Not Implemented

**What's Missing:**
- No email template editor
- No branding in emails (logo, colors)
- No email preview

**What Needs to Be Built:**
- Email template editor UI
- Template variables documentation
- Email preview tool

---

### 16. Affiliate/Referral System
**Status:** ❌ Not Implemented

**What's Missing:**
- No affiliate program
- No referral tracking
- No commission management

**What Needs to Be Built:**
- Affiliate registration
- Referral link generation
- Commission tracking
- Payout management

---

## 📋 Implementation Priority

### Phase 1: Critical (Must Have for MVP)
1. ✅ Store Creation from Onboarding (Fix existing code)
2. ✅ Payment Processing & Checkout Flow
3. ✅ Customer Order Processing
4. ✅ eSIM Delivery System
5. ✅ Package Selection UI

### Phase 2: Important (Needed for Full Functionality)
6. ✅ Pricing Markup Configuration UI
7. ✅ Store Domain/Subdomain Routing
8. ✅ Customer Account System
9. ✅ Webhook Configuration UI

### Phase 3: Business Operations
10. ✅ Subscription & Billing System
11. ✅ Customer Support Tools

### Phase 4: Enhancements
12. ✅ Multi-Currency Support
13. ✅ Advanced Analytics
14. ✅ SEO Tools
15. ✅ Email Template Customization
16. ✅ Affiliate/Referral System

---

## 🔧 Quick Wins (Can Be Done Quickly)

1. **Fix store creation in onboarding** - Replace `setTimeout` with `apiClient.createStore()` (5 minutes)
2. **Connect "Buy Now" buttons to checkout page** (even if checkout is mock)
3. **Add package selection step to onboarding** (use existing API)
4. **Create webhook configuration UI** (backend already supports it)
5. **Add pricing markup input** (simple percentage input)
6. **Create order tracking page** (read-only, uses existing order data)

---

## 📝 Notes

- **Backend is mostly complete** - Most missing pieces are frontend UI
- **eSIM Access API integration works** - Orders can be created via API
- **Authentication system works** - Merchants can log in and use dashboard
- **Main gap**: Customer-facing flows (checkout, payment, delivery)
- **Second gap**: Easy Way store builder UI (package selection, pricing)

---

**Last Updated:** 2024
**Status:** Ready for implementation planning

