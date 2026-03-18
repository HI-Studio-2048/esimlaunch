# Clerk Integration Guide for React/Vite

## ✅ Correct Implementation for React + Vite

This project uses **React with Vite**, not Next.js. Therefore, we use `@clerk/clerk-react` (not `@clerk/nextjs`).

### Key Differences from Next.js:

1. **Package**: `@clerk/clerk-react` (not `@clerk/nextjs`)
2. **No middleware**: React/Vite doesn't use Next.js middleware
3. **Provider**: `<ClerkProvider>` wraps the app in `App.tsx` (not `app/layout.tsx`)
4. **Environment Variables**: `VITE_CLERK_PUBLISHABLE_KEY` (not `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)

---

## 📦 Installation

```bash
npm install @clerk/clerk-react
```

---

## 🔑 Environment Variables

Add to `.env` or `.env.local`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Backend** (for webhook):
```bash
CLERK_SECRET_KEY=sk_test_...
```

---

## 🏗️ Setup Structure

### 1. main.tsx Setup (ClerkProvider Location)

**According to Clerk's official React (Vite) guidelines, `<ClerkProvider>` should be in `main.tsx`, not `App.tsx`:**

```typescript
// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
```

### 2. App.tsx Setup

```typescript
// App.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { ClerkAuthSync } from "@/components/ClerkAuthSync";

const App = () => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {clerkPubKey && <ClerkAuthSync />}
          {/* Rest of app */}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
```

**Important**: 
- `ClerkProvider` is in `main.tsx` (per Clerk's official guidelines)
- `AuthProvider` is in `App.tsx`
- `ClerkAuthSync` must be inside both providers (it's inside `AuthProvider`, and `ClerkProvider` wraps everything)

### 2. Using Clerk Components

```typescript
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";

// In your component
function Login() {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
  
  return (
    <>
      {clerkPubKey ? (
        <SignInButton mode="modal">
          <Button>Sign In with Clerk</Button>
        </SignInButton>
      ) : (
        <Button onClick={handleEmailLogin}>Sign In</Button>
      )}
    </>
  );
}
```

### 3. ClerkAuthSync Component

This component syncs Clerk users with our backend:

```typescript
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

export function ClerkAuthSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const { setUser } = useAuth();
  
  useEffect(() => {
    if (clerkUser && isLoaded) {
      // Sync Clerk user to backend and get JWT
      apiClient.clerkSync(clerkUser.id)
        .then(result => {
          localStorage.setItem('jwt_token', result.token);
          apiClient.setJwtToken(result.token);
          setUser(result.merchant); // Update auth state
        });
    }
  }, [clerkUser?.id, isLoaded, setUser]);
  
  return null;
}
```

---

## 🔄 Authentication Flow

### Clerk Social Login Flow:

1. User clicks "Sign in with Google/Apple"
2. Clerk handles OAuth flow
3. `ClerkAuthSync` detects new Clerk user
4. Backend `/api/auth/clerk-sync` creates/updates merchant
5. Backend returns JWT token
6. `ClerkAuthSync` stores token and updates `AuthContext`
7. User is authenticated in both Clerk and our backend

### Email/Password Login Flow:

1. User enters email/password
2. Frontend calls `/api/auth/login`
3. Backend validates and returns JWT
4. `AuthContext` stores token and updates state
5. User is authenticated

---

## 🛠️ Backend Integration

### Clerk Webhook Endpoint

```typescript
// backend/src/routes/auth.ts
router.post('/clerk-webhook', async (req, res) => {
  const payload = req.body as WebhookEvent;
  await clerkService.handleWebhook(payload);
  res.status(200).json({ success: true });
});
```

### Clerk Sync Endpoint

```typescript
// backend/src/routes/auth.ts
router.post('/clerk-sync', async (req, res) => {
  const { clerkUserId } = req.body;
  const { merchant, token } = await clerkService.syncClerkUser(clerkUserId);
  res.json({ success: true, data: { merchant, token } });
});
```

---

## ✅ Verification Checklist

- [x] `@clerk/clerk-react` installed
- [x] `VITE_CLERK_PUBLISHABLE_KEY` in `.env`
- [x] `<ClerkProvider>` wraps app in `App.tsx`
- [x] `ClerkAuthSync` inside both `ClerkProvider` and `AuthProvider`
- [x] Backend webhook endpoint configured
- [x] Backend sync endpoint working
- [x] Social login buttons use `<SignInButton>` and `<SignUpButton>`
- [x] No page reload needed (auth state updates via context)

---

## 🚫 Common Mistakes to Avoid

1. ❌ **Don't use `@clerk/nextjs`** - This is for Next.js only
2. ❌ **Don't create `proxy.ts` or middleware** - Not needed for React/Vite
3. ❌ **Don't use `authMiddleware()`** - That's Next.js specific
4. ❌ **Don't reload page after Clerk sync** - Use `setUser()` instead
5. ❌ **Don't put `ClerkAuthSync` outside `AuthProvider`** - It needs access to `useAuth()`

---

## 📚 Resources

- [Clerk React Documentation](https://clerk.com/docs/references/react/overview)
- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)

---

## 🔍 Troubleshooting

### Clerk buttons not showing:
- Check `VITE_CLERK_PUBLISHABLE_KEY` is set
- Verify `ClerkProvider` is wrapping the component
- Check browser console for errors

### User not syncing to backend:
- Verify `ClerkAuthSync` is inside `AuthProvider`
- Check backend `/api/auth/clerk-sync` endpoint
- Verify `CLERK_SECRET_KEY` is set in backend `.env`

### Auth state not updating:
- Ensure `setUser` is called in `ClerkAuthSync`
- Check that token is stored in `localStorage`
- Verify `apiClient.setJwtToken()` is called

