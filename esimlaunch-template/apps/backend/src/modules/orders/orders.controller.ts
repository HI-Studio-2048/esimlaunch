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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';

@Controller('orders')
@UseGuards(CsrfGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
