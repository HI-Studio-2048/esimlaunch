# eSIMLaunch - Project Overview & Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Business Model](#business-model)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Core Features](#core-features)
6. [Database Schema](#database-schema)
7. [API Structure](#api-structure)
8. [Authentication & Security](#authentication--security)
9. [Integration Details](#integration-details)
10. [Frontend Features](#frontend-features)
11. [Development Setup](#development-setup)
12. [File Structure](#file-structure)
13. [Future Roadmap](#future-roadmap)

---

## 🎯 Project Overview

**eSIMLaunch** is a comprehensive **eSIM reselling platform** that enables businesses and entrepreneurs to start their own eSIM retail business without the complexity of direct carrier relationships or technical infrastructure.

### Vision

To democratize eSIM distribution by providing a turnkey platform that allows anyone—from travel agencies to influencers to entrepreneurs—to launch their own branded eSIM store in minutes, not months.

### Target Audience

- **Travel Agencies**: Offer eSIMs as add-on services to travel packages
- **Hotels & Resorts**: Enhance guest connectivity with branded eSIM solutions
- **Influencers & Content Creators**: Monetize audience through affiliate eSIM sales
- **Entrepreneurs**: Start a telecom business with minimal upfront investment
- **Communities**: Group deals and referral programs
- **Tech-Savvy Businesses**: API-first merchants building custom integrations

---

## 💼 Business Model

eSIMLaunch offers **two distinct service approaches** to accommodate different merchant needs:

### 1. **Easy Way** (Fully Managed - `EASY` Service Type)

**Target**: Non-technical users, quick launches, white-label stores

**Features**:
- **Fully managed website/storefront** - No coding required
- **Drag-and-drop store builder** with pre-built templates
- **Automatic inventory management** from eSIM Access
- **Built-in payment processing** and checkout flow
- **White-label branding** - Custom domain, logo, colors
- **SEO optimization** out of the box
- **Customer support tools** integrated
- **Analytics dashboard** with sales metrics

**Use Case**: A travel agency wants to sell eSIMs on their website with their branding, but doesn't have technical resources.

**Implementation Status**: ⚠️ Partially implemented (Store model exists, UI in progress)

---

### 2. **Advanced Way** (API-Only - `ADVANCED` Service Type)

**Target**: Developers, technical teams, custom integrations

**Features**:
- **RESTful API access** to all eSIM functionality
- **API key management** with rate limiting
- **Webhook support** for real-time order updates
- **Full control** over UI/UX and customer experience
- **Custom integrations** with existing systems
- **Developer dashboard** with API documentation
- **Request logging** and analytics

**Use Case**: A SaaS platform wants to integrate eSIM sales into their existing product using their own UI.

**Implementation Status**: ✅ Fully implemented and operational

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  API Docs    │  │   Settings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         API Client (api.ts)                         │   │
│  │  - JWT Authentication                                │   │
│  │  - API Key Management                                │   │
│  │  - Request/Response Handling                        │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
┌───────────────────────▼─────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                       │   │
│  │  - JWT Authentication                               │   │
│  │  - API Key Validation                               │   │
│  │  - Rate Limiting                                    │   │
│  │  - Request Logging                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                    │   │
│  │  - Merchant Management                               │   │
│  │  - Order Processing                                   │   │
│  │  - Webhook Handling                                  │   │
│  │  - Analytics & Reporting                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Layer (Prisma ORM)                │   │
│  │  - PostgreSQL Database                               │   │
│  │  - Type-safe Database Access                         │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HMAC-SHA256 Authentication
┌───────────────────────▼─────────────────────────────────────┐
│            eSIM Access API (External)                       │
│  - Package Catalog                                          │
│  - Order Processing                                         │
│  - Profile Management                                       │
│  - Webhook Delivery                                          │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Middleware Pattern**: Acts as a proxy between merchants and eSIM Access API
2. **API-First**: All functionality accessible via REST API
3. **Multi-Tenant**: Each merchant has isolated data and API keys
4. **Event-Driven**: Webhooks for real-time updates
5. **Scalable**: Stateless backend, horizontal scaling ready

---

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Validation**: Zod
- **Rate Limiting**: BullMQ + Redis (optional)
- **Email**: Resend
- **Social Auth**: Clerk (optional)
- **2FA**: speakeasy, qrcode

### Frontend

- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Routing**: React Router DOM 6.x
- **State Management**: React Context API
- **Data Fetching**: TanStack React Query
- **UI Components**: Radix UI + Tailwind CSS
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Social Auth**: Clerk React SDK (optional)
- **Icons**: Lucide React

### Infrastructure

- **Database**: PostgreSQL (Docker Compose for local)
- **Cache/Queue**: Redis (optional, for rate limiting)
- **Environment**: dotenv for configuration
- **Development**: tsx for TypeScript execution

---

## ✨ Core Features

### 1. Merchant Management

- **User Registration & Authentication**
  - Email/password registration
  - JWT-based authentication
  - Social login (Google, Apple) via Clerk
  - Email verification
  - Password reset flow
  - Two-factor authentication (2FA)
  - Session management

- **Account Management**
  - Profile editing
  - Password change
  - Account deletion (soft delete)
  - Service type selection (EASY/ADVANCED)

### 2. API Key Management

- **Secure API Key Generation**
  - Unique keys per merchant
  - Hashed storage (bcrypt)
  - Key prefix display (first 8 chars)
  - Expiration support
  - Rate limiting per key (default: 100 req/min)

- **Key Operations**
  - Create, list, revoke keys
  - View usage statistics
  - Last used tracking

### 3. eSIM API Proxy

All eSIM Access API endpoints are proxied through our middleware:

- **Package Management**
  - `GET /api/v1/packages` - List available packages
  - Filter by location, carrier, data amount
  - Real-time pricing from eSIM Access

- **Order Management**
  - `POST /api/v1/orders` - Create new orders
  - `GET /api/v1/orders/:orderNo` - Get order details
  - Order status tracking (PENDING → PROCESSING → COMPLETED/FAILED)

- **Profile Management**
  - `GET /api/v1/profiles` - Query eSIM profiles
  - Profile operations: cancel, suspend, unsuspend, revoke
  - Usage checking and validity tracking

- **Top-Up & Balance**
  - Top-up existing profiles
  - Balance queries
  - Transaction history

### 4. Webhook System

- **Webhook Reception**
  - Receives webhooks from eSIM Access
  - Validates HMAC signatures
  - IP whitelist verification

- **Webhook Forwarding**
  - Forwards events to merchant webhook URLs
  - Event filtering (ORDER_STATUS, ESIM_STATUS, DATA_USAGE, etc.)
  - Retry logic for failed deliveries
  - Webhook secret for merchant verification

### 5. Dashboard & Analytics

- **Real-Time Statistics**
  - Total orders
  - Revenue tracking
  - Success rate
  - Popular packages
  - Geographic distribution

- **Order History**
  - Paginated order list
  - Filter by status, date range
  - Order details view
  - Export capabilities

- **API Usage Analytics**
  - Request volume per API key
  - Response time metrics
  - Error rate tracking
  - Endpoint usage breakdown

### 6. Store Builder (Easy Way)

- **Store Creation**
  - Multiple stores per merchant
  - Custom domain/subdomain support
  - Branding configuration (colors, logo, business name)

- **Package Selection**
  - Curate which packages to sell
  - Pricing markup configuration
  - Package categorization

- **Store Management**
  - Activate/deactivate stores
  - Preview before going live
  - SEO settings

**Status**: Database schema ready, UI implementation in progress

---

## 🗄️ Database Schema

### Core Models

#### Merchant
- User account information
- Service type (EASY/ADVANCED)
- Authentication fields (password, 2FA, email verification)
- Clerk integration (optional)
- Relations: apiKeys, orders, stores, webhookConfigs, sessions

#### ApiKey
- Hashed API key storage
- Key prefix for display
- Rate limiting configuration
- Usage tracking (lastUsedAt)
- Expiration support

#### Order
- Merchant transaction tracking
- eSIM Access order number mapping
- Status tracking (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- Amount and package count

#### WebhookConfig
- Merchant webhook URLs
- Event type subscriptions
- Active/inactive status
- Optional webhook secret

#### Store (Easy Way)
- Store name and domain/subdomain
- Branding configuration (colors, logo)
- Package selection (JSON)
- Pricing markup (JSON)
- Active status

#### Session
- User session tracking
- IP address and user agent
- Expiration management
- Last used timestamp

#### PasswordResetToken
- Password reset token storage
- Expiration and usage tracking

#### ApiLog
- Request/response logging
- Performance metrics (response time)
- Error tracking
- IP address and user agent

### Enums

- **ServiceType**: `EASY`, `ADVANCED`
- **OrderStatus**: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`
- **WebhookEventType**: `ORDER_STATUS`, `ESIM_STATUS`, `DATA_USAGE`, `VALIDITY_USAGE`, `BALANCE_LOW`, `SMDP_EVENT`

---

## 🔌 API Structure

### Authentication Endpoints

```
POST   /api/auth/register              - Register new merchant
POST   /api/auth/login                 - Login and get JWT token
GET    /api/auth/me                    - Get current merchant info
POST   /api/auth/refresh               - Refresh JWT token
PUT    /api/auth/profile               - Update merchant profile
POST   /api/auth/change-password       - Change password
DELETE /api/auth/account               - Delete account (soft delete)

POST   /api/auth/forgot-password       - Request password reset
GET    /api/auth/verify-reset-token/:token - Verify reset token
POST   /api/auth/reset-password        - Reset password with token

GET    /api/auth/verify-email/:token    - Verify email address
POST   /api/auth/resend-verification-email - Resend verification email

GET    /api/auth/2fa/status            - Get 2FA status
POST   /api/auth/2fa/generate          - Generate 2FA secret & QR code
POST   /api/auth/2fa/verify-setup      - Verify 2FA during setup
POST   /api/auth/2fa/disable           - Disable 2FA
POST   /api/auth/2fa/login             - Verify 2FA during login

POST   /api/auth/clerk-webhook         - Clerk webhook endpoint
POST   /api/auth/clerk-sync            - Sync Clerk user to backend

GET    /api/auth/sessions              - Get active sessions
DELETE /api/auth/sessions/:id          - Revoke session
DELETE /api/auth/sessions/all           - Revoke all other sessions
```

### API Key Management

```
GET    /api/api-keys                   - List all API keys
POST   /api/api-keys                   - Create new API key
DELETE /api/api-keys/:id               - Revoke API key
```

### eSIM API Proxy (Requires API Key)

```
GET    /api/v1/packages                - List packages
POST   /api/v1/orders                  - Create order
GET    /api/v1/orders/:orderNo         - Get order details
GET    /api/v1/profiles                 - Query profiles
POST   /api/v1/profiles/:iccid/cancel   - Cancel profile
POST   /api/v1/profiles/:iccid/suspend  - Suspend profile
POST   /api/v1/profiles/:iccid/unsuspend - Unsuspend profile
POST   /api/v1/profiles/:iccid/revoke   - Revoke profile
POST   /api/v1/profiles/:iccid/topup    - Top-up profile
GET    /api/v1/profiles/:iccid/usage     - Check usage
GET    /api/v1/balance                  - Get balance
POST   /api/v1/webhooks                 - Configure webhooks
```

### Dashboard Endpoints (Requires JWT)

```
GET    /api/dashboard/stats             - Get statistics
GET    /api/dashboard/orders           - Get order history
```

### Store Management (Easy Way)

```
GET    /api/stores                      - List stores
POST   /api/stores                      - Create store
GET    /api/stores/:id                  - Get store details
PUT    /api/stores/:id                  - Update store
DELETE /api/stores/:id                  - Delete store
```

### Webhook Reception

```
POST   /api/webhooks/esimaccess        - Receive webhooks from eSIM Access
```

---

## 🔐 Authentication & Security

### Authentication Methods

1. **JWT Authentication** (Dashboard Access)
   - Token-based authentication
   - 7-day expiration (configurable)
   - Refresh token mechanism
   - Stored in localStorage/sessionStorage

2. **API Key Authentication** (API Access)
   - Bearer token in Authorization header
   - Hashed storage (bcrypt)
   - Rate limiting per key
   - Usage tracking

3. **Social Authentication** (Optional - Clerk)
   - Google OAuth
   - Apple Sign-In
   - Automatic backend sync

### Security Features

- **Password Security**
  - bcrypt hashing (10 rounds)
  - Minimum 8 characters
  - Password reset tokens (1-hour expiry)

- **Two-Factor Authentication**
  - TOTP-based (Google Authenticator compatible)
  - QR code generation
  - Backup codes (future)

- **Session Management**
  - Active session tracking
  - IP address and user agent logging
  - Session revocation
  - "Remember me" functionality

- **API Security**
  - HMAC-SHA256 signing for eSIM Access API
  - Rate limiting (100 req/min default)
  - Request logging
  - IP whitelist for webhooks

- **Email Verification**
  - Email verification on signup
  - Resend verification email
  - 24-hour token expiry

---

## 🔗 Integration Details

### eSIM Access API Integration

**Purpose**: Act as a middleware/proxy between merchants and eSIM Access API

**Authentication Method**: HMAC-SHA256
- Access Code + Secret Key
- Request signing with timestamp
- Signature validation

**Key Features**:
- Automatic request/response transformation
- Error handling and mapping
- Request logging
- Webhook forwarding

**Documentation Location**: `esimaccess docs/eSIM Access API for resellers.md`

### Clerk Integration (Optional)

**Purpose**: Social authentication (Google, Apple)

**Setup**:
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY` in `.env`
- Backend: `CLERK_SECRET_KEY` in `.env`
- Webhook URL: `/api/auth/clerk-webhook`

**Flow**:
1. User signs in with Clerk (frontend)
2. `ClerkAuthSync` component syncs user to backend
3. Backend creates/updates merchant account
4. Backend issues JWT token
5. User authenticated in both systems

---

## 🎨 Frontend Features

### Public Pages

- **Landing Page** (`/`)
  - Value propositions
  - Feature highlights
  - Pricing information
  - Target audience sections
  - How it works
  - Testimonials/trust badges

- **Pricing** (`/pricing`)
  - Three tiers: Starter, Growth, Scale
  - Monthly/yearly toggle
  - Feature comparison

- **Features** (`/features`)
  - Detailed feature list
  - Use cases
  - Benefits

- **API Documentation** (`/api-docs`) - Protected
  - Interactive API documentation
  - Code examples
  - Authentication guide

- **FAQ** (`/faq`)
- **Blog** (`/blog`)
- **Help Center** (`/help-center`)
- **Contact** (`/contact`)
- **About** (`/about`)

### Authenticated Pages

- **Dashboard** (`/dashboard`) - Protected
  - Statistics overview
  - Recent orders
  - Quick actions
  - Charts and graphs

- **Settings** (`/settings`) - Protected
  - Profile management
  - Password change
  - 2FA setup/management
  - Active sessions
  - Account deletion

- **Onboarding** (`/onboarding`) - Protected
  - Multi-step wizard
  - Profile setup
  - Branding configuration
  - Provider selection
  - Payment setup
  - Launch confirmation

- **Store Preview** (`/store-preview`) - Protected
  - Preview Easy Way store
  - Customization options

### Authentication Pages

- **Login** (`/login`)
  - Email/password
  - Social login (Clerk)
  - 2FA verification
  - Remember me
  - Forgot password link

- **Signup** (`/signup`)
  - Registration form
  - Social signup (Clerk)
  - Service type selection

- **Forgot Password** (`/forgot-password`)
- **Reset Password** (`/reset-password`)
- **Verify Email** (`/verify-email`)
- **2FA Setup** (`/two-factor-setup`)

### Demo Store (Easy Way Preview)

- **Demo Store Home** (`/demo-store`)
- **Destinations** (`/demo-store/destinations`)
- **Country Pages** (`/demo-store/country/:countrySlug`)
- **About, Contact, FAQ, etc.**

---

## 🚀 Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis (optional, for rate limiting)
- npm or yarn

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   Create `backend/.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   API_BASE_URL=http://localhost:3000
   DATABASE_URL="postgresql://user:password@localhost:5432/esimlaunch?schema=public"
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   ESIM_ACCESS_API_URL=https://api.esimaccess.com
   ESIM_ACCESS_ACCESS_CODE=your-access-code
   ESIM_ACCESS_SECRET_KEY=your-secret-key
   REDIS_URL=redis://localhost:6379
   CORS_ORIGIN=http://localhost:5173
   RESEND_API_KEY=your-resend-key
   RESEND_FROM_EMAIL=onboarding@esimlaunch.com
   FRONTEND_URL=http://localhost:5173
   CLERK_SECRET_KEY=your-clerk-secret-key (optional)
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL (Docker)
   docker-compose up -d

   # Generate Prisma Client
   npm run prisma:generate

   # Run Migrations
   npm run prisma:migrate

   # Or push schema (development)
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd esim-connect-hub
   npm install
   ```

2. **Environment Variables**
   Create `esim-connect-hub/.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (optional)
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Docker Setup (Database)

```bash
cd backend
docker-compose up -d
```

This starts PostgreSQL on port 5432.

---

## 📁 File Structure

```
esimlaunch/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Environment configuration
│   │   ├── lib/
│   │   │   └── prisma.ts            # Prisma client
│   │   ├── middleware/
│   │   │   ├── jwtAuth.ts           # JWT authentication
│   │   │   ├── apiKeyAuth.ts        # API key authentication
│   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   └── requestLogger.ts     # Request logging
│   │   ├── routes/
│   │   │   ├── auth.ts              # Authentication routes
│   │   │   ├── apiKeys.ts           # API key management
│   │   │   ├── esim.ts              # eSIM API proxy
│   │   │   ├── dashboard.ts         # Dashboard endpoints
│   │   │   ├── stores.ts            # Store management
│   │   │   └── webhooks.ts          # Webhook handling
│   │   ├── services/
│   │   │   ├── authService.ts       # Authentication logic
│   │   │   ├── esimAccessService.ts # eSIM Access integration
│   │   │   ├── emailService.ts      # Email sending
│   │   │   ├── twoFactorService.ts  # 2FA logic
│   │   │   ├── clerkService.ts      # Clerk integration
│   │   │   └── sessionService.ts   # Session management
│   │   └── index.ts                 # Main server file
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── docker-compose.yml           # PostgreSQL setup
│   ├── package.json
│   └── .env                         # Environment variables
│
├── esim-connect-hub/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Navbar, Footer
│   │   │   ├── ui/                  # Radix UI components
│   │   │   ├── shared/              # Shared components
│   │   │   ├── ProtectedRoute.tsx   # Route protection
│   │   │   └── ClerkAuthSync.tsx    # Clerk sync component
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx      # Authentication context
│   │   │   └── DemoStoreContext.tsx # Demo store state
│   │   ├── lib/
│   │   │   ├── api.ts               # API client
│   │   │   └── utils.ts             # Utility functions
│   │   ├── pages/
│   │   │   ├── Index.tsx            # Landing page
│   │   │   ├── Login.tsx            # Login page
│   │   │   ├── Signup.tsx           # Signup page
│   │   │   ├── Dashboard.tsx        # Dashboard
│   │   │   ├── Settings.tsx         # Settings page
│   │   │   ├── APIDocs.tsx          # API documentation
│   │   │   └── ...                   # Other pages
│   │   ├── App.tsx                   # Main app component
│   │   └── main.tsx                 # Entry point
│   ├── package.json
│   └── .env.local                    # Environment variables
│
└── esimaccess docs/                  # eSIM Access API documentation
    ├── eSIM Access API for resellers.md
    └── eSIM Access List Price/
```

---

## 🗺️ Future Roadmap

### Phase 1: Core Completion (Current)
- ✅ Backend API middleware
- ✅ Merchant authentication
- ✅ API key management
- ✅ eSIM API proxy
- ✅ Webhook system
- ✅ Dashboard & analytics
- ✅ Frontend authentication
- ✅ Settings & profile management
- ✅ 2FA implementation
- ✅ Session management

### Phase 2: Easy Way Store Builder
- ⏳ Complete store builder UI
- ⏳ Package selection interface
- ⏳ Pricing markup configuration
- ⏳ Store preview & publishing
- ⏳ Custom domain setup
- ⏳ SEO tools
- ⏳ Customer-facing storefront

### Phase 3: Enhanced Features
- ⏳ Multi-currency support
- ⏳ Advanced analytics & reporting
- ⏳ Email templates customization
- ⏳ Affiliate program
- ⏳ Referral system
- ⏳ Bulk operations API
- ⏳ Webhook retry mechanism improvements

### Phase 4: Enterprise Features
- ⏳ Multi-user accounts (teams)
- ⏳ Role-based access control
- ⏳ Advanced rate limiting
- ⏳ API usage quotas
- ⏳ Custom integrations marketplace
- ⏳ White-label API documentation
- ⏳ SLA monitoring

### Phase 5: Scale & Optimization
- ⏳ Caching layer (Redis)
- ⏳ CDN integration
- ⏳ Database optimization
- ⏳ Load balancing
- ⏳ Monitoring & alerting
- ⏳ Performance optimization

---

## 📚 Additional Documentation

- **Backend Implementation Summary**: `../backend/IMPLEMENTATION_SUMMARY.md`
- **Missing Components**: `MISSING_COMPONENTS.md`
- **Clerk Integration Guide**: `CLERK_INTEGRATION.md`
- **eSIM Access API Docs**: `../esimaccess docs/eSIM Access API for resellers.md`

---

## 🔧 Key Configuration Files

### Backend `.env` Template

```env
# Server
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/esimlaunch?schema=public"

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# eSIM Access API
ESIM_ACCESS_API_URL=https://api.esimaccess.com
ESIM_ACCESS_ACCESS_CODE=your-access-code
ESIM_ACCESS_SECRET_KEY=your-secret-key

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=onboarding@esimlaunch.com
FRONTEND_URL=http://localhost:5173

# Clerk (Optional)
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Frontend `.env.local` Template

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (optional)
```

---

## 🎯 Quick Reference

### Service Types

- **`EASY`**: Fully managed storefront, no coding required
- **`ADVANCED`**: API-only access, full control

### Authentication Methods

- **JWT**: Dashboard access (stored in localStorage)
- **API Key**: API access (Bearer token in header)
- **Clerk**: Social login (optional)

### Order Status Flow

```
PENDING → PROCESSING → COMPLETED
                    → FAILED
                    → CANCELLED
```

### Webhook Events

- `ORDER_STATUS`: Order status changes
- `ESIM_STATUS`: eSIM profile status changes
- `DATA_USAGE`: Data usage updates
- `VALIDITY_USAGE`: Validity period updates
- `BALANCE_LOW`: Low balance alerts
- `SMDP_EVENT`: SMDP server events

---

## 📞 Support & Resources

- **API Documentation**: `/api-docs` (when authenticated)
- **Help Center**: `/help-center`
- **FAQ**: `/faq`
- **Contact**: `/contact`

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Core features implemented, Easy Way in progress


