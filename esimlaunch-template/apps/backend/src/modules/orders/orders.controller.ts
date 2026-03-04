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
import { OrdersService } from './orders.service';
import { ReceiptService } from '../receipt/receipt.service';
import { PrismaService } from '../../prisma.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { OptionalClerkEmailGuard } from '../../common/guards/optional-clerk-email.guard';

@Controller('orders')
@UseGuards(CsrfGuard, OptionalClerkEmailGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly receiptService: ReceiptService,
    private readonly prisma: PrismaService,
  ) {}

  /** POST /api/orders — create a pending order */
  @Post()
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

  /** GET /api/orders/retry-now — trigger retry cycle (debugging) */
  @Get('retry-now')
  retryNow() {
    return this.ordersService.retryFailedOrders();
  }

  /** GET /api/orders/by-session/:sessionId */
  @Get('by-session/:sessionId')
  getBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.getOrderBySession(sessionId);
  }

  /** GET /api/orders/:id/receipt — PDF receipt (auth: x-user-email or token+email query) */
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

  /** GET /api/orders/:id */
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderOrThrow(id);
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
  validatePromo(
    @Param('orderId') orderId: string,
    @Body() body: { promoCode: string },
  ) {
    if (!body.promoCode) throw new BadRequestException('promoCode is required');
    return this.ordersService.validatePromo(orderId, body.promoCode);
  }

  /** POST /api/orders/:orderId/remove-promo */
  @Post(':orderId/remove-promo')
  removePromo(
    @Param('orderId') orderId: string,
    @Body() body: { originalAmountCents: number; originalDisplayAmountCents: number },
  ) {
    return this.ordersService.removePromo(
      orderId,
      body.originalAmountCents,
      body.originalDisplayAmountCents,
    );
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
    const user = await (this.ordersService as any).prisma.user.findUnique({
      where: { id: order.userId },
    });
    if (!user || user.email.toLowerCase() !== body.email.toLowerCase()) {
      throw new ForbiddenException('Email does not match order');
    }
    const token = this.ordersService.generateGuestToken(orderId, body.email);
    // Send email is handled by process – here just return the token
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
