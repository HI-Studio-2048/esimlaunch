import { Controller, Get, UseGuards } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { ClerkEmailGuard } from '../../common/guards/clerk-email.guard';
import { CurrentUserId } from '../../common/decorators/user.decorator';
import { NotFoundException } from '@nestjs/common';

@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  /**
   * GET /api/affiliate/me
   * Returns current user's affiliate info including referral code and commissions.
   */
  @Get('me')
  @UseGuards(ClerkEmailGuard)
  async getMe(@CurrentUserId() userId: string) {
    const affiliate = await this.affiliateService.getAffiliateByUserId(userId);
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    return affiliate;
  }
}
