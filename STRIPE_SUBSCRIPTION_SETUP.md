# Stripe Subscription Setup Guide

## Overview
To enable subscription billing, you need to create Products and Prices in your Stripe Dashboard and add the Price IDs to your `.env` file.

## Step-by-Step Instructions

### 1. Access Stripe Dashboard
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Make sure you're in **Test mode** for development (toggle in top right)
- Navigate to **Products** in the left sidebar

### 2. Create Products

Create three products, one for each plan:

#### Product 1: Starter Plan
1. Click **"+ Add product"**
2. **Name:** `Starter Plan`
3. **Description:** `Basic eSIM reselling features`
4. **Pricing model:** `Standard pricing`
5. **Price:** `$0` (or your starter price)
6. **Billing period:** `Monthly` (or `Yearly` if preferred)
7. Click **"Save product"**
8. **Copy the Price ID** (starts with `price_...`) - this is what you'll use in `.env`

#### Product 2: Growth Plan
1. Click **"+ Add product"**
2. **Name:** `Growth Plan`
3. **Description:** `Advanced features with custom domain and analytics`
4. **Pricing model:** `Standard pricing`
5. **Price:** `$49` (or your growth price)
6. **Billing period:** `Monthly`
7. Click **"Save product"**
8. **Copy the Price ID**

#### Product 3: Scale Plan
1. Click **"+ Add product"**
2. **Name:** `Scale Plan`
3. **Description:** `Enterprise features with white-label options`
4. **Pricing model:** `Standard pricing`
5. **Price:** `$149` (or your scale price)
6. **Billing period:** `Monthly`
7. Click **"Save product"**
8. **Copy the Price ID**

### 3. Find Price IDs

After creating each product, you'll see the Price ID in one of these places:

**Option A: Product Page**
- Click on the product you just created
- Scroll down to the "Pricing" section
- You'll see the Price ID next to the price (e.g., `price_1ABC123def456GHI789`)
- Click the copy icon to copy it

**Option B: Prices List**
- Go to **Products** → Click on a product
- In the pricing section, you'll see the Price ID
- Format: `price_` followed by alphanumeric characters

### 4. Add to Environment Variables

Add the Price IDs to your `backend/.env` file:

```env
# Stripe Subscription Price IDs
STRIPE_STARTER_PRICE_ID=price_1ABC123def456GHI789
STRIPE_GROWTH_PRICE_ID=price_1XYZ789abc123DEF456
STRIPE_SCALE_PRICE_ID=price_1MNO456pqr789STU012
```

**Important:**
- Replace the example IDs with your actual Price IDs from Stripe
- Make sure you're using **Test mode** Price IDs for development
- When deploying to production, create products in **Live mode** and use those Price IDs

### 5. Verify Setup

After adding the Price IDs:

1. Restart your backend server
2. Test subscription creation:
   ```bash
   # The subscription service will use these Price IDs when creating subscriptions
   ```

### Example Price ID Format

Stripe Price IDs follow this format:
- **Test mode:** `price_1ABC123def456GHI789` (starts with `price_`)
- **Live mode:** `price_1XYZ789abc123DEF456` (same format, different ID)

### Testing Subscriptions

Once configured, you can test subscriptions:

1. **Create a subscription** via the API:
   ```bash
   POST /api/subscriptions
   {
     "plan": "growth",
     "paymentMethodId": "pm_test_xxxxx" // Use Stripe test payment method
   }
   ```

2. **Check Stripe Dashboard** → **Subscriptions** to see the created subscription

3. **Test webhooks** using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

### Troubleshooting

**Error: "Price ID not configured for plan"**
- Make sure all three Price IDs are set in `.env`
- Restart the backend server after updating `.env`
- Verify the Price IDs are correct (copy-paste from Stripe Dashboard)

**Error: "No such price: price_xxx"**
- You're using a Price ID from the wrong mode (test vs live)
- Make sure you're in Test mode in Stripe Dashboard for development
- Verify the Price ID exists in your Stripe account

**Subscription not creating**
- Check Stripe API keys are correct (`STRIPE_SECRET_KEY`)
- Verify Price IDs match the products you created
- Check backend logs for detailed error messages

### Production Deployment

When deploying to production:

1. **Switch to Live mode** in Stripe Dashboard
2. **Create new Products** in Live mode (or use existing ones)
3. **Copy Live mode Price IDs**
4. **Update production `.env`** with Live mode Price IDs
5. **Update `STRIPE_SECRET_KEY`** to use Live mode secret key

---

**Note:** Keep your Test mode and Live mode Price IDs separate. Test mode IDs won't work in Live mode and vice versa.










