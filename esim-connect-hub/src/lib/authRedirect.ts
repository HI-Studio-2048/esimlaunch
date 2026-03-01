import { apiClient } from "@/lib/api";

/**
 * Returns the path to redirect to after login/signup:
 * - New/first-time user (onboarding not completed) → /onboarding
 * - Returning user (onboarding completed) → /dashboard
 */
export async function getPostAuthRedirectPath(): Promise<"/onboarding" | "/dashboard"> {
  try {
    const prefs = await apiClient.getMerchantPreferences();
    const progress = prefs?.onboarding_progress ?? {};
    const hasCompletedAnyStep = Object.values(progress).some(Boolean);
    return hasCompletedAnyStep ? "/dashboard" : "/onboarding";
  } catch {
    return "/onboarding";
  }
}
