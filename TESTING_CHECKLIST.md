# Complete Testing Checklist - All New Features

## 🎯 Overview
This document lists all features implemented from Phase 1 through Phase 5, organized for systematic testing.

---

## ✅ PHASE 1: Critical Fixes & Core Business Flows

### 1. Store Creation (Fixed)
**Status:** ✅ Completed  
**Files:** `esim-connect-hub/src/pages/Onboarding.tsx`

**What to Test:**
- [ ] Complete onboarding wizard
- [ ] Store is actually created in database (check Prisma Studio)
- [ ] Store ID is saved to localStorage
- [ ] Redirect to store preview works
- [ ] Store data persists after page refresh

**Test Steps:**
1. Go to `/signup` and create account
2. Complete onboarding (business info, branding, domain)
3. Click "Launch Store"
4. Verify store appears in database
5. Check `/store-preview` shows your store

---

### 2. Payment Processing (Stripe Integration)
**Status:** ✅ Completed  
**Files:** 
- `backend/src/services/paymentService.ts`
- `backend/src/routes/payments.ts`
- `esim-connect-hub/src/pages/Checkout.tsx`
- `esim-connect-hub/src/pages/demo-store/DemoStoreCheckout.tsx`

**What to Test:**
- [ ] Create payment intent via API
- [ ] Stripe Elements form loads correctly
- [ ] Payment confirmation works
- [ ] Payment webhooks are received
- [ ] Payment status updates correctly

**Test Steps:**
1. Navigate to demo store
2. Select a package and click "Buy Now"
3. Fill in customer email
4. Enter test card: `4242 4242 4242 4242`
5. Complete payment
6. Verify payment intent created in Stripe Dashboard
7. Check webhook received (if using Stripe CLI)

**API Endpoints:**
- `POST /api/payments/create-intent`
- `POST /api/payments/confirm`
- `POST /api/payments/webhook`
- `POST /api/payments/refund`

---

### 3. Customer Order Processing
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/customerOrderService.ts`
- `backend/src/routes/customerOrders.ts`
- `backend/prisma/schema.prisma` (CustomerOrder model)

**What to Test:**
- [ ] Customer order created after payment
- [ ] Order linked to merchant order
- [ ] Order status updates correctly
- [ ] Order appears in merchant dashboard
- [ ] Order can be retrieved by ID or email

**Test Steps:**
1. Complete a purchase
2. Check merchant dashboard for new order
3. Verify order status is PENDING → PROCESSING → COMPLETED
4. Test order retrieval: `/api/customer-orders/:orderId`

**API Endpoints:**
- `GET /api/customer-orders/:orderId`
- `GET /api/customer-orders?email=...`
- `POST /api/customer-orders/:orderId/resend-email`

---

### 4. eSIM Delivery System
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/qrCodeService.ts`
- `backend/src/services/emailService.ts`
- `backend/src/services/customerOrderService.ts`

**What to Test:**
- [ ] QR codes generated for eSIM profiles
- [ ] Email sent with QR codes attached
- [ ] QR codes are valid and scannable
- [ ] Email template looks correct
- [ ] Resend email functionality works

**Test Steps:**
1. Complete a purchase
2. Wait for order to complete
3. Check email inbox for eSIM delivery
4. Verify QR code images are attached
5. Test "Resend Email" button in order tracking

**Email Templates:**
- Order Confirmation
- eSIM Delivery (with QR codes)

---

## ✅ PHASE 2: Core Features & Store Builder

### 5. Package Selection UI
**Status:** ✅ Completed  
**Files:**
- `esim-connect-hub/src/pages/PackageSelector.tsx`
- `esim-connect-hub/src/hooks/usePackages.ts`
- `esim-connect-hub/src/components/shared/PackageCard.tsx`

**What to Test:**
- [ ] Package browser loads packages from eSIM Access API
- [ ] Search and filter functionality works
- [ ] Package selection saves to store
- [ ] Selected packages appear in store preview
- [ ] Package details display correctly

**Test Steps:**
1. Navigate to `/package-selector`
2. Browse packages by country
3. Use search to find specific packages
4. Select packages for your store
5. Save selection
6. Verify packages appear in store

**Route:** `/package-selector`

---

### 6. Pricing Markup Configuration
**Status:** ✅ Completed  
**Files:**
- `esim-connect-hub/src/pages/PricingConfig.tsx`

**What to Test:**
- [ ] Global markup percentage works
- [ ] Country-specific markup works
- [ ] Package-specific markup works
- [ ] Price preview updates correctly
- [ ] Markup saves to store configuration

**Test Steps:**
1. Navigate to `/pricing-config`
2. Set global markup (e.g., 20%)
3. Set country-specific markup for a country
4. Set package-specific markup for a package
5. Verify price calculations are correct
6. Save configuration

**Route:** `/pricing-config`

---

### 7. Webhook Configuration UI
**Status:** ✅ Completed  
**Files:**
- `esim-connect-hub/src/pages/WebhookSettings.tsx`
- `backend/src/routes/api.ts` (test endpoint)

**What to Test:**
- [ ] Add webhook URL
- [ ] Select event types
- [ ] Save webhook configuration
- [ ] Test webhook sends correctly
- [ ] Webhook delivery logs display

**Test Steps:**
1. Navigate to `/settings/webhooks`
2. Add webhook URL (e.g., `https://webhook.site/your-unique-id`)
3. Select event types (ORDER_STATUS, ESIM_STATUS, etc.)
4. Click "Test Webhook"
5. Verify webhook received at your URL
6. Check delivery logs

**Route:** `/settings/webhooks`  
**API Endpoint:** `POST /api/v1/webhooks/test`

---

### 8. Domain Verification & Routing
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/domainVerificationService.ts`
- `backend/src/routes/stores.ts` (domain endpoints)
- `esim-connect-hub/src/pages/DomainVerification.tsx`
- `backend/src/middleware/storeRouter.ts`

**What to Test:**
- [ ] Start domain verification
- [ ] DNS instructions are correct
- [ ] Verify DNS records
- [ ] Domain verification status updates
- [ ] Store accessible via custom domain (if configured)

**Test Steps:**
1. Navigate to `/stores/:storeId/domain`
2. Enter your domain (e.g., `example.com`)
3. Click "Start Verification"
4. Add TXT record to your DNS
5. Click "Verify DNS"
6. Verify status changes to "Verified"

**Routes:**
- `/stores/:storeId/domain`
- `POST /api/stores/:storeId/verify-domain`
- `GET /api/stores/:storeId/domain-status`
- `POST /api/stores/:storeId/verify-dns`

---

## ✅ PHASE 3: Customer Experience

### 9. Customer Account System
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/customerAuthService.ts`
- `backend/src/routes/customers.ts`
- `backend/src/middleware/customerAuth.ts`
- `esim-connect-hub/src/pages/customer/Login.tsx`
- `esim-connect-hub/src/pages/customer/Signup.tsx`
- `esim-connect-hub/src/pages/customer/Dashboard.tsx`
- `esim-connect-hub/src/contexts/CustomerAuthContext.tsx`

**What to Test:**
- [ ] Customer registration
- [ ] Customer login
- [ ] Customer dashboard loads
- [ ] Order history displays
- [ ] Orders linked to customer account
- [ ] Profile update works
- [ ] Password change works

**Test Steps:**
1. Navigate to `/customer/signup`
2. Create customer account
3. Login at `/customer/login`
4. View dashboard at `/customer/dashboard`
5. Check order history
6. Update profile
7. Make a purchase while logged in
8. Verify order appears in customer dashboard

**Routes:**
- `/customer/signup`
- `/customer/login`
- `/customer/dashboard`

**API Endpoints:**
- `POST /api/customers/register`
- `POST /api/customers/login`
- `GET /api/customers/me`
- `PUT /api/customers/me`
- `GET /api/customers/me/orders`
- `POST /api/customers/me/change-password`

---

### 10. Order Tracking
**Status:** ✅ Completed  
**Files:**
- `esim-connect-hub/src/pages/OrderTracking.tsx`

**What to Test:**
- [ ] Track order by ID
- [ ] Track order by email
- [ ] Order status displays correctly
- [ ] QR codes display when available
- [ ] Resend email button works

**Test Steps:**
1. Complete a purchase
2. Navigate to `/order-tracking`
3. Enter order ID or email
4. View order details
5. Check QR codes (if order completed)
6. Test "Resend Email" button

**Route:** `/order-tracking`

---

## ✅ PHASE 4: Business Operations

### 11. Subscription & Billing System
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/subscriptionService.ts`
- `backend/src/routes/subscriptions.ts`
- `esim-connect-hub/src/pages/Billing.tsx`
- `backend/prisma/schema.prisma` (Subscription, Invoice models)

**What to Test:**
- [ ] Create subscription (monthly/yearly)
- [ ] View current subscription
- [ ] Upgrade/downgrade subscription
- [ ] Cancel subscription
- [ ] View invoice history
- [ ] Subscription webhooks work

**Test Steps:**
1. Navigate to `/settings/billing`
2. View current plan
3. Test upgrade to higher plan
4. Check invoice history
5. Test cancel subscription
6. Verify Stripe subscription created

**Route:** `/settings/billing`

**API Endpoints:**
- `GET /api/subscriptions/me`
- `POST /api/subscriptions`
- `PUT /api/subscriptions/me`
- `DELETE /api/subscriptions/me`
- `GET /api/subscriptions/invoices`

**Note:** Requires Stripe Price IDs in `.env`:
- `STRIPE_STARTER_PRICE_ID_MONTHLY`
- `STRIPE_STARTER_PRICE_ID_YEARLY`
- `STRIPE_GROWTH_PRICE_ID_MONTHLY`
- `STRIPE_GROWTH_PRICE_ID_YEARLY`
- `STRIPE_SCALE_PRICE_ID_MONTHLY`
- `STRIPE_SCALE_PRICE_ID_YEARLY`

---

### 12. Customer Support Tools
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/supportService.ts`
- `backend/src/routes/support.ts`
- `esim-connect-hub/src/pages/CreateSupportTicket.tsx`
- `esim-connect-hub/src/pages/SupportTicket.tsx`
- `esim-connect-hub/src/pages/SupportDashboard.tsx`
- `backend/prisma/schema.prisma` (SupportTicket, TicketMessage models)

**What to Test:**
- [ ] Create support ticket (customer)
- [ ] View ticket details
- [ ] Add messages to ticket
- [ ] Merchant dashboard shows tickets
- [ ] Update ticket status (merchant)
- [ ] Update ticket priority (merchant)
- [ ] Email notifications sent

**Test Steps:**
1. **As Customer:**
   - Navigate to `/support/create`
   - Create a ticket
   - View ticket at `/support/tickets/:ticketId`
   - Add a reply message

2. **As Merchant:**
   - Navigate to `/dashboard/support`
   - View ticket list
   - Open a ticket
   - Update status/priority
   - Reply to customer

**Routes:**
- `/support/create` (public)
- `/support/tickets/:ticketId` (public)
- `/dashboard/support` (merchant)
- `/dashboard/support/tickets/:ticketId` (merchant)

**API Endpoints:**
- `POST /api/support/tickets`
- `GET /api/support/tickets`
- `GET /api/support/tickets/:ticketId`
- `POST /api/support/tickets/:ticketId/messages`
- `PUT /api/support/tickets/:ticketId/status`
- `PUT /api/support/tickets/:ticketId/priority`
- `GET /api/support/stats`

---

## ✅ PHASE 5: Enhancements

### 13. Multi-Currency Support
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/currencyService.ts`
- `backend/src/routes/currency.ts`
- `esim-connect-hub/src/components/shared/CurrencySelector.tsx`
- `esim-connect-hub/src/pages/CurrencySettings.tsx`

**What to Test:**
- [ ] Currency selector component works
- [ ] Currency conversion calculates correctly
- [ ] Store currency settings save
- [ ] Prices display in selected currency
- [ ] Multiple currencies supported per store

**Test Steps:**
1. Navigate to `/stores/:storeId/currency`
2. Set default currency (e.g., EUR)
3. Select supported currencies
4. Save settings
5. Test currency conversion API
6. Use CurrencySelector in checkout

**Route:** `/stores/:storeId/currency`

**API Endpoints:**
- `GET /api/currency/list`
- `POST /api/currency/convert`
- `GET /api/currency/store/:storeId`
- `PUT /api/currency/store/:storeId`

**Supported Currencies:**
USD, EUR, GBP, CAD, AUD, JPY, CNY, INR, MXN, BRL, ZAR

---

### 14. Advanced Analytics
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/analyticsService.ts`
- `backend/src/routes/analytics.ts`
- `esim-connect-hub/src/pages/Analytics.tsx`

**What to Test:**
- [ ] Revenue analytics display correctly
- [ ] Order analytics show status breakdown
- [ ] Customer analytics show counts
- [ ] Dashboard summary loads
- [ ] Time range filters work
- [ ] Revenue growth calculation correct

**Test Steps:**
1. Navigate to `/dashboard/analytics`
2. View summary cards (revenue, orders, customers)
3. Check revenue over time chart
4. Test time range selector (7d, 30d, 90d)
5. Verify data matches actual orders

**Route:** `/dashboard/analytics`

**API Endpoints:**
- `GET /api/analytics/revenue`
- `GET /api/analytics/orders`
- `GET /api/analytics/packages`
- `GET /api/analytics/customers`
- `GET /api/analytics/summary`

---

### 15. SEO Tools
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/seoService.ts`
- `backend/src/routes/seo.ts`
- `esim-connect-hub/src/pages/SEOSettings.tsx`

**What to Test:**
- [ ] SEO settings page loads
- [ ] Meta tags save correctly
- [ ] Sitemap generates
- [ ] Robots.txt generates
- [ ] Open Graph tags work

**Test Steps:**
1. Navigate to `/stores/:storeId/seo`
2. Set page title and description
3. Add keywords
4. Configure Open Graph tags
5. Save settings
6. Test sitemap: `/api/seo/store/:storeId/sitemap`
7. Test robots.txt: `/api/seo/store/:storeId/robots`

**Route:** `/stores/:storeId/seo`

**API Endpoints:**
- `GET /api/seo/store/:storeId`
- `PUT /api/seo/store/:storeId`
- `GET /api/seo/store/:storeId/sitemap`
- `GET /api/seo/store/:storeId/robots`

---

### 16. Email Template Customization
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/emailTemplateService.ts`
- `backend/src/routes/emailTemplates.ts`
- `esim-connect-hub/src/pages/EmailTemplates.tsx`

**What to Test:**
- [ ] Template list loads
- [ ] Template editor works
- [ ] Variable replacement works
- [ ] Preview shows rendered template
- [ ] Template saves correctly

**Test Steps:**
1. Navigate to `/settings/email-templates`
2. Select a template (Order Confirmation, eSIM Delivery, etc.)
3. Edit subject and HTML body
4. Click "Preview" to see rendered template
5. Save template
6. Trigger email to verify custom template used

**Route:** `/settings/email-templates`

**API Endpoints:**
- `GET /api/email-templates`
- `GET /api/email-templates/:templateId`
- `PUT /api/email-templates/:templateId`
- `POST /api/email-templates/:templateId/preview`

**Available Templates:**
- Order Confirmation
- eSIM Delivery
- Support Ticket Confirmation

---

### 17. Affiliate/Referral System
**Status:** ✅ Completed  
**Files:**
- `backend/src/services/affiliateService.ts`
- `backend/src/routes/affiliates.ts`
- `esim-connect-hub/src/pages/AffiliateDashboard.tsx`
- `backend/prisma/schema.prisma` (AffiliateCommission model)

**What to Test:**
- [ ] Affiliate code generated
- [ ] Referral code generated
- [ ] Referral link works
- [ ] Commissions created on orders
- [ ] Commission stats display
- [ ] Commission history shows

**Test Steps:**
1. Navigate to `/dashboard/affiliates`
2. View your affiliate code and referral code
3. Copy referral link
4. Use referral link to sign up new merchant
5. Make a purchase from referred merchant's store
6. Check commissions appear in dashboard
7. View commission history

**Route:** `/dashboard/affiliates`

**API Endpoints:**
- `GET /api/affiliates/code`
- `GET /api/affiliates/referral-code`
- `GET /api/affiliates/stats`
- `GET /api/affiliates/commissions`
- `POST /api/affiliates/track-referral`

**Commission Rate:** Currently 10% (configurable in code)

---

## 🔧 Database Migrations Required

Before testing, ensure all migrations are applied:

```bash
cd backend
npx prisma migrate dev
```

**Migrations to Apply:**
1. `add_billing_period_to_subscription` - Subscription billing periods
2. `add_support_tickets` - Support ticket system
3. `add_phase5_features` - Currency, SEO, Affiliate fields

---

## 📋 Environment Variables Checklist

Ensure these are set in `backend/.env`:

### Stripe
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_STARTER_PRICE_ID_MONTHLY`
- [ ] `STRIPE_STARTER_PRICE_ID_YEARLY`
- [ ] `STRIPE_GROWTH_PRICE_ID_MONTHLY`
- [ ] `STRIPE_GROWTH_PRICE_ID_YEARLY`
- [ ] `STRIPE_SCALE_PRICE_ID_MONTHLY`
- [ ] `STRIPE_SCALE_PRICE_ID_YEARLY`

### Frontend (`esim-connect-hub/.env`)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`

### Email (Resend)
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`

### eSIM Access API
- [ ] `ESIM_ACCESS_API_URL`
- [ ] `ESIM_ACCESS_ACCESS_CODE`
- [ ] `ESIM_ACCESS_SECRET_KEY`

---

## 🧪 Quick Test Flow

**Complete End-to-End Test:**

1. **Merchant Setup:**
   - [ ] Sign up as merchant
   - [ ] Complete onboarding
   - [ ] Create store
   - [ ] Select packages
   - [ ] Configure pricing markup
   - [ ] Set up webhooks

2. **Store Configuration:**
   - [ ] Configure currency settings
   - [ ] Set up SEO
   - [ ] Customize email templates
   - [ ] Verify domain (optional)

3. **Customer Purchase:**
   - [ ] Browse demo store
   - [ ] Select package
   - [ ] Complete checkout with Stripe
   - [ ] Receive order confirmation
   - [ ] Receive eSIM QR codes via email

4. **Order Management:**
   - [ ] View order in merchant dashboard
   - [ ] Track order as customer
   - [ ] Check analytics
   - [ ] View support tickets

5. **Business Features:**
   - [ ] Set up subscription
   - [ ] View invoices
   - [ ] Manage support tickets
   - [ ] Check affiliate commissions

---

## 🐛 Common Issues & Solutions

**Issue:** Payment webhooks not working
- **Solution:** Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

**Issue:** Email not sending
- **Solution:** Check `RESEND_API_KEY` is set and valid

**Issue:** Currency conversion not working
- **Solution:** Exchange rates are static (mock). In production, integrate live API.

**Issue:** Affiliate commissions not created
- **Solution:** Ensure merchant has `referredBy` set when making purchases

---

## 📊 Testing Priority

**Must Test (Critical):**
1. Store creation
2. Payment processing
3. Customer order creation
4. eSIM delivery

**Should Test (Important):**
5. Customer accounts
6. Subscription billing
7. Support tickets
8. Analytics

**Nice to Test (Enhancements):**
9. Multi-currency
10. SEO tools
11. Email templates
12. Affiliate system

---

**Last Updated:** 2024  
**Total Features Implemented:** 17 major features across 5 phases


