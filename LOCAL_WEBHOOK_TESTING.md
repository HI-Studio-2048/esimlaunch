# Testing Stripe Webhooks Locally with Localhost

## Quick Setup (5 minutes)

### Step 1: Install Stripe CLI

**Windows (using Scoop):**
```powershell
scoop install stripe
```

**Windows (using Chocolatey):**
```powershell
choco install stripe
```

**Windows (Manual):**
1. Download from: https://github.com/stripe/stripe-cli/releases
2. Extract and add to PATH

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Download latest release
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_windows_x86_64.zip
# Extract and add to PATH
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with Stripe.

### Step 3: Start Your Backend Server

Make sure your backend is running on port 3000:

```bash
cd backend
npm run dev
```

Your server should be listening on `http://localhost:3000`

### Step 4: Forward Webhooks to Localhost

In a **new terminal window**, run:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Step 5: Copy the Webhook Signing Secret

The CLI will give you a signing secret that starts with `whsec_`. Copy this value.

### Step 6: Update Your .env File

Add the signing secret from Step 5 to `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** This is different from the webhook secret in Stripe Dashboard. Use the one from `stripe listen` command.

### Step 7: Restart Your Backend Server

Restart your backend so it picks up the new environment variable:

```bash
# Stop the server (Ctrl+C) and restart
cd backend
npm run dev
```

---

## Testing Webhooks

### Option 1: Trigger Test Events

In another terminal, trigger test events:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test refund
stripe trigger charge.refunded
```

### Option 2: Use Stripe Dashboard Test Mode

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint" (but **don't use this for localhost**)
3. Instead, use the CLI method above

---

## What You'll See

When a webhook is received, you'll see:

**In the `stripe listen` terminal:**
```
2024-01-01 12:00:00   --> payment_intent.succeeded [evt_xxxxx]
2024-01-01 12:00:00  <--  [200] POST http://localhost:3000/api/payments/webhook [evt_xxxxx]
```

**In your backend server logs:**
```
Webhook received: payment_intent.succeeded
Customer order created via webhook for payment intent pi_xxxxx
```

---

## Troubleshooting

### "Connection refused" error
- Make sure your backend server is running on port 3000
- Check the URL is correct: `localhost:3000/api/payments/webhook`

### "Invalid signature" error
- Make sure you're using the signing secret from `stripe listen` (not from dashboard)
- Restart your backend after updating `.env`
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly

### Webhooks not being received
- Check that `stripe listen` is still running
- Verify the webhook endpoint path matches: `/api/payments/webhook`
- Check backend logs for errors

### Port already in use
If port 3000 is busy, use a different port:
```bash
# Change backend port in .env
PORT=3001

# Update stripe listen
stripe listen --forward-to localhost:3001/api/payments/webhook
```

---

## Important Notes

1. **Don't use Stripe Dashboard for localhost** - The dashboard requires a publicly accessible URL. Use Stripe CLI instead.

2. **Different secrets for dev/prod:**
   - **Development:** Use secret from `stripe listen` command
   - **Production:** Use secret from Stripe Dashboard webhook endpoint

3. **The `stripe listen` command must stay running** - Keep the terminal open while testing.

4. **Test mode vs Live mode:**
   - `stripe listen` uses your test mode API keys by default
   - For live mode: `stripe listen --api-key sk_live_...`

---

## Quick Reference Commands

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded

# View webhook events
stripe events list

# View specific event
stripe events retrieve evt_xxxxx
```

---

## Alternative: Using ngrok (if CLI doesn't work)

If you can't use Stripe CLI, you can use ngrok:

```bash
# Install ngrok
# https://ngrok.com/download

# Expose local server
ngrok http 3000

# Use the ngrok URL in Stripe Dashboard
# Example: https://abc123.ngrok.io/api/payments/webhook
```

But Stripe CLI is recommended as it's simpler and doesn't require dashboard configuration.


