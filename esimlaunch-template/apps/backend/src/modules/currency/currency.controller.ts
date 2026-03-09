import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { StoreConfigService } from '../esim/store-config.service';

@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    private readonly storeConfig: StoreConfigService,
  ) {}

  /**
   * GET /api/currency/detect
   * Returns a suggested display currency. When linked to a store, uses store's defaultCurrency.
   */
  @Get('detect')
  async detect() {
    if (this.storeConfig.isLinked()) {
      const config = await this.storeConfig.getConfig();
      const currency = config?.currency ?? 'USD';
      return { success: true, currency };
    }
    return { success: true, currency: 'USD' };
  }

  /**
   * GET /api/currency/rates
   * Returns exchange rates from USD. e.g. { USD: 1, EUR: 0.92, GBP: 0.79 }
   */
  @Get('rates')
  async rates() {
    const codes = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY'];
    const result: Record<string, number> = {};
    for (const code of codes) {
      result[code] = await this.currencyService.getRate(code);
    }
    return result;
  }

  /**
   * GET /api/currency/convert?amount=100&to=EUR
   * Converts USD cents to target currency. Returns converted amount (in cents of target).
   */
  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('to') to: string,
  ) {
    const cents = parseInt(amount, 10) || 0;
    const converted = await this.currencyService.convertUsdCents(cents, to ?? 'USD');
    return { success: true, original: cents, converted, currency: to };
  }
}
