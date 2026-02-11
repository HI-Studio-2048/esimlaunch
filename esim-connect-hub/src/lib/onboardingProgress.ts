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

const STORAGE_KEY = 'onboarding_progress';

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
    const stored = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update onboarding progress:', error);
  }
}

export function markStepCompleted(step: keyof OnboardingProgress, completedDate?: string): void {
  updateOnboardingProgress({ [step]: true });
  if (completedDate) {
    // Store completion date separately if needed
    const dateKey = `${STORAGE_KEY}_${step}_date`;
    localStorage.setItem(dateKey, completedDate);
  }
}

export function getStepCompletionDate(step: keyof OnboardingProgress): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const dateKey = `${STORAGE_KEY}_${step}_date`;
    return localStorage.getItem(dateKey);
  } catch (error) {
    return null;
  }
}

export function resetOnboardingProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  // Also remove date keys
  const steps: (keyof OnboardingProgress)[] = ['account', 'subscription', 'store', 'domain', 'firstSale'];
  steps.forEach(step => {
    localStorage.removeItem(`${STORAGE_KEY}_${step}_date`);
  });
}




