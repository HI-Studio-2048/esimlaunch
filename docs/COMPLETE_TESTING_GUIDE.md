# Complete Testing Guide - eSIM Launch Platform

## 🎯 Overview

This guide provides step-by-step instructions to test all features of the eSIM Launch platform. The platform enables businesses to resell eSIM data packages through either a fully-managed storefront (Easy Way) or API access (Advanced Way).

---

## 📋 Pre-Testing Checklist

Before starting, ensure:

- [ ] **Backend server is running** (`cd backend && npm run dev`)
- [ ] **Frontend server is running** (`cd esim-connect-hub && npm run dev`)
- [ ] **Database is running** (PostgreSQL via Docker: `docker-compose up -d`)
- [ ] **Migrations are applied** (`cd backend && npx prisma migrate dev`)
- [ ] **Environment variables are configured** (see below)

### Required Environment Variables

**Backend (`backend/.env`):**
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/esimlaunch
JWT_SECRET=your-secret-key
ESIM_ACCESS_API_URL=https://api.esimaccess.com
ESIM_ACCESS_ACCESS_CODE=your-access-code
ESIM_ACCESS_SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Frontend (`esim-connect-hub/.env`):**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🧪 Automated API Testing

### Run Automated Tests

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File test-api-simple.ps1
```

**What it tests:**
- ✅ Health check endpoint
- ✅ Merchant registration
- ✅ Merchant login
- ✅ JWT authentication
- ✅ API key creation
- ✅ Package queries
- ✅ Balance & regions endpoints

**Expected Result:** All 9 tests should pass.

---

## 👤 Manual Testing - Complete User Flows

### PHASE 1: Merchant Account Setup

#### Test 1.1: Registration & Authentication

**Steps:**
1. Navigate to `http://localhost:5173/signup`
2. Fill in registration form:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test Merchant`
   - Service Type: Select **"Easy Way"** (for store builder) or **"Advanced Way"** (for API access)
3. Click "Create Account"
4. Check email for verification link (if email verification enabled)
5. Navigate to `http://localhost:5173/login`
6. Login with credentials
7. Verify redirect to dashboard

**Expected Results:**
- ✅ Account created successfully
- ✅ Email verification sent (if enabled)
- ✅ Login works
- ✅ Redirected to dashboard after login
- ✅ JWT token stored in localStorage

**What to Check:**
- Form validation (empty fields, invalid email)
- Password strength requirements
- Error messages display correctly
- Session persists after page refresh

---

#### Test 1.2: Onboarding Flow

**For Easy Way Merchants:**
1. After registration/login, navigate to `/onboarding`
2. **Step 0 - Service Type:**
   - Select "Easy Way"
   - Click "Continue"
3. **Step 1 - Business Info:**
   - Enter business name: `Test Travel Agency`
   - Enter website: `https://testtravel.com`
   - Enter phone: `+1234567890`
   - Select country: `United States`
   - Enter description: `We sell travel eSIMs`
   - Click "Next"
4. **Step 2 - Branding:**
   - Select primary color: `#FF5733`
   - Upload logo (optional)
   - Enter tagline: `Stay Connected Worldwide`
   - Enter custom domain: `store.testtravel.com` (optional, Scale plan only)
   - Click "Next"
5. **Step 3 - Provider Selection:**
   - Select eSIM Access provider
   - Click "Next"
6. **Step 4 - Payment Setup:**
   - Select plan: `Growth`
   - Enter test card: `4242 4242 4242 4242`
   - Enter expiry: `12/25`
   - Enter CVV: `123`
   - Enter billing email
   - Click "Next"
7. **Step 5 - Launch:**
   - Review all information
   - Click "Launch My Store"

**For Advanced Way Merchants:**
1. After registration/login, navigate to `/onboarding`
2. **Step 0 - Service Type:**
   - Select "Advanced"
   - Click "Go to Dashboard"
   - Verify redirect to dashboard (no store builder steps)

**Expected Results (Easy Way):**
- ✅ Stripe subscription created for selected plan
- ✅ Store created in database
- ✅ Store ID saved to localStorage
- ✅ Redirected to `/store-preview`
- ✅ Store data persists after refresh
- ✅ Subscription step marked as completed

**Expected Results (Advanced Way):**
- ✅ Redirected directly to dashboard
- ✅ Dashboard shows Advanced Way Quick Actions
- ✅ Setup checklist shows API key + first order steps

**What to Check:**
- Progress indicator shows current step
- Can navigate back/forward between steps (Easy Way only)
- Form validation on each step
- Store appears in database (Easy Way only)
- Subscription created in Stripe (Easy Way only)
- Service type selection works correctly

---

### PHASE 2: Store Management (Easy Way)

#### Test 2.1: Store Preview

**Steps:**
1. Navigate to `/store-preview`
2. Verify store branding displays:
   - Custom colors applied
   - Logo displayed (if uploaded)
   - Business name shown
3. Check Store Settings section:
   - Currency Settings button
   - SEO Settings button
   - Domain Verification button

**Expected Results:**
- ✅ Store preview loads
- ✅ Branding colors applied correctly
- ✅ All settings buttons visible

---

#### Test 2.2: Package Selection

**Steps:**
1. Navigate to Dashboard
2. Click "Packages" card in Quick Actions
   - OR go to `/package-selector`
3. Browse packages:
   - Use search: Type "Japan"
   - Filter by country: Select "Japan"
   - Filter by type: Select "BASE"
4. Select 3-5 packages:
   - Click "Add to Store" on packages
5. Click "Save Selection"
6. Go back to store preview
7. Verify packages appear in store

**Expected Results:**
- ✅ Package browser loads packages
- ✅ Search works correctly
- ✅ Filters apply correctly
- ✅ Selected packages saved
- ✅ Packages appear in store preview

**What to Check:**
- Package cards display: name, data amount, validity, price
- Search returns relevant results
- Filters work independently and together
- Selection persists after page refresh

---

#### Test 2.3: Pricing Configuration

**Steps:**
1. Navigate to Dashboard
2. Click "Pricing" card in Quick Actions
   - OR go to `/pricing-config`
3. Set Global Markup:
   - Enter `20` (20% markup)
   - Verify price preview updates
4. Set Country-Specific Markup:
   - Select country: `Japan`
   - Enter markup: `25`
   - Verify price preview updates
5. Set Package-Specific Markup:
   - Select package: `JP_1_7`
   - Enter markup: `30`
   - Verify price preview updates
6. Click "Save Configuration"
7. Go to store preview
8. Verify prices reflect markup

**Expected Results:**
- ✅ Global markup applies to all packages
- ✅ Country markup overrides global
- ✅ Package markup overrides country/global
- ✅ Price calculations are correct
- ✅ Configuration saves

**What to Check:**
- Price preview updates in real-time
- Markup hierarchy works (package > country > global)
- Prices display correctly in store

---

#### Test 2.4: Currency Settings

**Steps:**
1. Navigate to Store Preview
2. Click "Currency Settings" button
   - OR go to `/stores/:storeId/currency`
3. Set Default Currency: `USD`
4. Select Supported Currencies:
   - Check `EUR`
   - Check `GBP`
   - Check `JPY`
5. Click "Save Settings"
6. Test currency conversion:
   - Use CurrencySelector component in checkout
   - Select different currencies
   - Verify prices convert correctly

**Expected Results:**
- ✅ Currency settings save
- ✅ Currency selector works
- ✅ Prices convert correctly
- ✅ Multiple currencies supported

**What to Check:**
- Currency dropdown displays all selected currencies
- Conversion rates are accurate (may be mock data)
- Prices update when currency changes

---

#### Test 2.5: SEO Settings

**Steps:**
1. Navigate to Store Preview
2. Click "SEO Settings" button
   - OR go to `/stores/:storeId/seo`
3. Configure SEO:
   - Page Title: `Test Travel eSIM Store`
   - Meta Description: `Buy eSIM data packages for travel`
   - Keywords: `esim, travel, data`
   - Open Graph Title: `Test Travel eSIM`
   - Open Graph Description: `Stay connected while traveling`
4. Click "Save Settings"
5. Test sitemap generation:
   - Navigate to `/api/seo/store/:storeId/sitemap`
   - Verify XML sitemap generated
6. Test robots.txt:
   - Navigate to `/api/seo/store/:storeId/robots`
   - Verify robots.txt generated

**Expected Results:**
- ✅ SEO settings save
- ✅ Sitemap generates correctly
- ✅ Robots.txt generates correctly
- ✅ Meta tags applied to store pages

---

#### Test 2.6: Domain Verification

**Steps:**
1. Navigate to Store Preview
2. Click "Domain Verification" button
   - OR go to `/stores/:storeId/domain`
3. Enter domain: `example.com`
4. Click "Start Verification"
5. Copy DNS TXT record shown
6. Add TXT record to your DNS (if you have access)
7. Click "Verify DNS"
8. Wait for verification status

**Expected Results:**
- ✅ Verification process starts
- ✅ DNS instructions are clear
- ✅ Verification status updates
- ✅ Domain verified (if DNS configured)

**What to Check:**
- DNS instructions are accurate
- Verification status updates correctly
- Error messages if verification fails

---

### PHASE 3: Customer Purchase Flow

#### Test 3.1: Demo Store Browsing

**Steps:**
1. Navigate to `/demo-store`
2. Browse homepage:
   - View hero section
   - Browse featured destinations
   - Check navigation menu
3. Navigate to `/demo-store/destinations`
4. Browse countries:
   - Click on a country card
   - View packages for that country
5. Navigate to `/demo-store/country/japan`
6. View package details:
   - Package name
   - Data amount
   - Validity period
   - Price
   - Coverage map

**Expected Results:**
- ✅ Demo store loads
- ✅ Navigation works
- ✅ Countries display correctly
- ✅ Packages display with correct information
- ✅ Package details page loads

**What to Check:**
- Store branding matches configured colors
- All links work
- Images load correctly
- Responsive design on mobile

---

#### Test 3.2: Checkout Process

**Steps:**
1. From demo store, select a package
2. Click "Buy Now" or "Add to Cart"
3. Navigate to checkout page
4. Fill in customer information:
   - Email: `customer@example.com`
   - Name: `John Doe`
5. Select currency (if multiple supported)
6. Review order summary:
   - Package details
   - Price
   - Total amount
7. Enter payment details:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
8. Click "Complete Purchase"
9. Wait for payment processing

**Expected Results:**
- ✅ Checkout page loads
- ✅ Stripe Elements form displays
- ✅ Payment processes successfully
- ✅ Order confirmation shown
- ✅ Redirect to order tracking

**What to Check:**
- Form validation (empty fields, invalid email)
- Stripe card validation
- Payment processing time
- Error handling (declined cards)
- Success message displays

**Test Declined Card:**
- Use card: `4000 0000 0000 0002`
- Verify error message displays
- Verify order not created

---

#### Test 3.3: Order Processing & eSIM Delivery

**Steps:**
1. After successful payment, check email inbox
2. Verify Order Confirmation email received:
   - Order number
   - Package details
   - Amount paid
3. Wait for order processing (may take a few seconds)
4. Check email for eSIM Delivery:
   - QR code images attached
   - Installation instructions
   - Package details
5. Navigate to `/order-tracking`
6. Track order by:
   - Order ID
   - Email address
7. Verify order details:
   - Order status: `COMPLETED`
   - QR codes displayed
   - Package information
8. Test "Resend Email" button

**Expected Results:**
- ✅ Order confirmation email received
- ✅ eSIM delivery email received with QR codes
- ✅ QR codes are valid and scannable
- ✅ Order tracking works
- ✅ Resend email works

**What to Check:**
- Email formatting looks correct
- QR codes are clear and scannable
- QR codes work with phone camera
- Order status updates correctly
- Resend email sends new email

---

### PHASE 4: Merchant Dashboard Features

#### Test 4.1: Dashboard Overview

**Steps:**
1. Login as merchant
2. Navigate to `/dashboard`
3. Review dashboard:
   - Revenue summary card
   - Orders summary card
   - Customers summary card
   - Recent orders table
   - Quick Actions section
4. **For Easy Way merchants:** Verify Quick Actions show:
   - Analytics, Support, Affiliates, Packages, Pricing
5. **For Advanced Way merchants:** Verify Quick Actions show:
   - Analytics, Package Browser, Create Order, Profiles, Balance, Support, Affiliates
6. Click "View Analytics" button in banner
7. Verify redirect to analytics page

**Expected Results:**
- ✅ Dashboard loads
- ✅ Summary cards show correct data
- ✅ Recent orders display
- ✅ Quick Actions cards visible and service-type aware
- ✅ Setup checklist shows correct steps (store/domain for Easy, API key/order for Advanced)
- ✅ Analytics button works

**What to Check:**
- Data matches actual orders
- Cards update in real-time
- Navigation works correctly
- Quick Actions differ based on service type
- Setup checklist is service-type aware

---

#### Test 4.2: Analytics Dashboard

**Steps:**
1. Navigate to `/dashboard/analytics`
   - OR click "Analytics" card in Quick Actions
2. Review summary cards:
   - Total Revenue
   - Total Orders
   - Total Customers
   - Revenue Growth %
3. Review Revenue Chart:
   - Select time range: `7 days`
   - Verify chart updates
   - Select time range: `30 days`
   - Verify chart updates
4. Review Order Analytics:
   - Status breakdown
   - Order count by status
5. Review Package Analytics:
   - Top selling packages
   - Package performance
6. Review Customer Analytics:
   - Customer count
   - New vs returning

**Expected Results:**
- ✅ Analytics page loads
- ✅ Summary cards show correct data
- ✅ Charts render correctly
- ✅ Time range filters work
- ✅ Data matches actual orders

**What to Check:**
- Charts are interactive
- Data is accurate
- Filters apply correctly
- Loading states work

---

#### Test 4.3: Support Ticket System

**Steps:**
1. **As Customer:**
   - Navigate to `/support/create`
   - Create ticket:
     - Email: `customer@example.com`
     - Subject: `Need help with eSIM`
     - Message: `I cannot activate my eSIM`
     - Priority: `HIGH`
   - Click "Submit Ticket"
   - Note ticket ID
   - Navigate to `/support/tickets/:ticketId`
   - Add reply message
   - Verify message appears

2. **As Merchant:**
   - Navigate to Dashboard
   - Click "Support" card in Quick Actions
     - OR go to `/dashboard/support`
   - View ticket list
   - Open the ticket you created
   - Update status: `IN_PROGRESS`
   - Update priority: `HIGH`
   - Add merchant reply
   - Update status: `RESOLVED`

**Expected Results:**
- ✅ Customer can create tickets
- ✅ Merchant sees tickets in dashboard
- ✅ Status updates work
- ✅ Priority updates work
- ✅ Messages thread correctly
- ✅ Email notifications sent

**What to Check:**
- Ticket creation form validation
- Ticket list displays correctly
- Status/priority dropdowns work
- Message thread displays correctly
- Email notifications received

---

#### Test 4.4: Webhook Configuration

**Steps:**
1. Navigate to Settings
2. Click "Webhooks" navigation card
   - OR go to `/settings/webhooks`
3. Add webhook:
   - URL: `https://webhook.site/your-unique-id`
   - Select events:
     - `ORDER_STATUS`
     - `ESIM_STATUS`
     - `DATA_USAGE`
   - Click "Save Webhook"
4. Test webhook:
   - Click "Test Webhook" button
   - Check webhook.site for received webhook
5. View webhook logs:
   - Check delivery status
   - View request/response
6. Delete webhook:
   - Click delete button
   - Confirm deletion

**Expected Results:**
- ✅ Webhook created
- ✅ Test webhook sends correctly
- ✅ Webhook received at URL
- ✅ Delivery logs display
- ✅ Webhook deleted

**What to Check:**
- Webhook URL validation
- Event selection works
- Test webhook sends payload
- Logs show delivery status
- Delete confirmation works

---

#### Test 4.5: Email Template Customization

**Steps:**
1. Navigate to Settings
2. Click "Email Templates" navigation card
   - OR go to `/settings/email-templates`
3. Select template: `Order Confirmation`
4. Edit template:
   - Subject: `Your Order #{{orderNumber}}`
   - HTML Body: Customize with variables
5. Click "Preview" button
6. Verify preview shows rendered template
7. Click "Save Template"
8. Trigger email (make a purchase)
9. Verify custom template used

**Expected Results:**
- ✅ Template list loads
- ✅ Template editor works
- ✅ Preview shows rendered template
- ✅ Variables replaced correctly
- ✅ Template saves
- ✅ Custom template used in emails

**What to Check:**
- Template editor is usable
- Preview matches final email
- Variables work correctly
- Save confirmation
- Email uses custom template

---

#### Test 4.6: Billing & Subscriptions

**Steps:**
1. Navigate to Settings
2. Click "Billing" navigation card
   - OR go to `/settings/billing`
3. View current plan:
   - Plan name
   - Billing period
   - Next billing date
4. View invoice history:
   - List of invoices
   - Download invoice (if available)
5. Test upgrade:
   - Click "Upgrade" button
   - Select higher plan
   - Complete payment
6. Test cancel:
   - Click "Cancel Subscription"
   - Confirm cancellation

**Expected Results:**
- ✅ Current plan displays
- ✅ Invoice history shows
- ✅ Upgrade works
- ✅ Cancel works
- ✅ Stripe subscription created/updated

**What to Check:**
- Plan information is accurate
- Invoices display correctly
- Upgrade flow works
- Cancel confirmation
- Stripe dashboard shows subscription

---

#### Test 4.7: Affiliate System

**Steps:**
1. Navigate to Dashboard
2. Click "Affiliates" card in Quick Actions
   - OR go to `/dashboard/affiliates`
3. View affiliate information:
   - Affiliate code
   - Referral code
   - Referral link
4. Copy referral link
5. Use referral link to sign up new merchant
6. Make a purchase from referred merchant's store
7. Check commissions:
   - Commission created
   - Commission amount correct (10%)
   - Commission history shows

**Expected Results:**
- ✅ Affiliate code generated
- ✅ Referral code generated
- ✅ Referral link works
- ✅ Commissions created on orders
- ✅ Commission stats display
- ✅ Commission history shows

**What to Check:**
- Codes are unique
- Referral link tracks correctly
- Commissions calculate correctly
- Stats update in real-time
- History displays correctly

---

### PHASE 5: Customer Account Features

#### Test 5.1: Customer Registration

**Steps:**
1. Navigate to `/customer/signup`
2. Fill registration form:
   - Email: `customer@example.com`
   - Password: `CustomerPass123!`
   - Name: `John Customer`
3. Click "Create Account"
4. Verify account created
5. Check email for verification

**Expected Results:**
- ✅ Customer account created
- ✅ Email verification sent
- ✅ Account saved to database

---

#### Test 5.2: Customer Login & Dashboard

**Steps:**
1. Navigate to `/customer/login`
2. Login with customer credentials
3. Navigate to `/customer/dashboard`
4. View customer dashboard:
   - Profile information
   - Order history
   - Active eSIMs
5. Update profile:
   - Change name
   - Update email
   - Save changes
6. View order history:
   - List of orders
   - Order details
   - QR codes for completed orders

**Expected Results:**
- ✅ Customer login works
- ✅ Dashboard loads
- ✅ Profile updates work
- ✅ Order history displays
- ✅ Orders linked to customer

**What to Check:**
- Customer authentication works
- Dashboard shows correct data
- Profile form validation
- Order history is accurate

---

### PHASE 6: API Features (Advanced Way)

#### Test 6.1: API Key Management

**Steps:**
1. Login as merchant (Advanced Way)
2. Navigate to Settings
3. Go to API Keys section
4. Create API key:
   - Name: `Test API Key`
   - Rate Limit: `100`
   - Click "Create"
5. Copy API key (shown only once)
6. List API keys:
   - Verify key appears in list
   - Key prefix shown (not full key)
7. Revoke API key:
   - Click "Revoke"
   - Confirm revocation
   - Verify key removed

**Expected Results:**
- ✅ API key created
- ✅ Key displayed once
- ✅ Key list shows keys
- ✅ Key revocation works

**What to Check:**
- Key is unique
- Key prefix displays correctly
- Revocation removes key
- Revoked key cannot be used

---

#### Test 6.2: API Usage

**Steps:**
1. Use API key from previous test
2. Test package query:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/packages?locationCode=JP&type=BASE" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
3. Test balance query:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/balance" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
4. Test order creation:
   ```bash
   curl -X POST "http://localhost:3000/api/v1/orders" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "transactionId": "test_123",
       "packageInfoList": [{
         "slug": "JP_1_7",
         "count": 1,
         "price": 10000
       }]
     }'
   ```

**Expected Results:**
- ✅ API key authentication works
- ✅ Package query returns packages
- ✅ Balance query returns balance
- ✅ Order creation works

**What to Check:**
- Authentication required
- Rate limiting works
- Error messages are clear
- Response format is correct

---

#### Test 6.3: Package Browser (Advanced Way Dashboard)

**Steps:**
1. Login as merchant (Advanced Way)
2. Navigate to Dashboard
3. Click "eSIM Plans" card in Quick Actions
   - OR go to `/dashboard/packages`
4. Verify page loads:
   - **Table view** with sortable columns: Name (with flag), Price, Data, Duration, Per GB, Sug. Retail, Speed, Region, Action
   - **Credits Left** balance displayed in header
   - **CSV Export** button visible
5. Test sorting:
   - Click "Name" column header - verify sorting
   - Click "Price" column header - verify sorting
   - Click "Data" column header - verify sorting
   - Click "Duration" column header - verify sorting
6. Test filters:
   - Enter "Japan" in Region filter
   - Enter "5GB" in Name filter
   - Enter "7" in Duration filter
   - Select "Data in Total" from Data type dropdown
   - Click "BASE" type button
   - Click "Search"
   - Verify results filter correctly
7. Test **Plan Detail Modal**:
   - Click on any package row
   - Verify modal opens with full plan details:
     - Name, Code, Slug, Data, Duration, Price, Billing starts, Region type, Region, Top up type, Breakout IP, Validity
     - Coverage section with country list and search
   - Test "Add to cart" button in modal
8. Test **Cart System**:
   - Click "Add" button on multiple packages
   - Verify cart count and total update in header
   - Verify "Check out" button appears
   - Click "Check out" - verify navigates to Create Order with first package pre-filled
9. Test **CSV Export**:
   - Click "CSV" button
   - Verify CSV file downloads with all package data

**Expected Results:**
- ✅ Package Browser loads as sortable table
- ✅ All columns display correctly
- ✅ Sorting works on all sortable columns
- ✅ Filters work independently and together
- ✅ Plan Detail Modal shows complete information
- ✅ Cart system tracks selected packages
- ✅ CSV export downloads correctly
- ✅ Credits Left balance displays
- ✅ Checkout navigates correctly

**What to Check:**
- Packages load from eSIM Access API
- Table is responsive and scrollable
- Sort indicators show current sort direction
- Modal closes on outside click
- Cart persists during session
- CSV contains all filtered packages

---

#### Test 6.4: Create Order (Advanced Way Dashboard)

**Steps:**
1. Navigate to `/dashboard/create-order`
   - OR click "Create Order" from Package Browser
2. If coming from Package Browser, verify package slug is pre-filled
3. If manual entry:
   - Enter package slug: `JP_1_7` (or any valid slug)
   - Click "Lookup" button
   - Verify package info displays:
     - Package name
     - Data amount
     - Validity period
     - Price per eSIM
4. Set quantity:
   - Use +/- buttons or enter number
   - Verify total cost updates
5. Check balance:
   - Verify current balance displayed at top
   - If insufficient balance, verify warning message
   - Click "Add Funds" if needed
6. Place order:
   - Click "Place Order" button
   - Wait for processing
7. Verify order result:
   - Order number displayed
   - eSIM profiles listed (if available)
   - QR codes shown (if available)
   - "View Profiles" button works

**Expected Results:**
- ✅ Package lookup works
- ✅ Package info displays correctly
- ✅ Quantity selector works
- ✅ Total cost calculates correctly
- ✅ Balance check works
- ✅ Order creation succeeds
- ✅ Order result displays with profiles/QR codes

**What to Check:**
- Package lookup from API
- Price calculations are correct
- Balance validation works
- Order creation via API
- Error handling for invalid slugs
- Loading states during order processing

---

#### Test 6.5: Profile Management (Advanced Way Dashboard)

**Steps:**
1. Navigate to `/dashboard/profiles`
   - OR click "My eSIM" card in Quick Actions
2. Verify profile list loads:
   - All eSIM profiles displayed in **table** with columns:
     - **Plan name** (with country flag emoji)
     - **eSIM status** (badge)
     - **Device** (brand/model)
     - **Data left** (% with progress bar)
     - **Time left** (days)
     - **Activated before** (date)
     - **eSIM Tran No** (clickable link)
     - **smdp status** (badge)
     - **Action** (icons)
3. Test **expanded filters**:
   - Enter eSIM Tran No in filter
   - Enter Plan name in filter
   - Select eSIM status from dropdown (ALL, NEW, IN_USE, ACTIVE, EXPIRED, CANCELLED, SUSPENDED)
   - Select smdp status from dropdown (ALL, AVAILABLE, ENABLED, DISABLED, DELETED, INSTALLATION)
   - Enter Order No (Batch ID) in filter
   - Enter ICCID in filter
   - Click "Search"
   - Verify all filters apply correctly
   - Click "Reset" - verify filters clear
4. Test **eSIM Detail Modal** (click on any profile row):
   - Verify **right-side slide-in panel** opens
   - Test **Profile Tab**:
     - Verify displays: eSIM Tran No, Order No, Create/Activate/Download/Update times, Merchant Transaction ID, eSIM status, ICCID, smdp status, IMSI
     - Verify **eSIM Install section** shows: Activation Code String, SM-DP+ Address, Activation code, QR code URL, Short URL, **QR code image**, iOS Universal Link, Android Universal Link
     - Test copy buttons for all fields
   - Test **Data Plan Tab**:
     - Verify Time left and Data left progress bars
     - Verify displays: Total amount, Billing starts, Region type, Region, Data type, Top-up type, Breakout IP, APN
     - Verify Basic Plan section: Name, Slug, Code, Price
   - Test **Coverage Tab**:
     - Verify coverage list with countries
     - Test country search filter
   - Test **Action Tab**:
     - Edit nickname - enter and save
     - Test "Email QR Code to User" button
     - Test **TOP UP** - enter package slug and top up
     - Test **SUSPEND** button (if active)
     - Test **UNSUSPEND** button (if suspended)
     - Test **REVOKE** button
     - Test **CANCEL** button
5. Test table actions:
   - Click QR code icon - opens detail modal
   - Click suspend/unsuspend icon - verify status updates
   - Click revoke icon - verify profile revoked
6. Test pagination:
   - Click page numbers
   - Click "Next" and "Prev" buttons
   - Enter page number in "Go to" input

**Expected Results:**
- ✅ Profile list loads with all new columns
- ✅ All 6 filters work correctly
- ✅ eSIM Detail Modal opens on row click
- ✅ All 4 tabs display correct information
- ✅ QR code image displays in Profile tab
- ✅ Progress bars show accurate data/time remaining
- ✅ All action buttons work (nickname, email, top-up, suspend, revoke, cancel)
- ✅ Copy buttons work for all fields
- ✅ Pagination works correctly

**What to Check:**
- Profiles load from API
- Status badges are color-coded correctly
- Data left progress bar shows accurate percentage
- Modal slides in smoothly from right
- Tabs switch correctly
- Coverage search filters countries
- Action tab operations update profile status
- Error handling for failed actions

---

#### Test 6.6: Balance & Top-up (Advanced Way Dashboard)

**Steps:**
1. Navigate to `/dashboard/balance`
   - OR click "Billing" card in Quick Actions
2. Verify balance display:
   - Current balance shown in large card with wallet icon
   - Balance amount is accurate
   - "Top up" button visible
3. Test **Transaction Filters**:
   - Enter Transaction ID in filter
   - Select Transaction Type: "Incoming" or "Outgoing"
   - Select Activities: "Base Plan Purchase", "Top-up Plan Purchase", "Base Plan Refund", "Online Top-up balance"
   - Set date range (Start date to End date)
   - Click "Search"
   - Verify transactions filter correctly
   - Click "Reset" - verify filters clear
4. View **Transactions Tab**:
   - Table shows columns: **Transaction Id**, **Amount** (color-coded: green + for incoming, red - for outgoing), **Transaction Type**, **Balance** (running balance after each transaction), **Time**, **Activities**, **Remark**
   - Verify amounts are color-coded correctly
   - Verify running balance column shows balance after each transaction
5. Test **Statements Tab**:
   - Click "Statements" tab
   - Verify tab switches
   - (Statements will appear once monthly statements are generated)
6. Test "Top up" button:
   - Click "Top up" button
   - Modal opens
7. Test quick select amounts:
   - Click preset amounts: $10, $25, $50, $100, $250, $500
   - Verify amount fills in input
8. Test custom amount:
   - Enter custom amount: `75.50`
   - Verify input accepts decimals
   - Test minimum validation (try $0.50 - should show error)
9. Complete top-up:
   - Click "Add $XX.XX" button
   - Wait for processing
   - Verify success message with checkmark
   - Verify balance updates
   - Verify transaction appears in history with correct activity type
10. Test pagination:
    - Click "Next" to see more transactions
    - Click "Prev" to go back
    - Enter page number in "Go to" input

**Expected Results:**
- ✅ Balance displays correctly
- ✅ All transaction filters work
- ✅ Transactions tab shows all columns including running balance
- ✅ Amounts are color-coded (green +, red -)
- ✅ Activities column shows correct activity type
- ✅ Remark column displays transaction notes
- ✅ Statements tab exists and switches correctly
- ✅ Quick select amounts work
- ✅ Custom amount input works with validation
- ✅ Top-up processes successfully
- ✅ Balance updates after top-up
- ✅ Transaction recorded with correct activity type
- ✅ Pagination works

**What to Check:**
- Balance matches API response
- Running balance calculates correctly
- Transaction types are color-coded correctly
- Filters work independently and together
- Top-up modal works smoothly
- Amount validation (minimum $1.00)
- Success/error messages display
- Balance refreshes after top-up
- Transaction history is accurate

---

#### Test 6.7: Order History (My Order Page)

**Steps:**
1. Navigate to `/dashboard/orders`
   - OR click "My Order" card in Quick Actions
2. Verify page loads:
   - Header shows "My Order" title
   - Filters section visible
3. Test **filters**:
   - Enter Order No (Batch Id) in filter
   - Set Purchase Date range:
     - Select Start date
     - Select End date
   - Click "Search"
   - Verify orders filter correctly
   - Click "Reset" - verify filters clear
4. View order table:
   - Columns: **Order No (Batch Id)** (clickable link), **No. of eSIMs**, **Create time**, **Amount**, **Status** (badge)
   - Verify all columns display correctly
5. Test **Order Detail Modal**:
   - Click on any Order No
   - Verify modal opens showing:
     - Order summary cards: Status, Amount, No. of eSIMs, Create time
     - **eSIM Profiles section** listing all profiles in the order:
       - ICCID (with copy button)
       - eSIM Tran No
       - QR code image (if available)
       - Activation code (with copy button)
   - Test copy buttons for ICCID and activation code
   - Close modal
6. Test pagination:
   - Click page numbers
   - Click "Next" and "Prev" buttons
   - Enter page number in "Go to" input

**Expected Results:**
- ✅ Order History page loads
- ✅ Filters work correctly (Order No, date range)
- ✅ Table displays all orders with correct columns
- ✅ Order No is clickable
- ✅ Order Detail Modal opens on click
- ✅ Modal shows complete order information
- ✅ eSIM profiles listed with QR codes
- ✅ Copy buttons work
- ✅ Pagination works

**What to Check:**
- Orders load from API
- Date range filter works correctly
- Status badges are color-coded
- Modal displays all profile details
- QR codes are scannable
- Copy functionality works
- Empty state shows when no orders

---

#### Test 6.8: Payment Settings

**Steps:**
1. Navigate to `/dashboard/payment-settings`
   - OR click "Payment" card in Quick Actions
2. Verify page loads:
   - Header shows "Payment Settings" title
   - "Redeem Coupon" button in header
3. Test **Saved Payment Card** section:
   - View saved cards (if any):
     - Card brand logo/badge (Visa, Mastercard, etc.)
     - Masked number: `•••• 7633`
     - Expiry date: `MM/YY`
     - Delete button
   - Test delete card:
     - Click delete icon
     - Confirm deletion
     - Verify card removed
   - If no cards: verify empty state message
4. Test **Redeem Coupon**:
   - Click "Redeem Coupon" button in header
   - Modal opens
   - Enter coupon code
   - Click "Redeem"
   - Verify success/error message
5. Test **Billing Details** section:
   - View current billing details:
     - Company name
     - VAT number
     - Billing country
     - Billing address
     - Contact Person
     - Tel
     - Billing contact email
   - Click "Edit" button
   - Verify form becomes editable
   - Update fields:
     - Company name
     - VAT number
     - Select Billing country from dropdown
     - Billing address
     - Contact Person
     - Tel
     - Billing contact email
   - Click "Save"
   - Verify changes saved
   - Click "Cancel" - verify form reverts

**Expected Results:**
- ✅ Payment Settings page loads
- ✅ Saved cards display correctly with brand logos
- ✅ Card deletion works
- ✅ Redeem Coupon modal opens and works
- ✅ Billing Details section displays current info
- ✅ Edit mode works correctly
- ✅ All fields are editable
- ✅ Save updates billing details
- ✅ Cancel reverts changes

**What to Check:**
- Card brand logos display correctly
- Masked numbers are properly formatted
- Country dropdown has all options
- Form validation works
- Save confirmation appears
- Error handling for invalid coupon codes
- Empty states display correctly

---

#### Test 6.9: Developer Page

**Steps:**
1. Navigate to `/dashboard/developer`
   - OR click "Developer" card in Quick Actions
2. Verify page loads:
   - Header shows "Developer" title
   - "API Docs" button in header
3. Test **API Keys** section:
   - View API keys table:
     - Columns: **Name**, **Token** (masked), **Create Time**, **Actions**
   - Test **Show/Hide Token**:
     - Click eye icon on a token
     - Verify token reveals (full token shown)
     - Click eye-off icon
     - Verify token masks again
   - Test **Copy Token**:
     - Click copy icon
     - Verify token copied to clipboard
     - Verify checkmark appears briefly
   - Test **Revoke Key**:
     - Click X icon
     - Confirm revocation
     - Verify key removed from list
   - Test **Create New Key**:
     - Click "New Key" button
     - Enter key name (e.g., "Production Key")
     - Click "Create"
     - Verify new key appears in list
     - Verify token is visible (shown only once)
   - Test **Roll Keys**:
     - Click "Roll Keys" button
     - Confirm regeneration
     - Verify all keys revoked and new default key created
4. Test **Webhooks** section:
   - View webhook URL input field
   - If webhook exists: verify URL displayed
   - Click "Edit" button
   - Enter/update webhook URL: `https://your-server.com/webhook`
   - Click "Save"
   - Verify webhook saved
   - Click "Cancel" - verify reverts
5. Test **API Docs** link:
   - Click "API Docs" button in header
   - OR click "View Docs" button in API Documentation card
   - Verify navigates to `/api-docs` page

**Expected Results:**
- ✅ Developer page loads
- ✅ API Keys table displays all keys
- ✅ Show/hide token toggle works
- ✅ Copy token works
- ✅ Revoke key works
- ✅ Create new key works
- ✅ Roll Keys regenerates all keys
- ✅ Webhook URL can be edited and saved
- ✅ API Docs link navigates correctly

**What to Check:**
- Tokens are properly masked when hidden
- Copy functionality works across browsers
- Confirmation dialogs appear for destructive actions
- New keys are immediately usable
- Webhook URL validation works
- Error handling for invalid URLs
- API Documentation page loads correctly

---

#### Test 6.10: Dashboard Enhancements (Advanced Way)

**Steps:**
1. Login as merchant (Advanced Way)
2. Navigate to `/dashboard`
3. Verify **Announcements** section (at top):
   - Section header: "Updates"
   - List of announcements with:
     - Date
     - Title
     - Description
   - Verify announcements are readable
4. Verify **eSIM Metrics Cards** (replaces generic stats):
   - **Total Orders** card:
     - Shows total order count
     - Shows cancelled count below (e.g., "5 Cancelled")
   - **Activated Orders** card:
     - Shows activated order count
   - **Base Orders** card:
     - Shows base plan order count
   - **Top-up Orders** card:
     - Shows top-up order count
5. Verify **Charts Section**:
   - **Purchase Overview** chart:
     - Title: "Purchase Overview"
     - Subtitle: "eSIMs purchased"
     - Time range buttons: "Last 7", "Last 15", "Last 30"
     - Sparkline chart showing purchase trend
     - Total count displayed
     - Test time range toggle - verify chart updates
   - **Active eSIM Overview** chart:
     - Title: "Active eSIM Overview"
     - Subtitle: "eSIMs activated"
     - Time range buttons: "Last 7", "Last 15", "Last 30"
     - Sparkline chart showing activation trend
     - Total count displayed
     - Test time range toggle - verify chart updates
6. Verify **Quick Actions** updated:
   - Should show 10 cards including:
     - eSIM Plans
     - My eSIM
     - My Order (new)
     - Billing
     - Payment (new)
     - Developer (new)
     - Create Order
     - Analytics
     - Support
     - Affiliates
7. Test navigation from Quick Actions:
   - Click each new card
   - Verify navigates to correct page

**Expected Results:**
- ✅ Announcements section displays at top
- ✅ eSIM-specific metrics cards show correct data
- ✅ Purchase Overview chart displays and updates
- ✅ Active eSIM Overview chart displays and updates
- ✅ Time range toggles work on both charts
- ✅ Quick Actions include all 10 pages
- ✅ All navigation links work correctly

**What to Check:**
- Announcements are formatted correctly
- Metrics match actual order data
- Charts render smoothly
- Time range changes update chart data
- Sparkline charts show trend lines
- Quick Actions cards are properly styled
- Navigation works from all cards
- Dashboard only shows Advanced Way features for Advanced users

---

## 🐛 Common Issues & Solutions

### Issue: Payment webhooks not working
**Solution:** Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### Issue: Email not sending
**Solution:** 
- Check `RESEND_API_KEY` is set and valid
- Check `RESEND_FROM_EMAIL` is verified domain
- Check Resend dashboard for delivery status

### Issue: Currency conversion not working
**Solution:** Exchange rates are static (mock). In production, integrate live API (e.g., ExchangeRate-API).

### Issue: Affiliate commissions not created
**Solution:** Ensure merchant has `referredBy` set when making purchases.

### Issue: Store not appearing
**Solution:**
- Check database: `npx prisma studio`
- Verify store ID in localStorage
- Check store `active` status

### Issue: Packages not loading
**Solution:**
- Verify eSIM Access API credentials
- Check API connection: `backend/test-esim-access.ps1`
- Verify packages exist in eSIM Access catalog

---

## ✅ Testing Checklist Summary

### Critical (Must Test)
- [ ] Merchant registration & login
- [ ] Service type selection (Easy Way vs Advanced Way)
- [ ] Store creation (onboarding - Easy Way)
- [ ] Subscription creation (onboarding - Easy Way)
- [ ] Dashboard Quick Actions (service-type aware)
- [ ] Package selection (Easy Way)
- [ ] Payment processing (Stripe)
- [ ] Order creation
- [ ] eSIM delivery (email with QR codes)
- [ ] Order tracking

### Important (Should Test)
- [ ] Customer accounts
- [ ] Dashboard & analytics
- [ ] Support tickets
- [ ] Webhooks
- [ ] Billing/subscriptions
- [ ] Email templates
- [ ] **Advanced Way: Package Browser** (table view, cart, CSV export, plan detail modal)
- [ ] **Advanced Way: Create Order (Dashboard)**
- [ ] **Advanced Way: Profile Management** (enhanced table, 4-tab detail modal, expanded filters)
- [ ] **Advanced Way: Balance & Top-up** (filters, running balance, activities, statements tab)
- [ ] **Advanced Way: Order History** (My Order page with filters and detail modal)
- [ ] **Advanced Way: Payment Settings** (saved cards, redeem coupon, billing details)
- [ ] **Advanced Way: Developer** (API keys, webhooks, roll keys)
- [ ] **Advanced Way: Dashboard** (announcements, eSIM metrics, charts)

### Nice to Have (Enhancements)
- [ ] Multi-currency
- [ ] SEO tools
- [ ] Domain verification
- [ ] Affiliate system
- [ ] API key management
- [ ] **Advanced Way: API usage testing**

---

## 📊 Test Results Template

After testing, document results:

```
Date: ___________
Tester: ___________

### Phase 1: Merchant Setup
- Registration: [ ] Pass [ ] Fail - Notes: ___________
- Login: [ ] Pass [ ] Fail - Notes: ___________
- Onboarding: [ ] Pass [ ] Fail - Notes: ___________

### Phase 2: Store Management
- Package Selection: [ ] Pass [ ] Fail - Notes: ___________
- Pricing Config: [ ] Pass [ ] Fail - Notes: ___________
- Currency Settings: [ ] Pass [ ] Fail - Notes: ___________

### Phase 3: Customer Purchase
- Demo Store: [ ] Pass [ ] Fail - Notes: ___________
- Checkout: [ ] Pass [ ] Fail - Notes: ___________
- Order Processing: [ ] Pass [ ] Fail - Notes: ___________

### Phase 4: Dashboard Features
- Analytics: [ ] Pass [ ] Fail - Notes: ___________
- Support Tickets: [ ] Pass [ ] Fail - Notes: ___________
- Webhooks: [ ] Pass [ ] Fail - Notes: ___________

### Phase 6: Advanced Way Features
- Package Browser (table, cart, CSV): [ ] Pass [ ] Fail - Notes: ___________
- Profile Management (detail modal, filters): [ ] Pass [ ] Fail - Notes: ___________
- Order History: [ ] Pass [ ] Fail - Notes: ___________
- Balance (filters, running balance, statements): [ ] Pass [ ] Fail - Notes: ___________
- Payment Settings: [ ] Pass [ ] Fail - Notes: ___________
- Developer (API keys, webhooks): [ ] Pass [ ] Fail - Notes: ___________
- Dashboard (announcements, charts, metrics): [ ] Pass [ ] Fail - Notes: ___________

### Issues Found:
1. ___________
2. ___________
3. ___________

### Overall Status:
[ ] Ready for Production
[ ] Needs Fixes (see issues above)
[ ] Major Issues Found
```

---

## 🚀 Quick Test Flow (30 Minutes)

### For Easy Way Merchants:

1. **Register & Login** (2 min)
2. **Complete Onboarding** (5 min)
   - Select "Easy Way"
   - Fill business info, branding, provider, payment
   - Launch store
3. **Select Packages** (3 min)
4. **Make Test Purchase** (5 min)
   - Use test card: `4242 4242 4242 4242`
5. **Check Email** (2 min)
   - Order confirmation
   - eSIM delivery with QR codes
6. **Track Order** (2 min)
7. **View Dashboard** (3 min)
   - Check analytics
   - View orders
   - Verify Easy Way Quick Actions
8. **Test Support Ticket** (3 min)
9. **Test Webhook** (2 min)
10. **Verify Settings** (3 min)

**Total: ~30 minutes for Easy Way critical path**

### For Advanced Way Merchants:

1. **Register & Login** (2 min)
   - Select "Advanced Way" during registration
2. **View Dashboard** (3 min)
   - Check announcements section
   - Verify eSIM metrics cards (Total/Activated/Base/Topup Orders)
   - View Purchase Overview and Active eSIM charts
   - Test time range toggles (7/15/30 days)
   - Verify all 10 Quick Actions visible
3. **Create API Key** (2 min)
   - Go to `/dashboard/developer`
   - Create and copy API key
   - Test show/hide token
4. **View Package Browser** (4 min)
   - Navigate to `/dashboard/packages`
   - Test table sorting
   - Test filters (region, name, duration, type)
   - Open Plan Detail Modal
   - Add packages to cart
   - Test CSV export
5. **Create Order via Dashboard** (5 min)
   - Navigate to `/dashboard/create-order`
   - Select package, set quantity
   - Place order
6. **View Order History** (2 min)
   - Navigate to `/dashboard/orders`
   - Test filters (Order No, date range)
   - Open Order Detail Modal
   - View eSIM profiles with QR codes
7. **View Profiles** (4 min)
   - Navigate to `/dashboard/profiles`
   - Test all 6 filters
   - Open eSIM Detail Modal
   - Test all 4 tabs (Profile, Data Plan, Coverage, Action)
   - Test profile actions (suspend, top-up, etc.)
8. **Top-up Balance** (3 min)
   - Navigate to `/dashboard/balance`
   - Test transaction filters
   - Test Statements tab
   - Add funds via Stripe
   - Verify running balance column
9. **Payment Settings** (2 min)
   - Navigate to `/dashboard/payment-settings`
   - View saved cards
   - Test Redeem Coupon
   - Edit billing details
10. **Test API Usage** (5 min)
    - Use API key to query packages
    - Create order via API
    - Query balance via API

**Total: ~32 minutes for Advanced Way critical path**

---

**Last Updated:** January 2025
**Version:** 2.0.0

**What's New in v2.0:**
- ✅ Enhanced Package Browser with table view, cart system, CSV export, and plan detail modal
- ✅ Enhanced Profile Management with 4-tab detail modal, expanded filters, and new columns
- ✅ New Order History page with filters and order detail modal
- ✅ Enhanced Balance page with transaction filters, running balance, activities column, and statements tab
- ✅ New Payment Settings page with saved cards, coupon redemption, and billing details
- ✅ New Developer page with API keys management, webhooks, and roll keys
- ✅ Enhanced Dashboard for Advanced Way with announcements, eSIM metrics, and charts

