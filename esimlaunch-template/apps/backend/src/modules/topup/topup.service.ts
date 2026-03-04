import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { EsimService } from '../esim/esim.service';
import { StripeService } from '../stripe/stripe.service';
import { CurrencyService } from '../currency/currency.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class TopUpService {
  private readonly logger = new Logger(TopUpService.name);

  constructor(
    private prisma: PrismaService,
    private esimService: EsimService,
    private stripeService: StripeService,
    private currencyService: CurrencyService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async getTopupPlans(params: { iccid?: string; locationCode?: string }) {
    const res = await this.esimService.getClient().getTopupPackages(params);
    return res.obj?.packageList ?? [];
  }

  async createTopupCheckout(input: {
    userId: string;
    profileId: string;
    planCode: string;
    amountUsd: number;
    displayCurrency?: string;
  }) {
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id: input.profileId },
      include: { order: true },
    });
    if (!profile) throw new NotFoundException('eSIM profile not found');

    const amountCents = Math.round(input.amountUsd * 100);
    const currency = input.displayCurrency ?? 'USD';
    const displayAmountCents = await this.currencyService.convertUsdCents(amountCents, currency);
    const webUrl = this.config.get<string>('WEB_APP_URL', 'http://localhost:3000');

    const topUp = await this.prisma.topUp.create({
      data: {
        userId: input.userId,
        profileId: input.profileId,
        planCode: input.planCode,
        amountCents,
        status: 'pending',
      },
    });

    const session = await this.stripeService.createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: displayAmountCents,
            product_data: { name: `Top-up: ${input.planCode}` },
          },
          quantity: 1,
        },
      ],
      currency,
      successUrl: `${webUrl}/my-esims?topup_success=1`,
      cancelUrl: `${webUrl}/my-esims`,
      metadata: {
        type: 'topup',
        topUpId: topUp.id,
        profileId: input.profileId,
        planCode: input.planCode,
        amountUSD: String(amountCents),
      },
    });

    await this.prisma.topUp.update({
      where: { id: topUp.id },
      data: { paymentRef: session.id },
    });

    return { url: session.url, sessionId: session.id };
  }

  async handleStripeTopUp(session: import('stripe').default.Checkout.Session) {
    const meta = session.metadata ?? {};
    const topUpId = meta.topUpId;
    if (!topUpId) return;

    const topUp = await this.prisma.topUp.findUnique({ where: { id: topUpId } });
    if (!topUp || topUp.status !== 'pending') return;

    const profile = await this.prisma.esimProfile.findUnique({ where: { id: topUp.profileId } });
    if (!profile?.esimTranNo) {
      this.logger.error(`No esimTranNo for profile ${topUp.profileId}`);
      return;
    }

    try {
      const res = await this.esimService.getClient().topupEsim({
        esimTranNo: profile.esimTranNo,
        packageCode: topUp.planCode,
        transactionId: `topup_${topUp.id}`.substring(0, 50),
        amount: parseInt(meta.amountUSD ?? '0', 10) * 100,
      });

      if (res.success && res.obj?.orderNo) {
        await this.prisma.topUp.update({
          where: { id: topUp.id },
          data: { status: 'completed', rechargeOrderNo: res.obj.orderNo },
        });
      } else {
        throw new Error(res.errorMessage ?? 'Top-up failed');
      }
    } catch (err) {
      this.logger.error(`Top-up failed for ${topUpId}`, err);
      await this.prisma.topUp.update({ where: { id: topUp.id }, data: { status: 'failed' } });
    }
  }

  async retryFailedTopUps() {
    const failedTopUps = await this.prisma.topUp.findMany({
      where: { status: 'failed' },
    });
    for (const topUp of failedTopUps) {
      const profile = await this.prisma.esimProfile.findUnique({ where: { id: topUp.profileId } });
      if (!profile?.esimTranNo) continue;
      this.logger.log(`Retrying top-up ${topUp.id}`);
      await this.prisma.topUp.update({ where: { id: topUp.id }, data: { status: 'pending' } });
      await this.handleStripeTopUp({ metadata: {
        type: 'topup',
        topUpId: topUp.id,
        profileId: topUp.profileId,
        planCode: topUp.planCode,
        amountUSD: String(topUp.amountCents),
      } } as any);
    }
  }
}
