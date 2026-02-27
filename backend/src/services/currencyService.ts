import { prisma } from '../lib/prisma';

// Exchange rates (in production, fetch from an API like exchangerate-api.com or fixer.io)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: {
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
  },
  EUR: {
    USD: 1.09,
    GBP: 0.86,
    CAD: 1.47,
    AUD: 1.65,
    JPY: 162.50,
    CNY: 7.87,
    INR: 90.35,
    MXN: 18.52,
    BRL: 5.38,
    ZAR: 20.35,
  },
  GBP: {
    USD: 1.27,
    EUR: 1.16,
    CAD: 1.71,
    AUD: 1.92,
    JPY: 189.50,
    CNY: 9.17,
    INR: 105.30,
    MXN: 21.58,
    BRL: 6.27,
    ZAR: 23.72,
  },
  // Add more base currencies as needed
};

// Common currencies with their symbols and names
export const CURRENCIES = {
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
};

export const currencyService = {
  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(from: string, to: string): number {
    if (from === to) return 1;

    // Try direct rate
    if (EXCHANGE_RATES[from] && EXCHANGE_RATES[from][to]) {
      return EXCHANGE_RATES[from][to];
    }

    // Try reverse rate
    if (EXCHANGE_RATES[to] && EXCHANGE_RATES[to][from]) {
      return 1 / EXCHANGE_RATES[to][from];
    }

    // Try via USD as intermediate
    if (from !== 'USD' && to !== 'USD') {
      const fromToUSD = this.getExchangeRate(from, 'USD');
      const usdToTo = this.getExchangeRate('USD', to);
      if (fromToUSD !== 1 && usdToTo !== 1) {
        return fromToUSD * usdToTo;
      }
    }

    // Default: return 1 if no rate found (shouldn't happen in production)
    console.warn(`Exchange rate not found: ${from} to ${to}`);
    return 1;
  },

  /**
   * Convert amount from one currency to another
   */
  convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    const rate = this.getExchangeRate(from, to);
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  },

  /**
   * Format currency amount
   */
  format(amount: number, currency: string): string {
    const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];
    if (!currencyInfo) {
      return `${currency} ${amount.toFixed(2)}`;
    }

    // Special handling for currencies with different decimal places
    if (currency === 'JPY' || currency === 'KRW') {
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
    // If store has currency settings, use them
    if (storeId) {
      const storeCurrency = await this.getStoreCurrency(storeId);
      // Check if target currency is supported
      if (!storeCurrency.supported.includes(targetCurrency)) {
        // Convert to store's default currency first
        const priceInDefault = this.convert(basePrice, baseCurrency, storeCurrency.default);
        return this.convert(priceInDefault, storeCurrency.default, targetCurrency);
      }
    }

    return this.convert(basePrice, baseCurrency, targetCurrency);
  },
};










