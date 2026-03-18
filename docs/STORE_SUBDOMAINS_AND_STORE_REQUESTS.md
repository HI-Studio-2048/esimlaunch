## Store requests, subdomains, and live store URLs

This doc explains **what to do when there is a new store request** (e.g. `EZZAWANESIM`) and how that request becomes a live store at a URL like:

`https://ezzawanesim.esimlaunch.com`

It focuses on the **Easy Way (done‑for‑you)** stores where the eSIMLaunch team builds and hosts the full stack for the merchant.

---

## 1. What the app already does when a store request is created

When the merchant completes onboarding and submits the form:

- **Frontend (`Onboarding` page)** calls `POST /api/stores` via `apiClient.createStore(storeData)`.
- **Backend (`backend/src/routes/stores.ts`)**:
  - Validates the payload with `createStoreSchema`.
  - Creates a `Store` record in the database, including:
    - `businessName`
    - `name`
    - `subdomain` (e.g. `"ezzawanesim"`)
    - branding colors, template key, etc.
  - Sends an **admin notification email** with store details.
- The **Admin dashboard** then shows this under **Store requests** with:
  - Business / Store name
  - Merchant email
  - **Subdomain** (`ezzawanesim`)
  - Status (e.g. `Pending review`)

Important: in the database, `Store.subdomain` is just the **label** (`"ezzawanesim"`).  
The **full URL** is formed as:

`<subdomain>.esimlaunch.com` → `ezzawanesim.esimlaunch.com`

---

## 2. High‑level architecture for Easy Way stores

For Easy Way merchants, the intended architecture is:

- **One multi‑tenant storefront app** (React/Vite) deployed to Vercel.
  - This app reads the **subdomain** from the request (e.g. `ezzawanesim`).
  - It calls the backend endpoint:
    - `GET /api/stores/by-subdomain/:subdomain`
  - It renders branding, packages, and content based on that store record.
- **Backend API** (Express/Prisma) is already deployed (e.g. `https://api.esimlaunch.com`) and used as the **dashboard backend and eSIM API**.
- **DNS + Vercel** route each `*.esimlaunch.com` store URL to the same Vercel project, which then uses the subdomain to pick the correct store.

So all Easy Way stores share:

- the same **frontend codebase**,
- the same **backend API**,
- different **Store records** and **branding**.

---

## 3. What you actually do when a new store request appears

When you see a new row in **Admin → Store requests** (e.g. `EZZAWANESIM` with subdomain `ezzawanesim`), the steps are:

1. **Review & approve the merchant**
   - Check business details, compliance, payment setup, etc.
   - Optionally update store settings in the dashboard (colors, template, selected packages).

2. **Make sure the backend can serve that store by subdomain**
   - Confirm that the store exists with the `subdomain` set correctly.
   - Backend route used by storefront:
     - `GET /api/stores/by-subdomain/:subdomain`
   - If you call:
     - `GET /api/stores/by-subdomain/ezzawanesim`
     - you should get the store’s branding and packages.

3. **Hook up the URL `https://ezzawanesim.esimlaunch.com` to your storefront app**
   - This is the Cloudflare + Vercel configuration (details in the next section).

4. **Test the live store**
   - Visit `https://ezzawanesim.esimlaunch.com` in a browser.
   - Confirm:
     - Branding matches the Store settings.
     - Packages and pricing load correctly.
     - Checkout / eSIM flows work end‑to‑end.

Once this is done, you can tell the merchant:

> “Your store is live at `https://ezzawanesim.esimlaunch.com`.”

---

## 4. DNS and hosting setup for `*.esimlaunch.com` stores

Assumptions:

- **DNS** for `esimlaunch.com` is managed in **Cloudflare**.
- **Frontend storefront app** is deployed to **Vercel** (e.g. project domain `esim-storefront.vercel.app`).
- **Backend API** is already deployed and reachable at something like `https://api.esimlaunch.com`.

There are two ways to map store URLs to the storefront app:

### Option A (recommended): wildcard subdomain for all stores

Use a single wildcard DNS + wildcard Vercel domain so every new store `*.esimlaunch.com` works automatically.

#### 4.1 Cloudflare DNS (wildcard)

Add a **CNAME** record:

- **Type**: `CNAME`
- **Name**: `*` (or `*.esimlaunch.com` depending on UI)
- **Target**: your Vercel project domain, e.g. `esim-storefront.vercel.app`
- **Proxy status**: Proxied (orange cloud) is typically fine.

This means any subdomain like `ezzawanesim.esimlaunch.com`, `mystore.esimlaunch.com`, etc. will resolve to your Vercel storefront app.

#### 4.2 Vercel domain configuration

In the **Vercel project** that contains the storefront:

1. Go to **Settings → Domains**.
2. Add a domain:
   - `*.esimlaunch.com`
3. Vercel will:
   - validate DNS,
   - issue wildcard TLS certificates,
   - start serving traffic for all `*.esimlaunch.com` subdomains from this project.

Now any new store with `subdomain = "foo"` will be available at:

`https://foo.esimlaunch.com`

as long as your app reads `foo` and calls `/api/stores/by-subdomain/foo`.

### Option B: one‑off subdomains (per store)

If you do **not** want a wildcard and instead want to explicitly configure each store:

1. **Cloudflare DNS**
   - Add a CNAME record:
     - **Type**: `CNAME`
     - **Name**: `ezzawanesim`
     - **Target**: `esim-storefront.vercel.app`
2. **Vercel**
   - In the same storefront project, go to **Settings → Domains**.
   - Add `ezzawanesim.esimlaunch.com` as a domain.

Result: only `https://ezzawanesim.esimlaunch.com` is served; other subdomains must be configured manually.

---

## 5. How the storefront app chooses which store to render

Inside your Vercel‑hosted React app:

1. **Read the host and extract the subdomain**
   - For example, in the browser:
     - `window.location.host` → `"ezzawanesim.esimlaunch.com"`
   - Extract the first segment before the main domain:
     - `"ezzawanesim"`

2. **Call the backend by subdomain**

   - `GET /api/stores/by-subdomain/ezzawanesim`

   The backend route (`backend/src/routes/stores.ts`) will:

   - Look up the `Store` by `subdomain`.
   - Return:
     - `branding` (businessName, colors, logo URL)
     - `packages` (with markup applied)
     - `currency`, `templateKey`, `templateSettings`, etc.

3. **Render the store**

   - Use the returned data to:
     - Set theme colors.
     - Show the business/store name.
     - List eSIM packages and pricing.

If the store is inactive or not found, the backend returns `404` and your frontend should render a “Store not found” / “Coming soon” page.

---

## 6. Putting it all together for a concrete example

Example: a merchant submits a request for `EZZAWANESIM` with subdomain `ezzawanesim`.

1. **Merchant completes onboarding**
   - Frontend calls `POST /api/stores` with `subdomain: "ezzawanesim"`.
   - Backend creates the `Store` record and emails the admin.

2. **Admin reviews the request**
   - Confirms merchant details and sets any additional store configuration.

3. **DNS + Vercel (only needed once if using wildcards)**
   - Cloudflare:
     - Add `CNAME * → esim-storefront.vercel.app`
   - Vercel (storefront project):
     - Add `*.esimlaunch.com` as a domain.

4. **Storefront app behavior**
   - User visits `https://ezzawanesim.esimlaunch.com`.
   - Vercel routes the request to the storefront app.
   - App extracts `ezzawanesim` from the host.
   - App calls `GET /api/stores/by-subdomain/ezzawanesim`.
   - Backend returns the EZZAWANESIM store data.
   - App renders the fully branded store.

After these steps, the URL:

`https://ezzawanesim.esimlaunch.com`

is the **live site** built and hosted by the eSIMLaunch team, backed by your existing API and infrastructure.

---

## 7. Quick checklist for a new store request

When you see a new store request in the Admin dashboard:

- **[ ]** Confirm `Store` record exists and `subdomain` is set (e.g. `"ezzawanesim"`).
- **[ ]** Ensure wildcard DNS `CNAME * → <your Vercel app>` or individual CNAME for this store exists.
- **[ ]** Ensure Vercel project has `*.esimlaunch.com` or the specific `ezzawanesim.esimlaunch.com` domain configured.
- **[ ]** Visit `https://<subdomain>.esimlaunch.com` and verify:
  - Branding and packages load via `/api/stores/by-subdomain/:subdomain`.
  - Checkout and eSIM flows work.
- **[ ]** Notify the merchant that their store is live and share the URL.

