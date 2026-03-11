import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { clearAllOnboardingProgress } from "@/lib/onboardingProgress";
import { registerClerkSignOut } from "@/lib/clerkBridge";
import { getPostAuthRedirectPath } from "@/lib/authRedirect";

/**
 * Syncs Clerk authentication with our backend.
 * Placed inside both ClerkProvider and AuthProvider.
 *
 * Flow:
 *  - Clerk user present + not yet synced → call backend, set JWT + user
 *  - Clerk user changed                  → reset sync flag, clear old onboarding progress
 *  - Clerk user gone                     → clear JWT + user
 *  - explicit_logout flag set            → if Clerk session is still alive, kill it here too
 */
export function ClerkAuthSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setAuthLoading } = useAuth();
  const hasSynced = useRef<string | null>(null);

  // Register clerk.signOut on the bridge so Navbar can call it without
  // violating React's rules of hooks (useClerk can't be called conditionally).
  useEffect(() => {
    registerClerkSignOut(() => clerk.signOut());
  }, [clerk]);

  useEffect(() => {
    if (!isLoaded) return;

    const syncClerkUser = async () => {
      const explicitLogout =
        localStorage.getItem('explicit_logout') || sessionStorage.getItem('explicit_logout');

      if (explicitLogout === 'true') {
        setUser(null);
        apiClient.setJwtToken(null);
        hasSynced.current = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('current_store_id');
          localStorage.removeItem('esimlaunch_store_config');
        }

        // If Clerk's session is somehow still alive (e.g. signOut in Navbar
        // resolved before Clerk's server actually invalidated it), kill it now.
        // This is what caused the "You're already signed in" error on re-login.
        if (clerkUser) {
          try { await clerk.signOut(); } catch (_) { /* best effort */ }
        }
        return;
      }

      if (clerkUser) {
        // Reset sync state if a different Clerk user is now active
        if (hasSynced.current !== null && hasSynced.current !== clerkUser.id) {
          hasSynced.current = null;
          clearAllOnboardingProgress();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('current_store_id');
            localStorage.removeItem('esimlaunch_store_config');
          }
        }

        // Already synced this user — nothing to do
        if (hasSynced.current === clerkUser.id) return;

        // Hold the auth loading state so the navbar/ProtectedRoute show a
        // spinner instead of flashing "Sign In" while the backend call runs.
        setAuthLoading(true);
        try {
          const result = await apiClient.clerkSync(clerkUser.id);
          apiClient.setJwtToken(result.token);
          setUser(result.merchant);
          hasSynced.current = clerkUser.id;
          sessionStorage.removeItem('explicit_logout');
          localStorage.removeItem('explicit_logout');
          console.log('Clerk user synced successfully', result.merchant);

          // First-time or returning: send to onboarding or dashboard (not homepage)
          const pathname = location.pathname;
          if (pathname === '/' || pathname === '/sso-callback') {
            const target = await getPostAuthRedirectPath();
            navigate(target, { replace: true });
          }
        } catch (err: any) {
          console.error('Failed to sync Clerk user:', err?.message || err);
          hasSynced.current = null;
        } finally {
          setAuthLoading(false);
        }
      } else {
        // No Clerk user — clear our local auth state if we had one
        if (hasSynced.current !== null) {
          setUser(null);
          apiClient.setJwtToken(null);
          hasSynced.current = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('current_store_id');
            localStorage.removeItem('esimlaunch_store_config');
          }
        }
      }
    };

    syncClerkUser();
  }, [clerkUser?.id, isLoaded, setUser, setAuthLoading, clerk, navigate, location.pathname]);

  return null;
}
