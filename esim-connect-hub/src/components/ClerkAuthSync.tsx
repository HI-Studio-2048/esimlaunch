import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Component to sync Clerk authentication with our backend
 * Should be placed inside both ClerkProvider and AuthProvider
 */
export function ClerkAuthSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const { setUser } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncClerkUser = async () => {
      // Only sync once per Clerk user session
      if (clerkUser && isLoaded && !hasSynced.current) {
        try {
          const result = await apiClient.clerkSync(clerkUser.id);
          // Store token for auth context
          localStorage.setItem('jwt_token', result.token);
          apiClient.setJwtToken(result.token);
          // Update auth state without reloading
          setUser(result.merchant);
          hasSynced.current = true;
        } catch (err) {
          console.error('Failed to sync Clerk user:', err);
        }
      }
    };

    syncClerkUser();
  }, [clerkUser?.id, isLoaded, setUser]);

  // Reset sync flag when Clerk user signs out
  useEffect(() => {
    if (!clerkUser && hasSynced.current) {
      hasSynced.current = false;
    }
  }, [clerkUser]);

  return null; // This component doesn't render anything
}

