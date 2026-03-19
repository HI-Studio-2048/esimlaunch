import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TopUpService } from './topup.service';
import { ClerkEmailGuard } from '../../common/guards/clerk-email.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { CurrentUserId } from '../../common/decorators/user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('topup')
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  /**
   * GET /api/topup/plans?iccid=...&locationCode=...
   */
  @Get('plans')
  getTopupPlans(
    @Query('iccid') iccid?: string,
    @Query('locationCode') locationCode?: string,
  ) {
    return this.topUpService.getTopupPlans({ iccid, locationCode });
  }

  /**
   * POST /api/topup/checkout
   */
  @Post('checkout')
  @UseGuards(ClerkEmailGuard, CsrfGuard)
  @RateLimit({ limit: 5, window: 30 })
  createCheckout(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      profileId: string;
      planCode: string;
      amountUsd: number;
      displayCurrency?: string;
    },
  ) {
    return this.topUpService.createTopupCheckout({ ...body, userId });
  }
}
