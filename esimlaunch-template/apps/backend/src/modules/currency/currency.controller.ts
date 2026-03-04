import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * GET /api/currency/detect
   * Returns a suggested display currency based on the Accept-Language header
   * or a default from AdminSettings.
   */
  @Get('detect')
  async detect() {
    // Simplified: return USD; in production, use IP geolocation
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
