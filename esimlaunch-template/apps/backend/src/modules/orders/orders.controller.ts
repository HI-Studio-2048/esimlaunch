import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Res,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { OrdersService } from './orders.service';
import { ReceiptService } from '../receipt/receipt.service';
import { PrismaService } from '../../prisma.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { OptionalClerkEmailGuard } from '../../common/guards/optional-clerk-email.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('orders')
@UseGuards(CsrfGuard, OptionalClerkEmailGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly receiptService: ReceiptService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** POST /api/orders — create a pending order */
  @Post()
  @RateLimit({ limit: 5, window: 30 })
  createOrder(
    @Body()
    body: {
      planCode: string;
      planName?: string;
      amountUsd: number;
      displayCurrency?: string;
      email?: string;
      referralCode?: string;
      paymentMethod?: 'stripe' | 'vcash';
    },
  ) {
    if (!body.planCode) throw new BadRequestException('planCode is required');
    return this.ordersService.createPendingOrder(body);
  }

  /** GET /api/orders/retry-now — trigger retry cycle (admin only) */
  @Get('retry-now')
  retryNow(@Req() req: any) {
    const adminSecret = this.config.get<string>('ADMIN_RETRY_SECRET');
    const provided: string | undefined = req.headers['x-admin-secret'];

    if (!adminSecret || !provided || provided.length !== adminSecret.length) {
      throw new ForbiddenException('Not authorized');
    }

    const isValid = timingSafeEqual(Buffer.from(provided), Buffer.from(adminSecret));
    if (!isValid) {
      throw new ForbiddenException('Not authorized');
    }

    return this.ordersService.retryFailedOrders();
  }

  /** GET /api/orders/by-session/:sessionId — session ID is only known to the checkout creator */
  @Get('by-session/:sessionId')
  getBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.getOrderBySession(sessionId);
  }

  /** GET /api/orders/:id/receipt — PDF receipt (auth: Bearer token or token+email query) */
  @Get(':id/receipt')
  async getReceipt(
    @Param('id') id: string,
    @Query('token') token: string,
    @Query('email') email: string,
    @Res() res: Response,
    @Req() req: { userEmail?: string; userId?: string },
  ) {
    const order = await this.ordersService.getOrderOrThrow(id);
    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    if (!user) throw new ForbiddenException('Order has no user');

    let authorized = false;
    if (req.userEmail && req.userEmail.toLowerCase() === user.email.toLowerCase()) authorized = true;
    if (token && email && this.ordersService.verifyGuestToken(token, id, email)) {
      if (email.toLowerCase() === user.email.toLowerCase()) authorized = true;
    }
    if (!authorized) throw new ForbiddenException('Not authorized to access this receipt');

    const pdf = await this.receiptService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
    res.send(pdf);
  }

  /** POST /api/orders/:id/resend-receipt — resend receipt email */
  @Post(':id/resend-receipt')
  async resendReceipt(
    @Param('id') id: string,
    @Query('token') token: string,
    @Query('email') email: string,
    @Req() req: { userEmail?: string; userId?: string },
  ) {
    const order = await this.ordersService.getOrderOrThrow(id);
    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    if (!user) throw new ForbiddenException('Order has no user');

    let authorized = false;
    if (req.userEmail && req.userEmail.toLowerCase() === user.email.toLowerCase()) authorized = true;
    if (token && email && this.ordersService.verifyGuestToken(token, id, email)) {
      if (email.toLowerCase() === user.email.toLowerCase()) authorized = true;
    }
    if (!authorized) throw new ForbiddenException('Not authorized to resend receipt');

    await this.receiptService.resendReceipt(id);
    return { success: true, message: 'Receipt email sent' };
  }

  /** GET /api/orders/:id — requires auth or guest token (pending orders accessible without auth) */
  @Get(':id')
  async getOrder(
    @Param('id') id: string,
    @Query('token') token: string,
    @Query('email') email: string,
    @Req() req: { userEmail?: string; userId?: string },
  ) {
    const order = await this.ordersService.getOrderOrThrow(id);

    // Pending orders are accessible without auth (still in checkout flow, no sensitive eSIM data)
    if (order.status === 'pending') {
      return order;
    }

    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });

    let authorized = false;

    // Auth method 1: Clerk session (email match)
    if (req.userEmail && user && req.userEmail.toLowerCase() === user.email.toLowerCase()) {
      authorized = true;
    }

    // Auth method 2: Guest token
    if (!authorized && token && email && this.ordersService.verifyGuestToken(token, id, email)) {
      if (user && email.toLowerCase() === user.email.toLowerCase()) {
        authorized = true;
      }
    }

    if (!authorized) {
      throw new ForbiddenException('Not authorized to view this order. Please sign in or use your access link.');
    }

    return order;
  }

  /** POST /api/orders/:orderId/update-email */
  @Post(':orderId/update-email')
  updateEmail(
    @Param('orderId') orderId: string,
    @Body() body: { email: string },
  ) {
    if (!body.email) throw new BadRequestException('email is required');
    return this.ordersService.updateOrderEmail(orderId, body.email);
  }

  /** POST /api/orders/:orderId/validate-promo */
  @Post(':orderId/validate-promo')
  @RateLimit({ limit: 10, window: 60 })
  validatePromo(
    @Param('orderId') orderId: string,
    @Body() body: { promoCode: string },
  ) {
    if (!body.promoCode) throw new BadRequestException('promoCode is required');
    return this.ordersService.validatePromo(orderId, body.promoCode);
  }

  /** POST /api/orders/:orderId/remove-promo */
  @Post(':orderId/remove-promo')
  removePromo(@Param('orderId') orderId: string) {
    return this.ordersService.removePromo(orderId);
  }

  /** GET /api/orders/:orderId/referral-discount?referralCode=XXX */
  @Get(':orderId/referral-discount')
  checkReferralDiscount(
    @Param('orderId') orderId: string,
    @Query('referralCode') referralCode: string,
  ) {
    if (!referralCode) throw new BadRequestException('referralCode is required');
    return this.ordersService.checkReferralDiscount(orderId, referralCode);
  }

  /** POST /api/orders/:id/pay-vcash — pay pending order with Store Credit */
  @Post(':id/pay-vcash')
  async payWithVcash(
    @Param('id') orderId: string,
    @Req() req: { userId?: string; userEmail?: string },
  ) {
    if (!req.userId) throw new ForbiddenException('Signed-in user required for Store Credit');
    return this.ordersService.payOrderWithVcash(orderId, req.userId);
  }

  /** POST /api/orders/:orderId/checkout — create Stripe Checkout Session */
  @Post(':orderId/checkout')
  @RateLimit({ limit: 5, window: 30 })
  createCheckout(
    @Param('orderId') orderId: string,
    @Body() body: { referralCode?: string },
  ) {
    return this.ordersService.createStripeCheckout(orderId, body.referralCode);
  }

  /** POST /api/orders/:orderId/request-guest-access */
  @Post(':orderId/request-guest-access')
  async requestGuestAccess(
    @Param('orderId') orderId: string,
    @Body() body: { email: string },
  ) {
    const order = await this.ordersService.getOrderOrThrow(orderId);
    const user = await this.prisma.user.findUnique({
      where: { id: order.userId },
    });
    if (!user || user.email.toLowerCase() !== body.email.toLowerCase()) {
      throw new ForbiddenException('Email does not match order');
    }
    const token = this.ordersService.generateGuestToken(orderId, body.email);

    // Build guest access URL
    const webUrl = this.config.get<string>('WEB_APP_URL') || 'http://localhost:3100';
    const guestUrl = `${webUrl}/orders/${orderId}/guest?token=${encodeURIComponent(token)}&email=${encodeURIComponent(body.email)}`;

    // Send email with guest access link
    await this.ordersService.sendGuestAccessEmail(body.email, guestUrl, orderId);

    return { success: true, message: 'Access link sent to your email' };
  }

  /** GET /api/orders/:orderId/guest?token=...&email=... */
  @Get(':orderId/guest')
  async getGuestOrder(
    @Param('orderId') orderId: string,
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    if (!token || !email) throw new BadRequestException('token and email are required');
    const valid = this.ordersService.verifyGuestToken(token, orderId, email);
    if (!valid) throw new ForbiddenException('Invalid or expired token');
    return this.ordersService.getOrderOrThrow(orderId);
  }
}
