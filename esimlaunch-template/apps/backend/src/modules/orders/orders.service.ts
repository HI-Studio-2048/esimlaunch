import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { EsimService } from '../esim/esim.service';
import { StoreConfigService } from '../esim/store-config.service';
import { StripeService } from '../stripe/stripe.service';
import { CurrencyService } from '../currency/currency.service';
import { EmailService } from '../email/email.service';
import { Order, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

// Promo code map: code → discount percent
const PROMO_CODES: Record<string, number> = {
  // Add promo codes here in env or a DB table; for now a static example
  WELCOME10: 10,
  LAUNCH20: 20,
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private esimService: EsimService,
    private storeConfig: StoreConfigService,
    private stripeService: StripeService,
    private currencyService: CurrencyService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  // -----------------------------------------------------------------------
  // User helpers
  // -----------------------------------------------------------------------

  async upsertUserByEmail(email: string, name?: string) {
    const normalized = email.trim().toLowerCase();
    return this.prisma.user.upsert({
      where: { email: normalized },
      create: { email: normalized, name },
      update: name ? { name } : {},
    });
  }

  async createGuestUser() {
    const guestEmail = `guest-${crypto.randomUUID()}@esimlaunch-guest.com`;
    return this.prisma.user.create({ data: { email: guestEmail } });
  }

  async linkGuestOrdersToUser(email: string, userId: string) {
    const normalized = email.trim().toLowerCase();
    // Re-assign pending/paid orders with this email to the real user
    const guestUser = await this.prisma.user.findFirst({
      where: { email: normalized },
    });
    if (!guestUser || guestUser.id === userId) return;

    await this.prisma.order.updateMany({
      where: { userId: guestUser.id },
      data: { userId },
    });
    await this.prisma.esimProfile.updateMany({
      where: { userId: guestUser.id },
      data: { userId },
    });
  }

  // -----------------------------------------------------------------------
  // Create pending order (step 1 of checkout)
  // -----------------------------------------------------------------------

  async createPendingOrder(input: {
    planCode: string;
    planName?: string;
    amountUsd: number; // USD, e.g. 9.99
    displayCurrency?: string;
    email?: string;
    referralCode?: string;
    paymentMethod?: 'stripe' | 'vcash';
  }) {
    const amountCents = Math.round(input.amountUsd * 100);
    const currency = input.displayCurrency ?? 'USD';
    const displayAmountCents = await this.currencyService.convertUsdCents(amountCents, currency);

    let user;
    if (input.email) {
      user = await this.upsertUserByEmail(input.email);
    } else {
      user = await this.createGuestUser();
    }

    // V-Cash payment: debit immediately, create as paid, then provision
    if (input.paymentMethod === 'vcash') {
      if (!input.email) throw new BadRequestException('Email required for V-Cash payment');
      const balance = await this.prisma.vCashBalance.findUnique({ where: { userId: user.id } });
      if (!balance || balance.balanceCents < amountCents) {
        throw new BadRequestException('Insufficient V-Cash balance');
      }

      const order = await this.prisma.order.create({
        data: {
          userId: user.id,
          planId: input.planCode,
          planName: input.planName,
          amountCents,
          currency: 'USD',
          displayCurrency: currency,
          displayAmountCents,
          status: 'paid',
          paymentMethod: 'vcash',
          referralCode: input.referralCode,
        },
      });

      // Debit V-Cash
      await this.prisma.vCashBalance.update({
        where: { userId: user.id },
        data: { balanceCents: { decrement: amountCents } },
      });
      await this.prisma.vCashTransaction.create({
        data: {
          userId: user.id,
          type: 'debit',
          amountCents,
          reason: `Order ${order.id}`,
          metadata: { orderId: order.id, planCode: input.planCode },
        },
      });

      // Trigger provisioning in background
      this.processOrderCompletion(order, user).catch((e) =>
        this.logger.error(`processOrderCompletion failed for order ${order.id}`, e),
      );

      return order;
    }

    // Stripe: create pending order
    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        planId: input.planCode,
        planName: input.planName,
        amountCents,
        currency: 'USD',
        displayCurrency: currency,
        displayAmountCents,
        status: 'pending',
        paymentMethod: 'stripe',
        referralCode: input.referralCode,
      },
    });

    return order;
  }

  // -----------------------------------------------------------------------
  // Pay pending order with V-Cash (Store Credit)
  // -----------------------------------------------------------------------

  async payOrderWithVcash(orderId: string, userId: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');
    if (order.paymentMethod !== 'stripe') throw new BadRequestException('Order is not a Stripe order');

    const amountCents = order.amountCents;
    const balance = await this.prisma.vCashBalance.findUnique({ where: { userId } });
    if (!balance || balance.balanceCents < amountCents) {
      throw new BadRequestException('Insufficient Store Credit balance');
    }
    if (order.userId !== userId) throw new BadRequestException('Order does not belong to user');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid', paymentMethod: 'vcash' },
      }),
      this.prisma.vCashBalance.update({
        where: { userId },
        data: { balanceCents: { decrement: amountCents } },
      }),
      this.prisma.vCashTransaction.create({
        data: {
          userId,
          type: 'debit',
          amountCents,
          reason: `Order ${orderId}`,
          metadata: { orderId, planCode: order.planId },
        },
      }),
    ]);

    const freshOrder = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (freshOrder) {
      await this.processOrderCompletion(freshOrder, user);
    }
    return this.getOrderOrThrow(orderId);
  }

  // -----------------------------------------------------------------------
  // Update email on a pending order (guest to identified)
  // -----------------------------------------------------------------------

  async updateOrderEmail(orderId: string, email: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');
    const user = await this.upsertUserByEmail(email);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { userId: user.id },
    });
  }

  // -----------------------------------------------------------------------
  // Promo codes
  // -----------------------------------------------------------------------

  async validatePromo(orderId: string, promoCode: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');

    const discount = PROMO_CODES[promoCode.toUpperCase()];
    if (!discount) throw new BadRequestException('Invalid promo code');

    const newAmountCents = Math.round(order.amountCents * (1 - discount / 100));
    const currency = order.displayCurrency ?? 'USD';
    const newDisplayAmountCents = await this.currencyService.convertUsdCents(newAmountCents, currency);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        amountCents: newAmountCents,
        displayAmountCents: newDisplayAmountCents,
        promoCode: promoCode.toUpperCase(),
      },
    });

    return { discount, newAmountCents, newDisplayAmountCents };
  }

  async removePromo(orderId: string, originalAmountCents: number, originalDisplayAmountCents: number) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        amountCents: originalAmountCents,
        displayAmountCents: originalDisplayAmountCents,
        promoCode: null,
      },
    });
  }

  // -----------------------------------------------------------------------
  // Referral discount check
  // -----------------------------------------------------------------------

  async checkReferralDiscount(orderId: string, referralCode: string) {
    const order = await this.getOrderOrThrow(orderId);
    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });

    // Check: valid affiliate code
    const affiliate = await this.prisma.affiliate.findUnique({ where: { referralCode } });
    if (!affiliate) return { eligible: false, reason: 'invalid_code' };

    // Check: not self-referral
    if (user && affiliate.userId === user.id) return { eligible: false, reason: 'self_referral' };

    // Check: no other completed order for this user
    const priorOrder = await this.prisma.order.findFirst({
      where: { userId: order.userId, status: { in: ['paid', 'esim_created'] } },
    });
    if (priorOrder) return { eligible: false, reason: 'not_first_purchase' };

    return { eligible: true, discountPercent: 10, affiliateId: affiliate.id };
  }

  // -----------------------------------------------------------------------
  // Create Stripe Checkout Session
  // -----------------------------------------------------------------------

  async createStripeCheckout(orderId: string, referralCode?: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');

    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    const webUrl = this.config.get<string>('WEB_APP_URL', 'http://localhost:3000');
    const currency = order.displayCurrency ?? 'USD';

    // Apply referral 10% if eligible (first purchase only)
    let finalDisplayAmountCents = order.displayAmountCents ?? order.amountCents;
    let finalAmountCents = order.amountCents;
    let referralDiscountApplied = false;
    let affiliateId: string | null = null;

    if (referralCode) {
      const check = await this.checkReferralDiscount(orderId, referralCode);
      if (check.eligible) {
        finalAmountCents = Math.round(order.amountCents * 0.9);
        finalDisplayAmountCents = await this.currencyService.convertUsdCents(
          finalAmountCents,
          currency,
        );
        referralDiscountApplied = true;
        affiliateId = check.affiliateId ?? null;
      }
    }

    // Minimum charge check
    const minCents = await this.currencyService.minimumChargeCents(currency);
    if (finalDisplayAmountCents < minCents) {
      finalDisplayAmountCents = minCents;
    }

    const plan = await this.esimService.getPlanByCode(order.planId);
    const planName = plan?.name ?? order.planName ?? order.planId;

    const session = await this.stripeService.createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: finalDisplayAmountCents,
            product_data: { name: planName },
          },
          quantity: 1,
        },
      ],
      currency,
      customerEmail: user?.email?.startsWith('guest-') ? undefined : user?.email,
      successUrl: `${webUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${webUrl}/checkout/${orderId}`,
      metadata: {
        orderId,
        type: 'order',
        planCode: order.planId,
        amountUSD: String(finalAmountCents),
        originalAmountUSD: String(order.amountCents),
        displayCurrency: currency,
        referralCode: referralCode ?? '',
        referralDiscountApplied: String(referralDiscountApplied),
        referralId: affiliateId ?? '',
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  // -----------------------------------------------------------------------
  // Handle Stripe payment (called from webhook)
  // -----------------------------------------------------------------------

  async handleStripePayment(session: import('stripe').default.Checkout.Session) {
    const meta = session.metadata ?? {};
    const orderId: string | undefined = meta.orderId;

    if (!orderId) {
      this.logger.warn('Stripe webhook: no orderId in metadata, skipping');
      return;
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.error(`Stripe webhook: order ${orderId} not found`);
      return;
    }
    if (order.status !== 'pending') return; // Already processed

    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });

    // Update user email/name from Stripe customer_details if it was a guest
    if (session.customer_details?.email && user?.email.startsWith('guest-')) {
      await this.upsertUserByEmail(
        session.customer_details.email,
        session.customer_details.name ?? undefined,
      );
    }

    // Update order to paid
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        paymentRef: session.payment_intent as string,
        amountCents: parseInt(meta.amountUSD ?? '0', 10),
        displayCurrency: meta.displayCurrency,
        referralCode: meta.referralCode || null,
        referralDiscountApplied: meta.referralDiscountApplied === 'true',
      },
    });

    // Handle referral: create Referral record if applicable
    if (meta.referralCode && meta.referralDiscountApplied === 'true') {
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { referralCode: meta.referralCode },
      });
      if (affiliate && user) {
        await this.prisma.referral.upsert({
          where: { referredUserId: user.id },
          create: {
            affiliateId: affiliate.id,
            referredUserId: user.id,
            firstPurchaseDiscountUsed: true,
          },
          update: { firstPurchaseDiscountUsed: true },
        });
      }
    }

    const freshOrder = await this.prisma.order.findUnique({ where: { id: orderId } });
    const freshUser = await this.prisma.user.findUnique({ where: { id: order.userId } });
    if (freshOrder && freshUser) {
      await this.processOrderCompletion(freshOrder, freshUser);
    }
  }

  // -----------------------------------------------------------------------
  // Process order completion (send emails, provision eSIM)
  // -----------------------------------------------------------------------

  async processOrderCompletion(order: Order, user: { email: string; name?: string | null }) {
    const webUrl = this.config.get<string>('WEB_APP_URL', 'http://localhost:3000');

    // Sync to main backend dashboard when linked (so orders appear in merchant dashboard)
    this.syncOrderToMainBackend(order, user).catch((err) =>
      this.logger.warn('Template order sync to main backend failed', err?.message || err),
    );
    const plan = await this.esimService.getPlanByCode(order.planId);
    const planName = plan?.name ?? order.planName ?? order.planId;

    // Send order confirmation email
    await this.emailService.sendOrderConfirmation({
      to: user.email,
      orderDetails: {
        orderId: order.id,
        planName,
        displayAmount: ((order.displayAmountCents ?? order.amountCents) / 100).toFixed(2),
        displayCurrency: order.displayCurrency ?? 'USD',
        guestAccessLink: null, // populated below if guest
      },
    });

    // Generate guest access token and send access email
    const token = this.generateGuestToken(order.id, user.email);
    await this.emailService.sendGuestAccess({
      to: user.email,
      orderId: order.id,
      token,
      appUrl: webUrl,
    });

    // Provision eSIM
    await this.performEsimOrder(order, planName);
  }

  /**
   * Sync completed order to main backend so it appears in merchant dashboard.
   * Runs in background; failures are logged only.
   */
  private async syncOrderToMainBackend(
    order: Order,
    user: { email: string; name?: string | null },
  ): Promise<void> {
    if (!this.storeConfig.isLinked()) return;
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const syncSecret = this.config.get<string>('TEMPLATE_ORDER_SYNC_SECRET');
    if (!baseUrl || !syncSecret) return;

    const config = await this.storeConfig.getConfig();
    if (!config?.storeId) return;

    const amountCents = order.displayAmountCents ?? order.amountCents;
    await fetch(`${baseUrl.replace(/\/$/, '')}/api/integration/template-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-template-sync-secret': syncSecret,
      },
      body: JSON.stringify({
        storeId: config.storeId,
        templateOrderId: order.id,
        customerEmail: user.email,
        customerName: user.name ?? undefined,
        totalAmountCents: amountCents,
        packageCount: 1,
        status: 'COMPLETED',
        paymentRef: order.paymentRef,
      }),
    });
  }

  // -----------------------------------------------------------------------
  // eSIM provisioning
  // -----------------------------------------------------------------------

  async performEsimOrder(order: Order, planName: string) {
    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    const webUrl = this.config.get<string>('WEB_APP_URL', 'http://localhost:3000');

    try {
      await this.prisma.order.update({ where: { id: order.id }, data: { status: 'provisioning' } });

      const transactionId = `order_${order.id}`.substring(0, 50);
      const plan = await this.esimService.getPlanByCode(order.planId);

      const providerPrice = plan?.price ?? 0;

      const orderRes = await this.esimService.getClient().createOrder({
        transactionId,
        packageInfoList: [
          {
            packageCode: order.planId,
            count: 1,
            price: providerPrice,
            ...(order.duration ? { periodNum: order.duration } : {}),
          },
        ],
        amount: providerPrice,
      });

      if (!orderRes.success || !orderRes.obj?.orderNo) {
        throw new Error(orderRes.errorMessage ?? 'Provider order failed');
      }

      const orderNo = orderRes.obj.orderNo;
      await this.prisma.order.update({
        where: { id: order.id },
        data: { esimOrderNo: orderNo },
      });

      // Poll for eSIM profile
      const esimProfile = await this.pollForEsim(orderNo, order.id);

      if (esimProfile && user) {
        await this.emailService.sendEsimReady({
          to: user.email,
          esimDetails: {
            planName,
            iccid: esimProfile.iccid,
            qrCodeUrl: esimProfile.qrCodeUrl,
            ac: esimProfile.ac,
            myEsimsUrl: `${webUrl}/my-esims`,
          },
        });

        await this.prisma.order.update({ where: { id: order.id }, data: { receiptSent: true } });
      }

      // Add commission for affiliate if applicable
      await this.addCommission(order);
    } catch (err) {
      this.logger.error(`eSIM provisioning failed for order ${order.id}`, err);
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'esim_order_failed' },
      });
    }
  }

  private async pollForEsim(orderNo: string, orderId: string, retries = 5) {
    for (let i = 0; i < retries; i++) {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));

      const res = await this.esimService.getClient().queryOrder(orderNo);
      const profiles = res.obj?.esimList ?? [];

      if (profiles.length > 0) {
        const p = profiles[0];
        const profile = await this.prisma.esimProfile.upsert({
          where: { orderId },
          create: {
            orderId,
            userId: (await this.prisma.order.findUnique({ where: { id: orderId } }))?.userId,
            esimTranNo: p.esimTranNo,
            iccid: p.iccid,
            qrCodeUrl: p.qrCodeUrl,
            ac: p.ac,
            smdpStatus: p.smdpStatus,
            esimStatus: p.esimStatus,
            totalVolume: p.totalVolume ? BigInt(p.totalVolume) : null,
            expiredTime: p.expiredTime ? new Date(p.expiredTime) : null,
          },
          update: {
            esimTranNo: p.esimTranNo,
            iccid: p.iccid,
            qrCodeUrl: p.qrCodeUrl,
            ac: p.ac,
            esimStatus: p.esimStatus,
          },
        });

        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'esim_created' },
        });

        return profile;
      }
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'esim_pending' },
    });
    return null;
  }

  private async addCommission(order: Order) {
    if (order.paymentMethod === 'vcash') return; // No commission for V-Cash
    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    if (!user) return;

    const referral = await this.prisma.referral.findFirst({
      where: { referredUserId: user.id },
    });
    if (!referral) return;

    const commissionCents = Math.round(order.amountCents * 0.1);
    await this.prisma.commission.create({
      data: {
        affiliateId: referral.affiliateId,
        orderId: order.id,
        orderType: 'stripe',
        amountCents: commissionCents,
        status: 'pending',
        availableAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    });
  }

  // -----------------------------------------------------------------------
  // Guest access token
  // -----------------------------------------------------------------------

  generateGuestToken(orderId: string, email: string): string {
    const secret = this.config.get<string>('GUEST_TOKEN_SECRET', 'changeme-guest-secret');
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ orderId, email, expiry })).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `${payload}.${sig}`;
  }

  verifyGuestToken(token: string, orderId: string, email: string): boolean {
    const secret = this.config.get<string>('GUEST_TOKEN_SECRET', 'changeme-guest-secret');
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expectedSig) return false;

    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      return data.orderId === orderId && data.email === email && Date.now() < data.expiry;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Order retrieval
  // -----------------------------------------------------------------------

  async getOrderOrThrow(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { esimProfile: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  async getOrderBySession(sessionId: string) {
    const session = await this.stripeService.retrieveSession(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId) throw new NotFoundException('Order not found for session');
    return this.getOrderOrThrow(orderId);
  }

  // -----------------------------------------------------------------------
  // Retry failed orders (called by cron)
  // -----------------------------------------------------------------------

  async retryFailedOrders() {
    const failedOrders = await this.prisma.order.findMany({
      where: {
        status: { in: ['esim_order_failed', 'esim_pending', 'esim_no_orderno'] as OrderStatus[] },
        receiptSent: false,
      },
    });

    for (const order of failedOrders) {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
      if (!user) continue;
      this.logger.log(`Retrying order ${order.id}`);
      await this.performEsimOrder(order, order.planName ?? order.planId);
    }
  }
}
