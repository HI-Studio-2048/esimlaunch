/**
 * Utility functions for tracking onboarding progress
 */

export interface OnboardingProgress {
  account: boolean;
  subscription: boolean;
  store: boolean;
  domain: boolean;
  firstSale: boolean;
}

// Get user-specific storage key
function getStorageKey(): string {
  if (typeof window === 'undefined') return 'onboarding_progress';
  
  // Get current user ID from auth context or localStorage
  const userId = localStorage.getItem('current_user_id') || 
                 localStorage.getItem('merchant_id') ||
                 'default';
  
  return `onboarding_progress_${userId}`;
}

export function getOnboardingProgress(): OnboardingProgress {
  if (typeof window === 'undefined') {
    return {
      account: false,
      subscription: false,
      store: false,
      domain: false,
      firstSale: false,
    };
  }

  try {
    const storageKey = getStorageKey();
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse onboarding progress:', error);
  }

  return {
    account: false,
    subscription: false,
    store: false,
    domain: false,
    firstSale: false,
  };
}

export function updateOnboardingProgress(updates: Partial<OnboardingProgress>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getOnboardingProgress();
    const updated = { ...current, ...updates };
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update onboarding progress:', error);
  }
}

export function markStepCompleted(step: keyof OnboardingProgress, completedDate?: string): void {
  updateOnboardingProgress({ [step]: true });
  if (completedDate) {
    // Store completion date separately if needed
    const storageKey = getStorageKey();
    const dateKey = `${storageKey}_${step}_date`;
    localStorage.setItem(dateKey, completedDate);
  }
}

export function getStepCompletionDate(step: keyof OnboardingProgress): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storageKey = getStorageKey();
    const dateKey = `${storageKey}_${step}_date`;
    return localStorage.getItem(dateKey);
  } catch (error) {
    return null;
  }
}

export function resetOnboardingProgress(): void {
  if (typeof window === 'undefined') return;
  const storageKey = getStorageKey();
  localStorage.removeItem(storageKey);
  // Also remove date keys
  const steps: (keyof OnboardingProgress)[] = ['account', 'subscription', 'store', 'domain', 'firstSale'];
  steps.forEach(step => {
    localStorage.removeItem(`${storageKey}_${step}_date`);
  });
}

// Clear all onboarding progress for all users (cleanup function)
export function clearAllOnboardingProgress(): void {
  if (typeof window === 'undefined') return;
  
  // Clear all keys that start with onboarding_progress_
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('onboarding_progress_')) {
      localStorage.removeItem(key);
    }
  });
  
  // Also clear old non-user-specific key for migration
  localStorage.removeItem('onboarding_progress');
}




