import { prisma } from '../lib/prisma';

const KEYS = {
  ONBOARDING_PROGRESS: 'onboarding_progress',
  STEP_COMPLETION_DATES: 'step_completion_dates',
  LAST_SELECTED_STORE_ID: 'last_selected_store_id',
  PREFERRED_CURRENCY: 'preferred_currency',
} as const;

export type PreferenceKey = keyof typeof KEYS;

class PreferencesService {
  async get<T = unknown>(merchantId: string, key: string): Promise<T | null> {
    const row = await prisma.merchantPreference.findUnique({
      where: { merchantId_key: { merchantId, key } },
    });
    return (row?.value as T) ?? null;
  }

  async set(merchantId: string, key: string, value: object | string | number | boolean | null): Promise<void> {
    if (value === null || value === undefined) {
      await prisma.merchantPreference.deleteMany({
        where: { merchantId, key },
      });
      return;
    }
    await prisma.merchantPreference.upsert({
      where: { merchantId_key: { merchantId, key } },
      create: { merchantId, key, value: value as object },
      update: { value: value as object },
    });
  }

  async getOnboardingProgress(merchantId: string) {
    return this.get<{ account?: boolean; subscription?: boolean; store?: boolean; domain?: boolean; firstSale?: boolean; apiKey?: boolean }>(
      merchantId,
      KEYS.ONBOARDING_PROGRESS
    );
  }

  async setOnboardingProgress(merchantId: string, progress: Record<string, boolean>) {
    await this.set(merchantId, KEYS.ONBOARDING_PROGRESS, progress);
  }

  async getStepCompletionDates(merchantId: string) {
    return this.get<Record<string, string>>(merchantId, KEYS.STEP_COMPLETION_DATES);
  }

  async setStepCompletionDate(merchantId: string, step: string, date: string) {
    const current = (await this.getStepCompletionDates(merchantId)) ?? {};
    await this.set(merchantId, KEYS.STEP_COMPLETION_DATES, { ...current, [step]: date });
  }

  async getLastSelectedStoreId(merchantId: string): Promise<string | null> {
    return this.get<string>(merchantId, KEYS.LAST_SELECTED_STORE_ID);
  }

  async setLastSelectedStoreId(merchantId: string, storeId: string | null) {
    if (storeId === null) {
      await this.set(merchantId, KEYS.LAST_SELECTED_STORE_ID, null);
    } else {
      await this.set(merchantId, KEYS.LAST_SELECTED_STORE_ID, storeId);
    }
  }

  async getPreferredCurrency(merchantId: string): Promise<string | null> {
    return this.get<string>(merchantId, KEYS.PREFERRED_CURRENCY);
  }

  async setPreferredCurrency(merchantId: string, currency: string) {
    await this.set(merchantId, KEYS.PREFERRED_CURRENCY, currency);
  }

  async getAll(merchantId: string) {
    const [onboarding, stepDates, lastStore, currency] = await Promise.all([
      this.getOnboardingProgress(merchantId),
      this.getStepCompletionDates(merchantId),
      this.getLastSelectedStoreId(merchantId),
      this.getPreferredCurrency(merchantId),
    ]);
    return {
      onboarding_progress: onboarding ?? {},
      step_completion_dates: stepDates ?? {},
      last_selected_store_id: lastStore,
      preferred_currency: currency,
    };
  }
}

export const preferencesService = new PreferencesService();
export { KEYS as PREFERENCE_KEYS };
