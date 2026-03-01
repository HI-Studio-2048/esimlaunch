import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
// When using a custom Clerk domain (e.g. clerk.esimlaunch.com), if it returns 525/CORS errors,
// set this to your Clerk Frontend API default URL so the script loads from Clerk's CDN instead.
// In Dashboard: Domains → your instance uses e.g. https://<instance>.clerk.accounts.dev
// Use: https://<instance>.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js
const CLERK_JS_URL = import.meta.env.VITE_CLERK_JS_URL || undefined;

// Note: ClerkProvider is optional - if no key is provided, the app works without Clerk
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        {...(CLERK_JS_URL ? { clerkJSUrl: CLERK_JS_URL } : {})}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
