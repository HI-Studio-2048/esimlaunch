# Template-Dashboard Wiring Fixes (Issues 95-101)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 data flow issues between the esimlaunch-template stores, main backend, and merchant dashboard so that both Easy Way and Advanced Way merchants see complete, accurate data.

**Architecture:** The main backend is the hub. Templates push data via `/api/integration/*` endpoints (secret-authenticated). The dashboard reads from the main backend's DB. Analytics services need to query both `Order` (Advanced) and `CustomerOrder` (Easy Way) tables. Template eSIM profiles need a new sync endpoint.

**Tech Stack:** Express.js (backend), NestJS (template), Prisma/PostgreSQL, TypeScript

---

### Task 1: Fix Analytics for Advanced Way Merchants (Issue 95)

**Files:**
- Modify: `backend/src/services/analyticsService.ts`

The `analyticsService` only queries `CustomerOrder`. Advanced Way merchants use the `Order` table. We need to query both and merge results.

- [ ] **Step 1: Update `getRevenueAnalytics` to include `Order` table**

In `backend/src/services/analyticsService.ts`, the method queries only `prisma.customerOrder`. Add a parallel query for `prisma.order` (Advanced Way) and merge the results. `Order.totalAmount` is in 1/10000 USD; `CustomerOrder.totalAmount` is in cents. Both must be converted to cents for consistency.

- [ ] **Step 2: Update `getOrderAnalytics` to include `Order` table**

Same pattern — query both tables and merge status breakdowns.

- [ ] **Step 3: Update `getCustomerAnalytics` to include `Order` table**

Advanced Way orders don't have `customerEmail`, so customer analytics should still work from `CustomerOrder` only. But total order counts should include both. No change needed here — Advanced users don't have customer-facing stores.

- [ ] **Step 4: Update `getDashboardSummary` to include both**

Since it delegates to `getRevenueAnalytics` and `getOrderAnalytics`, fixing those fixes this automatically.

- [ ] **Step 5: Verify `/api/dashboard/analytics` endpoint consistency (Issue 96)**

The legacy endpoint in `dashboard.ts:224-298` queries `Order` only (for Advanced). Since the Analytics page uses the new `/api/analytics/*` endpoints, mark issue 96 as resolved-by-95 — the legacy endpoint is only used for Dashboard home mini-charts which correctly show `Order` data for Advanced merchants.

---

### Task 2: Fix Template Order Sync Status (Issue 97)

**Files:**
- Modify: `esimlaunch-template/apps/backend/src/modules/orders/orders.service.ts`
- Modify: `backend/src/routes/integration.ts`

Template currently syncs order with `status: 'COMPLETED'` immediately. Instead, sync with initial status and add a follow-up sync after provisioning completes or fails.

- [ ] **Step 1: Change initial sync to send `PROCESSING` status**

In `syncOrderToMainBackend()`, change hardcoded `'COMPLETED'` to `'PROCESSING'`.

- [ ] **Step 2: Add status update sync method**

Add `updateOrderStatusOnMainBackend()` that PATCHes or POSTs a status update to the integration endpoint.

- [ ] **Step 3: Add integration endpoint for status updates**

In `backend/src/routes/integration.ts`, add `PATCH /api/integration/template-order` that updates `CustomerOrder.status` by dedup ID.

- [ ] **Step 4: Call status update after provisioning succeeds/fails**

In `performEsimOrder()`, after marking order as `esim_created` or `esim_order_failed`, call the status update sync.

---

### Task 3: Add Retry to Template Order Sync (Issue 98)

**Files:**
- Modify: `esimlaunch-template/apps/backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Add retry helper with exponential backoff**

Add a `syncWithRetry()` wrapper that retries up to 3 times (2s, 6s, 18s delays) on failure.

- [ ] **Step 2: Use retry wrapper in `syncOrderToMainBackend`**

Replace the bare `fetch()` call with the retry wrapper.

- [ ] **Step 3: Use retry wrapper in `updateOrderStatusOnMainBackend`**

Same pattern for the new status update sync.

---

### Task 4: Sync eSIM Profiles from Template to Dashboard (Issue 99)

**Files:**
- Modify: `backend/src/routes/integration.ts`
- Modify: `esimlaunch-template/apps/backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Add `POST /api/integration/esim-profile` endpoint**

New integration endpoint that upserts an `EsimProfile` record in the main backend. Requires `storeId`, `esimTranNo`, and basic profile fields. Resolves `merchantId` from store. Uses dedup on `esimTranNo`.

- [ ] **Step 2: Add `syncEsimProfileToMainBackend()` in template**

After successful eSIM provisioning in `performEsimOrder()`, POST profile data (iccid, esimTranNo, qrCodeUrl, ac, esimStatus, packageCode) to the new endpoint. Include the `templateOrderId` so the main backend can link it to the `CustomerOrder`.

- [ ] **Step 3: Link EsimProfile to CustomerOrder in main backend**

In the integration endpoint, after upserting the profile, find the `CustomerOrder` by dedup ID `template_{storeId}_{templateOrderId}` and if it has an `orderId`, set `EsimProfile.orderId` to that. If not, create a lightweight `Order` record to bridge the link.

---

### Task 5: Fix Template Ticket Creation Route (Issue 100)

**Files:**
- Modify: `esimlaunch-template/apps/backend/src/modules/support/support.service.ts`

- [ ] **Step 1: Create ticket via integration route instead of public route**

Change `createTicketViaHub()` to POST to `/api/integration/support/tickets` with `x-template-sync-secret` header instead of `/api/support/tickets`.

- [ ] **Step 2: Add `POST /api/integration/support/tickets` endpoint**

In `backend/src/routes/integration.ts`, add the endpoint that creates a ticket via `supportService.createTicket()` with proper secret auth.

---

### Task 6: Document Template Affiliate Non-Sync (Issue 101)

**Files:**
- Modify: `ISSUES.md`

- [ ] **Step 1: Mark as won't-fix with explanation**

Template affiliates are customer-to-customer referrals within a single store. They don't need to sync to the merchant's dashboard because the merchant's affiliate program (referring other merchants) is separate. Mark as `[-]`.

---

### Execution Order

Tasks 1-5 are code changes. Task 6 is documentation only. Tasks are independent and can be parallelized.
