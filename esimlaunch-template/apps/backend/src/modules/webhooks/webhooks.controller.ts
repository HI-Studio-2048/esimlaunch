import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { TopUpService } from '../topup/topup.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';

/**
 * Webhooks are excluded from CSRF validation — they come from external services.
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private stripeService: StripeService,
    private ordersService: OrdersService,
    private topUpService: TopUpService,
    private affiliateService: AffiliateService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // -------------------------------------------------------------------------
  // Stripe webhook
  // -------------------------------------------------------------------------

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Raw body missing');
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    let event: import('stripe').default.Event;
    try {
      event = this.stripeService.verifyWebhookSignature(req.rawBody, signature);
    } catch (err: any) {
      this.logger.error('Stripe webhook signature verification failed', err.message);
      throw new BadRequestException('Invalid Stripe signature');
    }

    // Persist raw event for auditing
    await this.prisma.webhookEvent.create({
      data: {
        source: 'stripe',
        eventType: event.type,
        payload: event as unknown as object,
      },
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').default.Checkout.Session;
        if (session.metadata?.type === 'topup') {
          await this.topUpService.handleStripeTopUp(session);
        } else {
          await this.ordersService.handleStripePayment(session);
        }
        break;
      }
      case 'charge.refunded': {
        // Reverse commission on refund
        const charge = event.data.object as import('stripe').default.Charge;
        const paymentRef = charge.payment_intent as string;
        if (paymentRef) {
          await this.prisma.commission.updateMany({
            where: {
              order: { paymentRef },
            },
            data: { status: 'reversed' },
          });
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // -------------------------------------------------------------------------
  // Clerk webhook (user.created, user.updated)
  // -------------------------------------------------------------------------

  @Post('clerk')
  async handleClerk(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (webhookSecret && req.rawBody) {
      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(req.rawBody.toString(), {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (err: any) {
        this.logger.error('Clerk webhook signature verification failed', err.message);
        throw new BadRequestException('Invalid Clerk signature');
      }
    }

    const body = req.body as { type?: string; data?: Record<string, unknown> };
    const eventType = body.type ?? '';
    const data = body.data ?? {};

    await this.prisma.webhookEvent.create({
      data: {
        source: 'clerk',
        eventType,
        payload: data as object,
      },
    });

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const emailAddresses = (data.email_addresses as { email_address: string }[]) ?? [];
      const email = emailAddresses[0]?.email_address;
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined;
      const clerkId = data.id as string;

      if (email) {
        const user = await this.prisma.user.upsert({
          where: { email: email.toLowerCase() },
          create: { email: email.toLowerCase(), name, clerkId },
          update: { name, clerkId },
        });

        if (eventType === 'user.created') {
          // Create affiliate for new user
          await this.affiliateService.ensureAffiliate(user.id);
          // Link any guest orders
          await this.ordersService.linkGuestOrdersToUser(email, user.id);
        }
      }
    }

    return { received: true };
  }

  // -------------------------------------------------------------------------
  // eSIM provider webhook
  // -------------------------------------------------------------------------

  @Post('esim')
  async handleEsim(
    @Headers('x-webhook-secret') headerSecret: string,
    @Body() body: Record<string, unknown>,
  ) {
    const expectedSecret = this.config.get<string>('ESIM_WEBHOOK_SECRET');
    if (expectedSecret && headerSecret !== expectedSecret) {
      throw new BadRequestException('Invalid webhook secret');
    }

    await this.prisma.webhookEvent.create({
      data: {
        source: 'esim',
        eventType: String(body.event ?? 'unknown'),
        payload: body as object,
      },
    });

    // Process order/eSIM status updates from the provider
    // Add provider-specific handling here as needed
    this.logger.log(`eSIM webhook received: ${body.event}`);

    return { received: true };
  }
}
