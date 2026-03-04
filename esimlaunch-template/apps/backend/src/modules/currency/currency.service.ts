import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * CurrencyService converts USD amounts to display currencies.
 * Exchange rates are fetched from an open API and cached for 1 hour.
 * If the fetch fails, falls back to 1:1 (USD).
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private rateCache: Map<string, number> = new Map();
  private cacheExpiry: number = 0;

  constructor(private config: ConfigService) {}

  private async fetchRates(): Promise<void> {
    if (Date.now() < this.cacheExpiry) return;
    try {
      // Using exchangerate.host (free, no key required)
      const res = await axios.get('https://api.exchangerate.host/latest?base=USD', {
        timeout: 10_000,
      });
      const rates: Record<string, number> = res.data?.rates ?? {};
      this.rateCache = new Map(Object.entries(rates));
      this.cacheExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    } catch (e) {
      this.logger.warn('Failed to fetch exchange rates, using 1:1 fallback');
    }
  }

  async getRate(targetCurrency: string): Promise<number> {
    await this.fetchRates();
    return this.rateCache.get(targetCurrency.toUpperCase()) ?? 1;
  }

  async convertUsdCents(usdCents: number, targetCurrency: string): Promise<number> {
    if (targetCurrency.toUpperCase() === 'USD') return usdCents;
    const rate = await this.getRate(targetCurrency);
    return Math.round(usdCents * rate);
  }

  /** Minimum charge: equivalent of $0.50 USD in target currency (in cents). */
  async minimumChargeCents(currency: string): Promise<number> {
    return this.convertUsdCents(50, currency);
  }
}
