# Easy Way Merchant: Support Tickets & Email Flows

This document explains how Easy Way merchants' customers submit support tickets through the merchant's website and how they receive eSIM delivery emails.

---

## 1. Support ticket flow

### How customers submit support tickets

1. **On the merchant's store (e.g. template site):** The store has a Contact or Support page with a form.
2. **Form submission:** The form calls the esimlaunch backend:

   ```
   POST /api/support/tickets
   Content-Type: application/json

   {
     "storeId": "<merchant's store UUID>",   // resolves to merchantId
     "customerEmail": "customer@example.com",
     "customerName": "John Doe",
     "subject": "Help with my eSIM",
     "description": "I cannot activate my eSIM...",
     "category": "technical",                 // optional: billing, technical, order_issue, general
     "priority": "medium"                     // optional: low, medium, high, urgent
   }
   ```

3. **Backend behavior:**
   - If `storeId` is provided, the backend looks up the store and sets `merchantId`.
   - If `merchantId` is provided directly, it uses that.
   - The ticket is created with `merchantId` so it belongs to that merchant.
   - `orderId` can optionally link to a `CustomerOrder` ID if the ticket is about a specific order.

4. **Merchant sees it:** The merchant logs into the esimlaunch dashboard and goes to **Support** (`/dashboard/support`). The dashboard calls `GET /api/support/tickets` (authenticated), which returns only tickets for that merchant.

### Template integration (bidirectional)

When the template is **linked** (STORE_ID, ESIMLAUNCH_HUB_API_URL, TEMPLATE_ORDER_SYNC_SECRET set):

- **Create ticket**: Template creates the ticket directly in esimlaunch via `POST /api/support/tickets` (public).
- **List / Get / Reply**: Template fetches from esimlaunch via integration API (`GET/POST /api/integration/support/tickets/...`) with `x-template-sync-secret`.
- **Result**: esimlaunch is the single source of truth. **Merchant replies in the dashboard appear on the template site** immediately when the customer views the ticket.

When **not linked**: Template uses its own database for tickets (no dashboard sync).

---

## 2. Email flow (order confirmation & eSIM delivery)

### Order flow

1. **Customer checkout:** Customer pays via Stripe on the store. The store calls `POST /api/payments/confirm` with `paymentIntentId`, `customerEmail`, `storeId`, `packageInfoList`, etc.

2. **Order creation:** The esimlaunch backend:
   - Creates a `CustomerOrder` and an `Order` (eSIM Access API).
   - Deducts the cost from the merchant's balance.
   - Sends an **order confirmation email** via `emailService.sendOrderConfirmationEmail()` with:
     - Customer email, order ID, status, package info.
   - Returns success to the store.

3. **eSIM provisioning:** The eSIM Access provider processes the order. When eSIMs are ready, they send a webhook (`ORDER_STATUS` → `COMPLETED`) to esimlaunch.

4. **eSIM delivery email:** When the webhook marks the order as COMPLETED, `webhookService.deliverESIMs(orderId)`:
   - Fetches eSIM profiles from the provider.
   - Upserts them into the `EsimProfile` table.
   - Finds the linked `CustomerOrder` (store order).
   - Generates QR codes for each eSIM.
   - Sends **eSIM delivery email** via `emailService.sendESIMDeliveryEmail()` with:
     - QR codes, ICCIDs, data/validity info, store name.
   - The customer receives this email with everything needed to install the eSIM.

### Resending the eSIM email

If a customer didn't receive the email or lost it:

- **From dashboard:** The merchant opens the order in **Orders** (`/dashboard/orders`), clicks the order, then clicks **Resend email**. This calls `POST /api/dashboard/customer-orders/:id/resend-receipt`, which triggers `webhookService.deliverESIMs()` again.

---

## 3. Top-up flow (customer eSIM data top-ups)

When a customer buys additional data for an existing eSIM:

1. **Store processes top-up:** The store (e.g. template) handles the top-up purchase (Stripe, etc.) and calls the eSIM Access API to add data to the profile.

2. **Reporting to dashboard:** To show top-ups in the esimlaunch merchant dashboard, the store should call:

   ```
   POST /api/integration/topup
   Headers: x-template-sync-secret: <TEMPLATE_ORDER_SYNC_SECRET>
   Body: {
     "merchantId": "<uuid>",
     "storeId": "<uuid>",
     "customerEmail": "customer@example.com",
     "customerName": "John",
     "iccid": "...",
     "esimTranNo": "...",
     "packageCode": "...",
     "amountCents": 500,
     "status": "completed",
     "paymentRef": "pi_xxx"
   }
   ```

3. **Dashboard:** The merchant sees top-ups under **Top-ups** (`/dashboard/topups`).

---

## Summary

| Flow | Endpoint | Auth | Who calls |
|------|----------|------|-----------|
| Create support ticket | `POST /api/support/tickets` | None (public) | Store contact form |
| List merchant tickets | `GET /api/support/tickets` | JWT (merchant) | esimlaunch dashboard |
| Order confirmation email | (internal) | - | Backend after `createCustomerOrder` |
| eSIM delivery email | (internal) | - | Backend on ORDER_STATUS webhook |
| Resend eSIM email | `POST /api/dashboard/customer-orders/:id/resend-receipt` | JWT (merchant) | esimlaunch dashboard |
| Report top-up | `POST /api/integration/topup` | x-template-sync-secret | Store backend after top-up |
