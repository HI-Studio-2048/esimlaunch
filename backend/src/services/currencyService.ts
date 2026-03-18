import { prisma } from '../lib/prisma';
import { env } from '../config/env';

// Fallback static rates (used if live API is unavailable)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52,
  JPY: 149.50,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.05,
  BRL: 4.95,
  ZAR: 18.75,
  CHF: 0.88,
  SGD: 1.34,
  NZD: 1.64,
  THB: 35.10,
  KRW: 1320,
  AED: 3.67,
  SAR: 3.75,
  TRY: 32.50,
  PLN: 4.02,
  SEK: 10.45,
  NOK: 10.60,
  DKK: 6.87,
  HKD: 7.82,
  TWD: 31.50,
  PHP: 55.80,
  IDR: 15700,
  MYR: 4.72,
  VND: 24500,
  CZK: 23.20,
  HUF: 365,
  CLP: 925,
  COP: 3950,
  PEN: 3.72,
  ARS: 870,
  EGP: 30.90,
  NGN: 1550,
  KES: 153,
  GHS: 12.50,
  PKR: 278,
  BDT: 110,
  LKR: 310,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
};

// Common currencies with their symbols and names
export const CURRENCIES: Record<string, { symbol: string; name: string; code: string }> = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  JPY: { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', code: 'MXN' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', code: 'BRL' },
  ZAR: { symbol: 'R', name: 'South African Rand', code: 'ZAR' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', code: 'CHF' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD' },
  THB: { symbol: '฿', name: 'Thai Baht', code: 'THB' },
  KRW: { symbol: '₩', name: 'South Korean Won', code: 'KRW' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', code: 'SAR' },
  TRY: { symbol: '₺', name: 'Turkish Lira', code: 'TRY' },
  PLN: { symbol: 'zł', name: 'Polish Zloty', code: 'PLN' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', code: 'SEK' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', code: 'NOK' },
  DKK: { symbol: 'kr', name: 'Danish Krone', code: 'DKK' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', code: 'HKD' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar', code: 'TWD' },
  PHP: { symbol: '₱', name: 'Philippine Peso', code: 'PHP' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', code: 'IDR' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', code: 'MYR' },
};

// Live exchange rate cache (rates from USD base)
let rateCache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const RATE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live rates from ExchangeRate-API (USD base).
 * Falls back to static rates on failure.
 */
async function fetchLiveRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (rateCache && rateCache.fetchedAt + RATE_CACHE_TTL_MS > now) {
    return rateCache.rates;
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    console.warn('EXCHANGE_RATE_API_KEY not set; using fallback static rates');
    return FALLBACK_RATES;
  }

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`ExchangeRate-API returned ${res.status}; using cached/fallback rates`);
      return rateCache?.rates ?? FALLBACK_RATES;
    }
    const json = (await res.json()) as { result?: string; conversion_rates?: Record<string, number> };
    if (json.result !== 'success' || !json.conversion_rates) {
      console.warn('ExchangeRate-API unexpected response; using cached/fallback rates');
      return rateCache?.rates ?? FALLBACK_RATES;
    }

    // conversion_rates is { USD: 1, EUR: 0.92, ... } — rates FROM USD
    rateCache = { rates: json.conversion_rates, fetchedAt: now };
    return json.conversion_rates;
  } catch (err) {
    console.warn('ExchangeRate-API fetch failed; using cached/fallback rates', (err as Error).message);
    return rateCache?.rates ?? FALLBACK_RATES;
  }
}

export const currencyService = {
  /**
   * Get exchange rate between two currencies (via USD as base)
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const rates = await fetchLiveRates();
    const fromRate = rates[from]; // how many "from" per 1 USD
    const toRate = rates[to];     // how many "to" per 1 USD

    if (fromRate && toRate) {
      return toRate / fromRate;
    }

    // Fallback for missing currencies
    console.warn(`Exchange rate not found for ${from} → ${to}; returning 1`);
    return 1;
  },

  /**
   * Get exchange rate (sync version using cached rates — for backward compat)
   */
  getExchangeRateSync(from: string, to: string): number {
    if (from === to) return 1;
    const rates = rateCache?.rates ?? FALLBACK_RATES;
    const fromRate = rates[from];
    const toRate = rates[to];
    if (fromRate && toRate) return toRate / fromRate;
    return 1;
  },

  /**
   * Convert amount from one currency to another
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    const rate = await this.getExchangeRate(from, to);
    return Math.round(amount * rate * 100) / 100;
  },

  /**
   * Format currency amount
   */
  format(amount: number, currency: string): string {
    const currencyInfo = CURRENCIES[currency];
    if (!currencyInfo) {
      return `${currency} ${amount.toFixed(2)}`;
    }
    if (currency === 'JPY' || currency === 'KRW' || currency === 'VND' || currency === 'IDR') {
      return `${currencyInfo.symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  },

  /**
   * Get all available currencies
   */
  getAvailableCurrencies() {
    return Object.values(CURRENCIES);
  },

  /**
   * Get store currency settings
   */
  async getStoreCurrency(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        defaultCurrency: true,
        supportedCurrencies: true,
      },
    });

    return {
      default: store?.defaultCurrency || 'USD',
      supported: (store?.supportedCurrencies as string[]) || ['USD'],
    };
  },

  /**
   * Update store currency settings
   */
  async updateStoreCurrency(
    storeId: string,
    defaultCurrency: string,
    supportedCurrencies: string[]
  ) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        defaultCurrency,
        supportedCurrencies: supportedCurrencies,
      },
    });
  },

  /**
   * Get price in customer's preferred currency
   */
  async getPriceInCurrency(
    basePrice: number,
    baseCurrency: string,
    targetCurrency: string,
    storeId?: string
  ): Promise<number> {
    if (storeId) {
      const storeCurrency = await this.getStoreCurrency(storeId);
      if (!storeCurrency.supported.includes(targetCurrency)) {
        const priceInDefault = await this.convert(basePrice, baseCurrency, storeCurrency.default);
        return this.convert(priceInDefault, storeCurrency.default, targetCurrency);
      }
    }
    return this.convert(basePrice, baseCurrency, targetCurrency);
  },

  /**
   * Get all live rates from USD (for frontend currency selector)
   */
  async getAllRates(): Promise<Record<string, number>> {
    return fetchLiveRates();
  },
};
