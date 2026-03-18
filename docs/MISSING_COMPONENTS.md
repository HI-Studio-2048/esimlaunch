# Missing Components & Features

## 🔴 Critical Missing Features

### 1. Authentication System Integration
**Status:** ❌ Not Connected

**Issues:**
- `Login.tsx` uses mock authentication (setTimeout instead of API call)
- `Signup.tsx` uses mock authentication (setTimeout instead of API call)
- `ForgotPassword.tsx` uses mock implementation
- No authentication context/provider to manage auth state
- No protected routes - Dashboard and other pages accessible without login
- No logout functionality
- No token refresh mechanism

**Files to Update:**
- `esim-connect-hub/src/pages/Login.tsx` - Connect to `apiClient.login()`
- `esim-connect-hub/src/pages/Signup.tsx` - Connect to `apiClient.register()`
- `esim-connect-hub/src/pages/ForgotPassword.tsx` - Implement real password reset
- `esim-connect-hub/src/App.tsx` - Add route protection

**Needs:**
- Create `AuthContext` to manage authentication state
- Create `ProtectedRoute` component for route guards
- Implement logout functionality
- Add token refresh logic

---

### 2. Clerk Integration (Social Login)
**Status:** ❌ Not Implemented

**Issues:**
- Google login button shows "Coming Soon" toast
- Apple login button shows "Coming Soon" toast
- No Clerk SDK installed or configured
- No Clerk provider in App.tsx
- No environment variables for Clerk keys

**Needs:**
- Install `@clerk/clerk-react` package
- Create Clerk account and get API keys
- Add `VITE_CLERK_PUBLISHABLE_KEY` to `.env`
- Wrap app with `<ClerkProvider>`
- Implement Google/Apple OAuth buttons
- Handle Clerk authentication callbacks

---

### 3. Protected Routes
**Status:** ❌ Not Implemented

**Issues:**
- Dashboard accessible without authentication
- All merchant pages accessible without login
- No route guards checking for JWT token
- No redirect to login when unauthenticated

**Needs:**
- Create `ProtectedRoute` component
- Wrap protected routes (Dashboard, API Docs, etc.)
- Check for JWT token in localStorage
- Redirect to `/login` if not authenticated
- Store intended destination for redirect after login

---

### 4. Authentication Context
**Status:** ❌ Missing

**Issues:**
- No global auth state management
- Components can't check if user is logged in
- No way to access current user data globally
- Token management scattered (only in apiClient)

**Needs:**
- Create `src/contexts/AuthContext.tsx`
- Provide `useAuth()` hook
- Manage: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `register()`
- Persist auth state in localStorage
- Auto-load token on app start
- Validate token on mount

---

## 🟡 Important Missing Features

### 5. Password Reset Flow
**Status:** ⚠️ Mock Implementation

**Issues:**
- `ForgotPassword.tsx` only shows success message
- No backend endpoint for password reset
- No email sending functionality
- No reset token generation/validation

**Needs:**
- Backend: `/api/auth/forgot-password` endpoint
- Backend: `/api/auth/reset-password` endpoint
- Email service integration (SendGrid, Resend, etc.)
- Reset token generation and validation
- Frontend: Connect to real API

---

### 6. Logout Functionality
**Status:** ❌ Missing

**Issues:**
- No logout button in Navbar
- No logout function in auth context
- No way to clear tokens and redirect

**Needs:**
- Add logout button to Navbar (when authenticated)
- Implement `logout()` in AuthContext
- Clear localStorage tokens
- Redirect to home/login page
- Clear any cached user data

---

### 7. Token Refresh
**Status:** ❌ Missing

**Issues:**
- JWT tokens expire but no refresh mechanism
- Users will be logged out when token expires
- No automatic token renewal

**Needs:**
- Backend: `/api/auth/refresh` endpoint
- Frontend: Intercept 401 responses
- Auto-refresh token before expiration
- Retry failed requests after refresh

---

### 8. User Profile Management
**Status:** ⚠️ Partial

**Issues:**
- No profile page to view/edit user info
- No way to change password
- No account settings page

**Needs:**
- Create `/settings` or `/profile` page
- Display user information
- Allow editing name, email, company
- Change password functionality
- Delete account option

---

## 🟢 Nice-to-Have Missing Features

### 9. Email Verification
**Status:** ❌ Missing

**Issues:**
- No email verification on signup
- No verification status check
- No resend verification email

**Needs:**
- Backend: Email verification endpoint
- Send verification email on signup
- Check verification status
- Resend verification email option

---

### 10. Two-Factor Authentication (2FA)
**Status:** ❌ Missing

**Issues:**
- No 2FA setup option
- No 2FA verification on login

**Needs:**
- Backend: 2FA setup endpoints
- Frontend: 2FA setup UI
- QR code generation for authenticator apps
- 2FA verification on login

---

### 11. Session Management
**Status:** ⚠️ Basic

**Issues:**
- No "Remember Me" functionality (checkbox exists but doesn't work)
- No session timeout handling
- No active sessions list

**Needs:**
- Implement remember me (longer token expiry)
- Session timeout warnings
- View/revoke active sessions

---

## 📋 Implementation Priority

### Phase 1: Critical (Do First)
1. ✅ Create AuthContext
2. ✅ Connect Login/Signup to real API
3. ✅ Implement ProtectedRoute component
4. ✅ Add logout functionality
5. ✅ Protect Dashboard and merchant pages

### Phase 2: Important (Do Next)
6. ✅ Implement password reset flow
7. ✅ Add token refresh mechanism
8. ✅ Create user profile/settings page

### Phase 3: Social Login (When Ready)
9. ✅ Install and configure Clerk
10. ✅ Implement Google/Apple OAuth

### Phase 4: Enhancements (Later)
11. ✅ Email verification
12. ✅ 2FA
13. ✅ Session management

---

## 🔧 Quick Fixes Needed

### Immediate Actions:
1. **Connect Login to API:**
   - Replace `setTimeout` in `Login.tsx` with `apiClient.login()`
   - Store token from response
   - Handle errors properly

2. **Connect Signup to API:**
   - Replace `setTimeout` in `Signup.tsx` with `apiClient.register()`
   - Store token from response
   - Handle validation errors

3. **Create AuthContext:**
   - New file: `src/contexts/AuthContext.tsx`
   - Provide auth state and methods
   - Wrap App with AuthProvider

4. **Create ProtectedRoute:**
   - New file: `src/components/ProtectedRoute.tsx`
   - Check authentication
   - Redirect if not logged in

5. **Update App.tsx:**
   - Wrap with AuthProvider
   - Protect Dashboard route
   - Protect other merchant routes

---

## 📝 Notes

- The API client (`api.ts`) already has token management built-in
- Backend authentication endpoints are working (tested)
- Just need to connect frontend to backend
- Clerk can be added later, but basic auth should work first













