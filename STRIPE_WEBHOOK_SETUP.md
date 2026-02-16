# Stripe Webhook Setup Guide

## Current Implementation Status

✅ **Implemented:**
- Webhook endpoint at `/api/payments/webhook`
- Signature verification using `STRIPE_WEBHOOK_SECRET`
- Basic event handling for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`

⚠️ **Needs Enhancement:**
- Webhook should create customer orders as backup (currently only frontend does this)
- Missing refund event handling
- Missing charge events
- No webhook event logging/retry mechanism

---

## Required Stripe Webhook Events

### Critical Events (Must Handle)

1. **`payment_intent.succeeded`** ✅ (Currently handled)
   - **Purpose:** Payment completed successfully
   - **Action:** 
     - Update payment intent status
     - Create customer order (if not already created)
     - Trigger eSIM order creation

2. **`payment_intent.payment_failed`** ✅ (Currently handled)
   - **Purpose:** Payment attempt failed
   - **Action:** Update payment intent status to failed

3. **`payment_intent.canceled`** ✅ (Currently handled)
   - **Purpose:** Payment was canceled
   - **Action:** Update payment intent status to canceled

### Important Events (Should Handle)

4. **`charge.succeeded`** ❌ (Not handled)
   - **Purpose:** Charge completed successfully (redundant with payment_intent.succeeded but good backup)
   - **Action:** Same as payment_intent.succeeded

5. **`charge.refunded`** ❌ (Not handled)
   - **Purpose:** Full or partial refund processed
   - **Action:** 
     - Update payment intent status
     - Update customer order status
     - Log refund transaction

6. **`charge.failed`** ❌ (Not handled)
   - **Purpose:** Charge failed
   - **Action:** Update payment intent and order status

### Optional Events (Nice to Have)

7. **`payment_intent.requires_action`** ❌ (Not handled)
   - **Purpose:** 3D Secure or other authentication required
   - **Action:** Notify customer, update order status

8. **`payment_intent.processing`** ❌ (Not handled)
   - **Purpose:** Payment is being processed
   - **Action:** Update order status to processing

---

## Setup Instructions

### 1. Stripe Dashboard Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Production:** `https://yourdomain.com/api/payments/webhook`
   - **Development:** Use ngrok or similar: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
4. Select events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `charge.succeeded`
   - ✅ `charge.refunded`
   - ✅ `charge.failed`
   - (Optional) `payment_intent.requires_action`
   - (Optional) `payment_intent.processing`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 2. Environment Variables

Add to `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe dashboard
```

Add to `esim-connect-hub/.env`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Same as backend publishable key
```

### 3. Testing Webhooks Locally

#### Option A: Stripe CLI (Recommended)
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# This will give you a webhook signing secret (whsec_...)
# Use this in your .env for local development
```

#### Option B: ngrok
```bash
# Install ngrok
# https://ngrok.com/

# Start your backend server
cd backend && npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL in Stripe dashboard
# Example: https://abc123.ngrok.io/api/payments/webhook
```

### 4. Webhook Endpoint Requirements

The webhook endpoint must:
- ✅ Accept POST requests
- ✅ Accept `application/json` content type (with raw body for signature verification)
- ✅ Verify Stripe signature using `STRIPE_WEBHOOK_SECRET`
- ✅ Return 200 status within 20 seconds
- ✅ Be publicly accessible (HTTPS in production)

---

## Current Implementation Details

### Webhook Route Location
`backend/src/routes/payments.ts` - Line 169

### Signature Verification
```typescript
const event = Stripe.webhooks.constructEvent(
  req.body,
  sig,
  env.stripeWebhookSecret
);
```

### Event Handling
Events are processed in `backend/src/services/paymentService.ts`:
- `handleWebhook(event)` - Routes to specific handlers
- `handlePaymentSucceeded()` - Updates payment intent status
- `handlePaymentFailed()` - Updates payment intent status
- `handlePaymentCanceled()` - Updates payment intent status

---

## Recommended Enhancements

### 1. Create Customer Orders in Webhook (Backup)

Currently, customer orders are only created in the frontend `confirmPayment` call. Add backup creation in webhook:

```typescript
// In paymentService.handlePaymentSucceeded()
if (paymentIntent.metadata.storeId && paymentIntent.metadata.customerEmail) {
  // Create customer order as backup
  await customerOrderService.createCustomerOrder({
    customerEmail: paymentIntent.metadata.customerEmail,
    storeId: paymentIntent.metadata.storeId,
    paymentIntentId: paymentIntent.id,
    // ... other data from metadata
  });
}
```

### 2. Add Refund Handling

```typescript
case 'charge.refunded':
  await this.handleRefund(event.data.object as Stripe.Charge);
  break;
```

### 3. Add Webhook Event Logging

Create a `WebhookEvent` model to log all webhook events for debugging:
```prisma
model WebhookEvent {
  id            String   @id @default(uuid())
  eventId       String   @unique // Stripe event ID
  eventType     String
  processed     Boolean  @default(false)
  errorMessage  String?
  createdAt     DateTime @default(now())
}
```

### 4. Add Retry Mechanism

For failed webhook processing, implement retry logic using a queue (BullMQ is already installed).

---

## Testing Checklist

- [ ] Webhook endpoint is publicly accessible
- [ ] Signature verification works
- [ ] `payment_intent.succeeded` creates customer order
- [ ] `payment_intent.payment_failed` updates status
- [ ] `payment_intent.canceled` updates status
- [ ] Refund events are handled (when implemented)
- [ ] Webhook events are idempotent (can be processed multiple times safely)
- [ ] Error handling logs failures properly

---

## Security Considerations

1. **Always verify webhook signatures** - Prevents fake webhook attacks
2. **Use HTTPS in production** - Stripe requires HTTPS
3. **Idempotency** - Handle duplicate events gracefully
4. **Rate limiting** - Consider rate limiting webhook endpoint
5. **IP whitelisting** - Optional: Whitelist Stripe IPs (not recommended, use signature verification instead)

---

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct in Stripe dashboard
- Verify endpoint is publicly accessible
- Check server logs for errors
- Use Stripe CLI to test: `stripe trigger payment_intent.succeeded`

### Signature verification failing
- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe dashboard
- Verify webhook endpoint uses `express.raw({ type: 'application/json' })` middleware
- Check that request body is not parsed before signature verification

### Events not processing
- Check server logs for errors
- Verify database connection
- Ensure all required services are initialized
- Check that event handlers don't throw uncaught errors

---

## Next Steps

1. ✅ Set up webhook endpoint in Stripe dashboard
2. ✅ Add `STRIPE_WEBHOOK_SECRET` to environment variables
3. ⚠️ Enhance webhook handler to create customer orders
4. ⚠️ Add refund event handling
5. ⚠️ Add webhook event logging
6. ⚠️ Test all webhook events end-to-end





