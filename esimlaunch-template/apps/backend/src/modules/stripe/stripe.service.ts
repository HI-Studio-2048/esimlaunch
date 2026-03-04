import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(private config: ConfigService) {
    this.client = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }

  async createCheckoutSession(params: {
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    currency: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    return this.client.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: params.lineItems,
      currency: params.currency.toLowerCase(),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: params.metadata,
    });
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.client.checkout.sessions.retrieve(sessionId);
  }
}
