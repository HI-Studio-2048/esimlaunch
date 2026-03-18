# Critical Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 11 critical security issues from ISSUES.md (items 1-11) to make the platform safe for production use.

**Architecture:** Each task targets a specific vulnerability. Backend fixes (1-7) touch the Express API. Template fixes (8-11) touch the NestJS template.

**Dependencies:** Task 6 (raw body) MUST be done before Task 3 (Clerk webhook), since Task 3 needs `req.rawBody`. Task 9 (template guard) should be done before Task 10 (order auth), since Task 10's auth relies on the guard. All other tasks are independent.

**Recommended order:** 6 → 3 → 7 → 5 → 1 → 2 → 4 → 8 → 9 → 10 → 11

**Tech Stack:** Express.js, Prisma, Stripe, Clerk (`@clerk/clerk-sdk-node`), `svix` (for webhook verification), `jsonwebtoken`, `express-rate-limit`

---

### Task 1: Secure customer order endpoints with signed tokens (Issue #1)

**Files:**
- Modify: `backend/src/routes/customerOrders.ts` (full rewrite of auth logic)
- Modify: `backend/src/services/customerOrderService.ts` (add token generation/verification)
- Modify: `backend/src/services/emailService.ts` (include token in order emails)
- Modify: `esim-connect-hub/src/pages/OrderTracking.tsx` (update to use tokens, remove email search)
- Modify: `esim-connect-hub/src/lib/api.ts:941-957` (update customer order API methods)

**Context:** Currently `GET /:orderId`, `GET ?email=`, and `POST /:orderId/resend-email` have zero auth. Anyone who guesses a UUID gets eSIM activation codes. We'll use signed JWT tokens (short-lived, scoped to orderId+email) that are included in order confirmation emails.

- [ ] **Step 1: Add token utility functions to customerOrderService.ts**

Add at the top of `customerOrderService.ts`, after imports:

```typescript
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const ORDER_TOKEN_SECRET = env.jwtSecret; // reuse JWT secret
const ORDER_TOKEN_EXPIRY = '7d'; // 7 days to view order

export function generateOrderToken(orderId: string, email: string): string {
  return jwt.sign({ orderId, email, type: 'order_access' }, ORDER_TOKEN_SECRET, {
    expiresIn: ORDER_TOKEN_EXPIRY,
  });
}

export function verifyOrderToken(token: string): { orderId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, ORDER_TOKEN_SECRET) as any;
    if (decoded.type !== 'order_access') return null;
    return { orderId: decoded.orderId, email: decoded.email };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Rewrite customerOrders.ts with token-based auth**

Replace the entire `customerOrders.ts` route file. Key changes:
- `GET /:orderId` requires `?token=` query param, verified via `verifyOrderToken`
- `GET /payment-intent/:paymentIntentId` returns only order status + token (not eSIM data) — the token is what unlocks the full order view
- `GET ?email=` removed entirely (too dangerous)
- `POST /:orderId/resend-email` requires merchant JWT auth via `authenticateSessionOrJWT`

```typescript
import express from 'express';
import { z } from 'zod';
import { customerOrderService, generateOrderToken, verifyOrderToken } from '../services/customerOrderService';
import { webhookService } from '../services/webhookService';
import { esimAccessService } from '../services/esimAccessService';
import { qrCodeService } from '../services/qrCodeService';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';

const router = express.Router();

/**
 * GET /api/customer-orders/payment-intent/:paymentIntentId
 * Returns order status and a signed access token.
 * Called right after payment — the token is used to view full order details.
 */
router.get('/payment-intent/:paymentIntentId', async (req, res) => {
  try {
    const order = await customerOrderService.getByPaymentIntentId(req.params.paymentIntentId);
    if (!order) {
      return res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Order not found' });
    }

    // Generate token — sent via email AND returned here (payment intent IDs
    // are visible in browser network tab, so the token only provides eSIM
    // profile access, not the payment intent lookup itself).
    const token = generateOrderToken(order.id, order.customerEmail);

    // Return basic order info + token. The token unlocks GET /:orderId for full details.
    res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        customerEmail: order.customerEmail,
        totalAmount: Number(order.totalAmount) / 100,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'FETCH_FAILED', errorMessage: error.message || 'Failed to fetch order' });
  }
});

/**
 * GET /api/customer-orders/:orderId?token=...
 * View full order details including eSIM profiles. Requires a valid signed token.
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      return res.status(401).json({ success: false, errorCode: 'TOKEN_REQUIRED', errorMessage: 'Access token is required. Check your order confirmation email.' });
    }

    const claims = verifyOrderToken(token);
    if (!claims || claims.orderId !== req.params.orderId) {
      return res.status(403).json({ success: false, errorCode: 'INVALID_TOKEN', errorMessage: 'Invalid or expired access token.' });
    }

    const order = await customerOrderService.getById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Order not found' });
    }

    // Verify token email matches order email
    if (claims.email.toLowerCase() !== order.customerEmail.toLowerCase()) {
      return res.status(403).json({ success: false, errorCode: 'INVALID_TOKEN', errorMessage: 'Token does not match this order.' });
    }

    // Fetch eSIM profiles if order is completed
    let qrCodes: string[] = [];
    let profiles: any[] = [];

    if (order.status === 'COMPLETED' && order.esimAccessOrderNo) {
      try {
        const profilesResult = await esimAccessService.queryProfiles({ orderNo: order.esimAccessOrderNo });
        if (profilesResult.success && profilesResult.obj?.esimList) {
          profiles = profilesResult.obj.esimList;
          qrCodes = await Promise.all(
            profiles.map(async (profile) =>
              qrCodeService.generateQRCode({
                esimTranNo: profile.esimTranNo,
                iccid: profile.iccid,
                imsi: profile.imsi,
                qrCodeUrl: profile.qrCodeUrl,
              })
            )
          );
        }
      } catch (error) {
        console.error('Error fetching profiles for order:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...order,
        totalAmount: Number(order.totalAmount) / 100,
        qrCodes,
        profiles,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'FETCH_FAILED', errorMessage: error.message || 'Failed to fetch order' });
  }
});

/**
 * POST /api/customer-orders/:orderId/resend-email
 * Resend eSIM delivery email. Requires merchant authentication.
 */
router.post('/:orderId/resend-email', authenticateSessionOrJWT, async (req, res) => {
  try {
    const order = await customerOrderService.getById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Order not found' });
    }

    // Verify merchant owns this order
    const merchantId = (req as any).merchant?.id;
    if (order.merchantId !== merchantId) {
      return res.status(403).json({ success: false, errorCode: 'UNAUTHORIZED', errorMessage: 'You do not own this order' });
    }

    if (!order.orderId) {
      return res.status(400).json({ success: false, errorCode: 'NO_MERCHANT_ORDER', errorMessage: 'Order not yet linked to a merchant order' });
    }

    await webhookService.deliverESIMs(order.orderId);
    res.json({ success: true, message: 'eSIM delivery email has been resent' });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'RESEND_FAILED', errorMessage: error.message || 'Failed to resend email' });
  }
});

export default router;
```

- [ ] **Step 3: Update email service to include access token in order emails**

Find where order confirmation emails are sent (in `customerOrderService.ts` or `emailService.ts`) and include the token as a query parameter in the order tracking URL. The email should link to something like:
`{FRONTEND_URL}/order/{orderId}?token={token}`

- [ ] **Step 4: Update frontend OrderTracking page and API methods**

In `esim-connect-hub/src/lib/api.ts`, update the customer order methods:

```typescript
// Update getCustomerOrder to accept token
async getCustomerOrder(orderId: string, token: string) {
  return this.request<any>(`/api/customer-orders/${orderId}?token=${encodeURIComponent(token)}`);
}

// Remove getCustomerOrdersByEmail entirely (endpoint no longer exists)
// async getCustomerOrdersByEmail — DELETE THIS METHOD

// getCustomerOrderByPaymentIntent now returns { ...order, token }
async getCustomerOrderByPaymentIntent(paymentIntentId: string) {
  return this.request<any>(`/api/customer-orders/payment-intent/${paymentIntentId}`);
}
```

In `esim-connect-hub/src/pages/OrderTracking.tsx`:
- Remove the "Email" search type tab and `getCustomerOrdersByEmail` call
- After `loadOrderByPaymentIntent`, store the returned `token` in component state
- Pass the token when calling `getCustomerOrder(orderId, token)`
- Read `?token=` from URL query params so emailed links work
- Remove the "Resend Email" button (now requires merchant auth, not customer-facing)

- [ ] **Step 5: Verify both builds**

Run: `cd backend && npx tsc --noEmit`
Run: `cd esim-connect-hub && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/customerOrders.ts backend/src/services/customerOrderService.ts esim-connect-hub/src/pages/OrderTracking.tsx esim-connect-hub/src/lib/api.ts
git commit -m "fix(security): add signed token auth to customer order endpoints (Issue #1)"
```

---

### Task 2: Secure payment endpoints with store validation + rate limiting (Issue #2)

**Files:**
- Modify: `backend/src/routes/payments.ts:198-244` (create-intent endpoint)
- Modify: `backend/src/routes/payments.ts:246-351` (confirm endpoint)

**Context:** `POST /create-intent` and `POST /confirm` have no auth. We can't require merchant JWT (customers aren't merchants), but we must validate that the storeId is real and active, and rate-limit aggressively.

- [ ] **Step 1: Add store validation and rate limiting to create-intent**

At the top of `payments.ts`, add a store checkout rate limiter:

```typescript
import rateLimit from 'express-rate-limit';

const storeCheckoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 payment intents per minute per IP
  message: { success: false, errorCode: 'RATE_LIMIT', errorMessage: 'Too many payment attempts. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Then modify the `create-intent` route (line 203):

```typescript
router.post('/create-intent', storeCheckoutLimiter, async (req, res, next) => {
  try {
    const data = createPaymentIntentSchema.parse(req.body);

    // Require storeId for public checkout
    const merchantId = (req as any).merchant?.id;
    if (!merchantId && !data.storeId) {
      return res.status(400).json({
        success: false,
        errorCode: 'STORE_REQUIRED',
        errorMessage: 'storeId is required for store checkout',
      });
    }

    // Validate store exists and is active
    if (data.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: data.storeId },
        select: { isActive: true, adminStatus: true },
      });
      if (!store || !store.isActive || !['in_progress', 'completed'].includes(store.adminStatus)) {
        return res.status(404).json({
          success: false,
          errorCode: 'STORE_NOT_FOUND',
          errorMessage: 'Store not found or inactive',
        });
      }
    }

    // ... rest of existing handler
```

- [ ] **Step 2: Add same store validation to confirm endpoint**

At line 250, add rate limiter and store validation:

```typescript
router.post('/confirm', storeCheckoutLimiter, async (req, res, next) => {
  // ... existing code, but add after parsing:

  if (data.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: data.storeId },
      select: { isActive: true },
    });
    if (!store || !store.isActive) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found or inactive',
      });
    }
  }
  // ... rest of existing handler
```

- [ ] **Step 3: Verify build**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/payments.ts
git commit -m "fix(security): add store validation and rate limiting to payment endpoints (Issue #2)"
```

---

### Task 3: Add Clerk webhook signature verification (Issue #3)

**Depends on:** Task 6 (raw body preservation) — Task 6 MUST be applied first, otherwise `req.rawBody` will be undefined and signature verification will always fail.

**Files:**
- Modify: `backend/src/routes/auth.ts:427-459` (clerk-webhook endpoint)
- Modify: `backend/src/config/env.ts` (add CLERK_WEBHOOK_SECRET)
- Install: `svix` package

**Context:** The clerk-webhook endpoint has a literal TODO for signature verification. We'll use Clerk's recommended `svix` library. This task assumes Task 6 has already added the `verify` callback to `express.json()` that preserves `req.rawBody`.

- [ ] **Step 1: Install svix**

Run: `cd backend && npm install svix`

- [ ] **Step 2: Add CLERK_WEBHOOK_SECRET to env config**

In `backend/src/config/env.ts`, add to the env object:
```typescript
clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
```

- [ ] **Step 3: Rewrite clerk-webhook with signature verification**

Replace the clerk-webhook handler (lines 427-459 in auth.ts). Uses `(req as any).rawBody` from the `verify` callback added in Task 6:

```typescript
router.post('/clerk-webhook', async (req, res, next) => {
  try {
    const { Webhook } = await import('svix');

    if (!env.clerkWebhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ success: false, errorCode: 'CONFIG_ERROR', errorMessage: 'Webhook secret not configured' });
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      return res.status(400).json({ success: false, errorCode: 'MISSING_BODY', errorMessage: 'Missing raw request body' });
    }

    const wh = new Webhook(env.clerkWebhookSecret);
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    let event: any;
    try {
      event = wh.verify(rawBody.toString(), headers);
    } catch (err) {
      console.error('Clerk webhook signature verification failed:', err);
      return res.status(401).json({ success: false, errorCode: 'INVALID_SIGNATURE', errorMessage: 'Webhook signature verification failed' });
    }

    const { clerkService } = await import('../services/clerkService');

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const clerkUserId = event.data.id;
      const email = event.data.email_addresses?.[0]?.email_address;
      const firstName = event.data.first_name;
      const lastName = event.data.last_name;
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName;

      if (email) {
        await clerkService.syncClerkUser(clerkUserId, email, name);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Clerk webhook error:', error);
    res.status(400).json({ success: false, errorCode: 'WEBHOOK_FAILED', errorMessage: error.message || 'Failed to process webhook' });
  }
});

- [ ] **Step 4: Verify build**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/auth.ts backend/src/config/env.ts backend/package.json backend/package-lock.json
git commit -m "fix(security): add Clerk webhook signature verification with svix (Issue #3)"
```

---

### Task 4: Verify Clerk session in clerk-sync endpoint (Issue #4)

**Files:**
- Modify: `backend/src/routes/auth.ts:382-425` (clerk-sync endpoint)
- Modify: `backend/src/services/clerkService.ts` (add session verification method)

**Context:** Currently `POST /api/auth/clerk-sync` accepts any `clerkUserId`. The `clerkService.getOrCreateMerchantFromClerk` does call `clerkClient.users.getUser(clerkUserId)` which verifies the user exists in Clerk, but it doesn't verify the CALLER is that user. We need to verify the Clerk session token.

The `@clerk/clerk-sdk-node` package can verify session tokens via `clerkClient.verifyToken()`.

- [ ] **Step 1: Update clerkService with session verification**

Add to `backend/src/services/clerkService.ts`:

```typescript
/**
 * Verify a Clerk session token and return the user ID.
 * This proves the caller actually owns the Clerk session.
 */
async verifySessionToken(sessionToken: string): Promise<string> {
  try {
    const session = await clerkClient.verifyToken(sessionToken);
    if (!session?.sub) {
      throw new Error('Invalid session token');
    }
    return session.sub; // This is the Clerk user ID
  } catch (error) {
    throw new Error('Invalid or expired Clerk session token');
  }
}
```

- [ ] **Step 2: Update clerk-sync to require and verify session token**

Update the schema and handler in `auth.ts` (lines 382-425):

```typescript
const clerkSyncSchema = z.object({
  sessionToken: z.string().min(1, 'Clerk session token is required'),
});

router.post('/clerk-sync', async (req, res, next) => {
  try {
    const data = clerkSyncSchema.parse(req.body);
    const { clerkService } = await import('../services/clerkService');

    // Verify the session token to get the real Clerk user ID
    const clerkUserId = await clerkService.verifySessionToken(data.sessionToken);

    const merchant = await clerkService.getOrCreateMerchantFromClerk(clerkUserId);
    const token = authService.generateToken(merchant.id);

    const session = await sessionService.createSession(
      merchant.id,
      req.ip,
      req.get('user-agent'),
      SESSION_DAYS
    );
    setSessionCookie(res, session.token);

    res.json({
      success: true,
      data: { merchant, token },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', errorMessage: error.errors[0].message });
    } else {
      res.status(401).json({ success: false, errorCode: 'CLERK_SYNC_FAILED', errorMessage: error.message || 'Failed to sync Clerk user' });
    }
  }
});
```

- [ ] **Step 3: Update frontend ClerkAuthSync to send session token**

Modify `esim-connect-hub/src/components/ClerkAuthSync.tsx` (line 77), `esim-connect-hub/src/pages/Signup.tsx` (lines 89, 165), and `esim-connect-hub/src/lib/api.ts` (clerkSync method):

In `ClerkAuthSync.tsx`, change line 77:
```typescript
// Before:
const result = await apiClient.clerkSync(clerkUser.id);

// After:
const sessionToken = await clerk.session?.getToken();
if (!sessionToken) {
  console.error('No Clerk session token available');
  return;
}
const result = await apiClient.clerkSync(sessionToken);
```

In `Signup.tsx`, update both occurrences (lines 89 and 165):
```typescript
// Before (line 89):
const result = await apiClient.clerkSync(updated.createdUserId);

// After:
await setActive({ session: updated.createdSessionId });
// Get token from the newly active session
const sessionToken = await clerk.session?.getToken();
const result = await apiClient.clerkSync(sessionToken!);

// Same pattern for line 165
```

In `api.ts`, change the `clerkSync` method:
```typescript
// Before:
async clerkSync(clerkUserId: string) {
  const result = await this.request<{ merchant: any; token: string }>('/api/auth/clerk-sync', {
    method: 'POST',
    body: JSON.stringify({ clerkUserId }),
  });

// After:
async clerkSync(sessionToken: string) {
  const result = await this.request<{ merchant: any; token: string }>('/api/auth/clerk-sync', {
    method: 'POST',
    body: JSON.stringify({ sessionToken }),
  });
```

- [ ] **Step 4: Verify both builds**

Run: `cd backend && npx tsc --noEmit`
Run: `cd esim-connect-hub && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/auth.ts backend/src/services/clerkService.ts esim-connect-hub/src/components/ClerkAuthSync.tsx esim-connect-hub/src/pages/Signup.tsx esim-connect-hub/src/lib/api.ts
git commit -m "fix(security): verify Clerk session token in clerk-sync endpoint (Issue #4)"
```

---

### Task 5: Fix race condition in balance deduction (Issue #5)

**Files:**
- Modify: `backend/src/routes/api.ts:97-206` (order creation endpoint)

**Context:** Current flow: check balance → call eSIM Access → deduct balance (inside Prisma transaction). Problem: two concurrent orders can both pass the balance check. Fix: atomically deduct first, then call eSIM Access, refund on failure.

- [ ] **Step 1: Rewrite order endpoint with deduct-first approach**

Replace the order handler (lines 97-206) with:

```typescript
router.post('/orders', async (req, res, next) => {
  try {
    const data = orderProfilesSchema.parse(req.body);
    const merchantId = req.merchant!.id;

    // Resolve order amount
    let orderAmountApi = data.amount;
    let packageInfoList = data.packageInfoList;
    if (orderAmountApi == null) {
      try {
        const resolved = await esimAccessService.resolveOrderFromPackages(data.packageInfoList);
        orderAmountApi = resolved.amount;
        packageInfoList = resolved.enrichedPackageInfoList;
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          errorCode: 'VALIDATION_ERROR',
          errorMessage: err?.message || 'Could not resolve order amount from packages',
        });
      }
    }

    const merchantChargeCents = Math.round((Number(orderAmountApi) * PLATFORM_PRICE_MARKUP) / 100);

    // Step 1: Atomically deduct balance (fails if insufficient)
    // Uses raw SQL with WHERE clause to prevent negative balance
    let deducted = false;
    try {
      const result = await prisma.$executeRaw`
        UPDATE "Merchant"
        SET balance = balance - ${BigInt(merchantChargeCents)}
        WHERE id = ${merchantId}
          AND balance >= ${BigInt(merchantChargeCents)}
      `;
      deducted = result > 0;
    } catch (err) {
      console.error('[Order] Balance deduction failed:', err);
    }

    if (!deducted) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { balance: true },
      });
      const currentBalance = Number(merchant?.balance || 0);
      return res.status(400).json({
        success: false,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: `Insufficient balance. Current: $${(currentBalance / 100).toFixed(2)}, Required: $${(merchantChargeCents / 100).toFixed(2)}`,
      });
    }

    // Step 2: Call eSIM Access API
    let esimResult: any;
    try {
      const payload = { ...data, amount: orderAmountApi, packageInfoList };
      esimResult = await esimAccessService.orderProfiles(payload);
    } catch (err: any) {
      // Step 2a: Refund on API failure (with audit trail)
      await prisma.$transaction([
        prisma.merchant.update({
          where: { id: merchantId },
          data: { balance: { increment: BigInt(merchantChargeCents) } },
        }),
        prisma.balanceTransaction.create({
          data: {
            merchantId,
            amount: BigInt(merchantChargeCents),
            type: BalanceTransactionType.REFUND,
            description: `Auto-refund: eSIM provider API error`,
          },
        }),
      ]);
      console.error('[Order] eSIM Access API failed, balance refunded:', err.message);
      return res.status(502).json({
        success: false,
        errorCode: 'ESIM_API_ERROR',
        errorMessage: 'eSIM provider is temporarily unavailable. Your balance has not been charged.',
      });
    }

    if (!esimResult.success || !esimResult.obj?.orderNo) {
      // Refund on eSIM Access rejection (with audit trail)
      await prisma.$transaction([
        prisma.merchant.update({
          where: { id: merchantId },
          data: { balance: { increment: BigInt(merchantChargeCents) } },
        }),
        prisma.balanceTransaction.create({
          data: {
            merchantId,
            amount: BigInt(merchantChargeCents),
            type: BalanceTransactionType.REFUND,
            description: `Auto-refund: order rejected by provider (${esimResult.errorCode || 'unknown'})`,
          },
        }),
      ]);
      console.error('[Order] eSIM Access rejected order, balance refunded:', esimResult);
      return res.status(400).json({
        success: false,
        errorCode: esimResult.errorCode || 'ORDER_REJECTED',
        errorMessage: esimResult.errorMessage || 'Order was rejected by the eSIM provider.',
      });
    }

    // Step 3: Create order record and balance transaction
    const order = await prisma.order.create({
      data: {
        merchantId,
        transactionId: data.transactionId,
        esimAccessOrderNo: esimResult.obj.orderNo,
        status: OrderStatus.PENDING,
        totalAmount: BigInt(orderAmountApi),
        packageCount: packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0),
      },
    });

    await prisma.balanceTransaction.create({
      data: {
        merchantId,
        orderId: order.id,
        amount: BigInt(-merchantChargeCents),
        type: BalanceTransactionType.ORDER,
        description: `Order ${esimResult.obj.orderNo} - ${packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0)} package(s)`,
      },
    });

    console.log(`[Order] Created order ${esimResult.obj.orderNo} for merchant ${merchantId}`);
    res.json({ ...esimResult, orderId: order.id });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', errorMessage: error.errors[0].message });
    } else {
      console.error('[Order] Unexpected error:', error);
      res.status(500).json({ success: false, errorCode: 'ORDER_FAILED', errorMessage: error.message || 'Failed to create order' });
    }
  }
});
```

- [ ] **Step 2: Verify build**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/api.ts
git commit -m "fix(security): prevent race condition in balance deduction with atomic deduct-first approach (Issue #5)"
```

---

### Task 6: Fix Stripe webhook raw body parsing (Issue #6)

**Files:**
- Modify: `backend/src/index.ts:30-32` (global JSON parser)

**Context:** `express.json()` runs globally at line 31 and parses the body before Stripe's `express.raw()` middleware on the webhook route. This means `req.body` is already a parsed object, breaking Stripe signature verification. Fix: preserve raw body via the `verify` callback.

- [ ] **Step 1: Add verify callback to preserve rawBody**

In `backend/src/index.ts`, replace line 31:

```typescript
// Before:
app.use(express.json({ limit: '10mb' }));

// After:
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    // Preserve raw body for webhook signature verification (Stripe, Clerk)
    req.rawBody = buf;
  },
}));
```

- [ ] **Step 2: Update Stripe webhook to use rawBody**

In `backend/src/routes/payments.ts`, update the webhook handler (line 357):

```typescript
// Before:
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  // ...
  event = Stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);

// After:
router.post('/webhook', async (req, res, next) => {
  // ...
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    return res.status(400).json({ success: false, errorCode: 'MISSING_BODY', errorMessage: 'Missing raw request body' });
  }
  event = Stripe.webhooks.constructEvent(rawBody, sig, env.stripeWebhookSecret);
```

- [ ] **Step 3: Update Clerk webhook to use rawBody (from Task 3)**

In the Clerk webhook handler, use `(req as any).rawBody` instead of `req.body.toString()`.

- [ ] **Step 4: Verify build**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add backend/src/index.ts backend/src/routes/payments.ts backend/src/routes/auth.ts
git commit -m "fix(security): preserve raw body for Stripe and Clerk webhook signature verification (Issue #6)"
```

---

### Task 7: Fix broken rate limiter (Issue #7)

**Files:**
- Modify: `backend/src/middleware/auth.ts:237-269` (createRateLimiter)

**Context:** `createRateLimiter` creates a new `rateLimit()` instance per request, each with its own in-memory store. Rate limiting is effectively a no-op. Fix: cache limiter instances by API key ID.

- [ ] **Step 1: Rewrite createRateLimiter with caching**

Replace lines 237-269 in `backend/src/middleware/auth.ts`:

```typescript
/**
 * Rate Limiting Middleware Factory
 * Caches rate limiter instances per API key so counters persist across requests.
 */
const rateLimiterCache = new Map<string, ReturnType<typeof rateLimit>>();

export function createRateLimiter() {
  // Global fallback limiter for non-API-key requests (session users)
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, errorCode: 'RATE_LIMIT_EXCEEDED', errorMessage: 'Rate limit exceeded. Maximum 100 requests per minute.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      // Apply global limiter for session-based users too
      return globalLimiter(req, res, next);
    }

    const keyId = req.apiKey.id;
    let limiter = rateLimiterCache.get(keyId);

    if (!limiter) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        select: { rateLimit: true },
      });
      const requestsPerMinute = apiKey?.rateLimit || 100;

      limiter = rateLimit({
        windowMs: 60 * 1000,
        max: requestsPerMinute,
        message: {
          success: false,
          errorCode: 'RATE_LIMIT_EXCEEDED',
          errorMessage: `Rate limit exceeded. Maximum ${requestsPerMinute} requests per minute.`,
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => keyId,
      });
      rateLimiterCache.set(keyId, limiter);
    }

    limiter(req, res, next);
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/auth.ts
git commit -m "fix(security): cache rate limiter instances so rate limiting actually works (Issue #7)"
```

---

### Task 8: Remove real secrets from template .env files (Issue #8)

**Files:**
- Modify: `esimlaunch-template/apps/backend/.env`
- Modify: `esimlaunch-template/apps/web/.env.local`

**Context:** Real API keys, Stripe keys, and Clerk secrets are committed. Replace with placeholders. User must rotate the exposed keys manually.

- [ ] **Step 1: Replace backend .env with placeholders**

Replace `esimlaunch-template/apps/backend/.env` content — change these specific values:
- Line 16: `TEMPLATE_ORDER_SYNC_SECRET=your_template_order_sync_secret_here`
- Line 26: `ESIMLAUNCH_API_KEY=sk_live_your_esimlaunch_api_key_here`
- Line 33: `STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here`
- Line 34: `STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here`
- Line 67: `GUEST_TOKEN_SECRET=change-this-to-a-long-random-secret`  (already a placeholder, keep)
- Line 78: `EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key_here`

- [ ] **Step 2: Replace frontend .env.local with placeholders**

In `esimlaunch-template/apps/web/.env.local`:
- Line 17: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here`
- Line 18: `CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here`

- [ ] **Step 3: Create .env.example files**

Copy each `.env` to `.env.example` (backend) and `.env.local.example` (web) with the same placeholder values.

- [ ] **Step 4: Commit**

```bash
git add esimlaunch-template/apps/backend/.env esimlaunch-template/apps/web/.env.local esimlaunch-template/apps/backend/.env.example esimlaunch-template/apps/web/.env.local.example
git commit -m "fix(security): replace real secrets with placeholders in template env files (Issue #8)"
```

**IMPORTANT:** After this commit, rotate these keys immediately:
- The eSIMLaunch API key (`sk_live_c781191b...`) in your backend dashboard
- The Stripe test key in your Stripe dashboard
- The Clerk secret key in your Clerk dashboard

---

### Task 9: Implement proper JWT verification in template auth guards (Issue #9)

**Depends on:** Should be done before Task 10 (order auth relies on the guard working correctly).

**Files:**
- Modify: `esimlaunch-template/apps/backend/src/common/guards/clerk-email.guard.ts` (full rewrite)
- Modify: `esimlaunch-template/apps/backend/src/common/guards/optional-clerk-email.guard.ts` (full rewrite)
- Modify: `esimlaunch-template/apps/backend/src/main.ts:29` (update CORS headers)
- Modify: `esimlaunch-template/apps/web/lib/apiClient.ts` (send Authorization header)
- Modify: `esimlaunch-template/apps/web/lib/safe-fetch.ts` (send Authorization header)

**Context:** Both `ClerkEmailGuard` and `OptionalClerkEmailGuard` trust `x-user-email` header blindly. If only `ClerkEmailGuard` is fixed, an attacker can still bypass auth on endpoints using `OptionalClerkEmailGuard` (like the orders controller) by setting the header. Fix both guards to verify the Clerk JWT from the Authorization header using `@clerk/clerk-sdk-node` (already installed).

- [ ] **Step 1: Create a shared Clerk verification helper**

Create `esimlaunch-template/apps/backend/src/common/guards/clerk-verify.ts`:

```typescript
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';

/** Shared helper to verify Clerk JWT and resolve user. */
export async function verifyClerkToken(
  authHeader: string | undefined,
  config: ConfigService,
  prisma: PrismaService,
): Promise<{ userId: string; userEmail: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const clerkSecretKey = config.get<string>('CLERK_SECRET_KEY');
  if (!clerkSecretKey) throw new Error('CLERK_SECRET_KEY not configured');

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const verified = await clerk.verifyToken(token);
  if (!verified?.sub) return null;

  const clerkUser = await clerk.users.getUser(verified.sub);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    user = await prisma.user.create({ data: { email: normalizedEmail } });
  }

  return { userId: user.id, userEmail: normalizedEmail };
}
```

- [ ] **Step 2: Rewrite clerk-email.guard.ts to use the helper**

```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { verifyClerkToken } from './clerk-verify';

@Injectable()
export class ClerkEmailGuard implements CanActivate {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const result = await verifyClerkToken(req.headers['authorization'], this.config, this.prisma);
      if (!result) throw new UnauthorizedException('Valid Authorization header required');
      req.userId = result.userId;
      req.userEmail = result.userEmail;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentication failed: ' + (error.message || 'Invalid token'));
    }
  }
}
```

- [ ] **Step 3: Rewrite optional-clerk-email.guard.ts to use the helper**

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { verifyClerkToken } from './clerk-verify';

@Injectable()
export class OptionalClerkEmailGuard implements CanActivate {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const result = await verifyClerkToken(req.headers['authorization'], this.config, this.prisma);
      if (result) {
        req.userId = result.userId;
        req.userEmail = result.userEmail;
      }
    } catch {
      // Optional — silently ignore auth failures for guest flows
    }
    return true;
  }
}
```

- [ ] **Step 4: Update template frontend API clients to send Authorization header**

In `esimlaunch-template/apps/web/lib/apiClient.ts` and `safe-fetch.ts`:
- Replace any code that sets `x-user-email` header with `Authorization: Bearer <clerkToken>`
- Use Clerk's `useAuth().getToken()` to get the JWT and pass it as `Authorization: Bearer ${token}`
- Remove any references to `x-user-email` header

- [ ] **Step 5: Remove x-user-email from CORS allowed headers**

In `esimlaunch-template/apps/backend/src/main.ts` line 29, remove `x-user-email` from the `allowedHeaders` array. Keep `Authorization`.

- [ ] **Step 4: Verify build**

Run: `cd esimlaunch-template/apps/backend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add esimlaunch-template/apps/backend/src/common/guards/clerk-email.guard.ts esimlaunch-template/apps/backend/src/main.ts
git commit -m "fix(security): verify Clerk JWT instead of trusting x-user-email header (Issue #9)"
```

---

### Task 10: Add authorization to template order endpoint (Issue #10)

**Files:**
- Modify: `esimlaunch-template/apps/backend/src/modules/orders/orders.controller.ts:109-113`

**Context:** `GET /api/orders/:id` returns full order details (including eSIM QR codes) to anyone. Fix: require auth (ClerkEmailGuard) and verify the user owns the order, or use guest token fallback.

- [ ] **Step 1: Add auth check to getOrder endpoint**

Replace `GET /api/orders/:id` (lines 109-113):

```typescript
/** GET /api/orders/:id — requires auth or guest token */
@Get(':id')
async getOrder(
  @Param('id') id: string,
  @Query('token') token: string,
  @Query('email') email: string,
  @Req() req: { userEmail?: string; userId?: string },
) {
  const order = await this.ordersService.getOrderOrThrow(id);
  const user = await this.prisma.user.findUnique({ where: { id: order.userId } });

  let authorized = false;

  // Auth method 1: Clerk session (email match)
  if (req.userEmail && user && req.userEmail.toLowerCase() === user.email.toLowerCase()) {
    authorized = true;
  }

  // Auth method 2: Guest token
  if (!authorized && token && email && this.ordersService.verifyGuestToken(token, id, email)) {
    if (user && email.toLowerCase() === user.email.toLowerCase()) {
      authorized = true;
    }
  }

  if (!authorized) {
    throw new ForbiddenException('Not authorized to view this order. Please sign in or use your access link.');
  }

  return order;
}
```

- [ ] **Step 2: Verify build**

Run: `cd esimlaunch-template/apps/backend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add esimlaunch-template/apps/backend/src/modules/orders/orders.controller.ts
git commit -m "fix(security): require auth or guest token for order details endpoint (Issue #10)"
```

---

### Task 11: Protect retry endpoint (Issue #11)

**Files:**
- Modify: `esimlaunch-template/apps/backend/src/modules/orders/orders.controller.ts:48-52`

**Context:** `GET /api/orders/retry-now` triggers eSIM provisioning retries with no auth. Since the template already has a cron job for retries (`CronModule`), we'll protect this endpoint with a secret header for manual debugging.

- [ ] **Step 1: Inject ConfigService and add admin secret check to retry endpoint**

First, add `ConfigService` to the controller constructor:
```typescript
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

// In constructor:
constructor(
  private readonly ordersService: OrdersService,
  private readonly receiptService: ReceiptService,
  private readonly prisma: PrismaService,
  private readonly config: ConfigService,
) {}
```

Then replace lines 48-52:

```typescript
/** GET /api/orders/retry-now — trigger retry cycle (admin only) */
@Get('retry-now')
retryNow(@Req() req: any) {
  const adminSecret = this.config.get<string>('ADMIN_RETRY_SECRET');
  const provided: string | undefined = req.headers['x-admin-secret'];

  if (!adminSecret || !provided || provided.length !== adminSecret.length) {
    throw new ForbiddenException('Not authorized');
  }

  const isValid = timingSafeEqual(Buffer.from(provided), Buffer.from(adminSecret));
  if (!isValid) {
    throw new ForbiddenException('Not authorized');
  }

  return this.ordersService.retryFailedOrders();
}
```

- [ ] **Step 2: Add ADMIN_RETRY_SECRET to .env**

Add to `esimlaunch-template/apps/backend/.env`:
```
ADMIN_RETRY_SECRET=your_admin_retry_secret_here
```

- [ ] **Step 3: Verify build**

Run: `cd esimlaunch-template/apps/backend && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add esimlaunch-template/apps/backend/src/modules/orders/orders.controller.ts esimlaunch-template/apps/backend/.env
git commit -m "fix(security): protect retry endpoint with admin secret (Issue #11)"
```

---

## Post-Implementation Checklist

After all tasks are complete:

- [ ] Run `cd backend && npx tsc --noEmit` — backend compiles
- [ ] Run `cd esim-connect-hub && npx tsc --noEmit` — frontend compiles
- [ ] Run `cd esimlaunch-template/apps/backend && npx tsc --noEmit` — template compiles
- [ ] Update `ISSUES.md` — mark issues 1-11 as `[x]`
- [ ] **Manual action required:** Rotate exposed secrets (Issue #8):
  - eSIMLaunch API key in backend dashboard
  - Stripe test key in Stripe dashboard
  - Clerk secret key in Clerk dashboard
  - Exchange rate API key
