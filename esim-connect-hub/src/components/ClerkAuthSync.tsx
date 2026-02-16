import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { clearAllOnboardingProgress } from "@/lib/onboardingProgress";

/**
 * Component to sync Clerk authentication with our backend
 * Should be placed inside both ClerkProvider and AuthProvider
 */
export function ClerkAuthSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const { setUser } = useAuth();
  const hasSynced = useRef<string | null>(null); // Track which user ID was synced

  useEffect(() => {
    console.log('ClerkAuthSync effect running', {
      clerkUser: clerkUser?.id,
      isLoaded,
      hasSynced: hasSynced.current
    });
    
    const syncClerkUser = async () => {
      // Check if user explicitly logged out - don't auto-sync in that case
      // Check both localStorage and sessionStorage
      const explicitLogout = localStorage.getItem('explicit_logout') || sessionStorage.getItem('explicit_logout');
      if (explicitLogout === 'true') {
        // User explicitly logged out, don't auto-sync
        // Clear everything and reset sync flag
        hasSynced.current = null;
        setUser(null);
        localStorage.removeItem('jwt_token');
        apiClient.setJwtToken(null);
        // Don't sync even if Clerk has a session
        return;
      }

      // Only sync once per Clerk user session
      // Don't sync if user is null (logged out)
      // Reset sync flag if Clerk user changed
      if (clerkUser && hasSynced.current !== null && hasSynced.current !== clerkUser.id) {
        console.log('Clerk user changed, resetting sync flag', {
          previous: hasSynced.current,
          current: clerkUser.id
        });
        hasSynced.current = null;
        // Clear old onboarding progress when switching users
        clearAllOnboardingProgress();
      }

      if (clerkUser && isLoaded && hasSynced.current !== clerkUser.id) {
        try {
          console.log('Syncing Clerk user with backend...', {
            clerkUserId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            name: clerkUser.firstName || clerkUser.lastName
          });
          
          const result = await apiClient.clerkSync(clerkUser.id);
          
          console.log('Clerk sync response:', result);
          
          // Store token for auth context
          localStorage.setItem('jwt_token', result.token);
          apiClient.setJwtToken(result.token);
          // Update auth state without reloading
          setUser(result.merchant);
          hasSynced.current = clerkUser.id; // Store the user ID that was synced
          
          // Store user ID for user-specific storage
          if (result.merchant?.id) {
            localStorage.setItem('current_user_id', result.merchant.id);
            localStorage.setItem('merchant_id', result.merchant.id);
          }
          
          // Try to load API keys and set the first active one
          try {
            const apiKeys = await apiClient.listApiKeys();
            const activeKey = apiKeys.find(key => key.isActive);
            if (activeKey) {
              // Note: We can't get the full key back, but we can check if one exists
              // The user will need to create/copy the key from Settings
              console.log('Active API key found:', activeKey.keyPrefix);
            }
          } catch (keyError) {
            // Silently fail - API keys might not be set up yet
            console.log('No API keys found or error loading keys:', keyError);
          }
          
          console.log('Clerk user synced successfully', result.merchant);
          
          // Clear explicit logout flag since user just logged in
          localStorage.removeItem('explicit_logout');
          sessionStorage.removeItem('explicit_logout');
        } catch (err: any) {
          console.error('Failed to sync Clerk user:', {
            error: err,
            message: err?.message,
            errorCode: err?.errorCode,
            status: err?.status,
            clerkUserId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress
          });
          
          // If sync fails, clear the sync flag so it can retry
          hasSynced.current = null;
          
          // Show error to user
          if (err?.message) {
            console.error('Sync error details:', err.message);
          }
        }
      } else if (!clerkUser && hasSynced.current !== null) {
        // User logged out from Clerk, clear local state
        setUser(null);
        localStorage.removeItem('jwt_token');
        apiClient.setJwtToken(null);
        hasSynced.current = null;
      }
    };

    syncClerkUser();
  }, [clerkUser?.id, isLoaded, setUser, clerkUser]);

  // Reset sync flag when Clerk user signs out
  useEffect(() => {
    if (!clerkUser && hasSynced.current !== null) {
      hasSynced.current = null;
    }
  }, [clerkUser]);

  return null; // This component doesn't render anything
}

