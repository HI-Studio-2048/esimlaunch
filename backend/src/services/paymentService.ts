import Stripe from 'stripe';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
});

export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents
  currency?: string;
  metadata?: Record<string, string>;
  merchantId?: string;
  storeId?: string;
}

export interface ConfirmPaymentParams {
  paymentIntentId: string;
  metadata?: Record<string, string>;
}

export const paymentService = {
  /**
   * Create a Stripe payment intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    const { amount, currency = 'usd', metadata = {}, merchantId, storeId } = params;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        ...(merchantId && { merchantId }),
        ...(storeId && { storeId }),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent in database
    await prisma.paymentIntent.create({
      data: {
        stripeIntentId: paymentIntent.id,
        merchantId: merchantId || null,
        storeId: storeId || null,
        amount: BigInt(amount),
        currency,
        status: paymentIntent.status,
        metadata: metadata as any,
      },
    });

    return paymentIntent;
  },

  /**
   * Confirm a payment intent
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<Stripe.PaymentIntent> {
    const { paymentIntentId, metadata = {} } = params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update database record
      await prisma.paymentIntent.updateMany({
        where: { stripeIntentId: paymentIntentId },
        data: {
          status: paymentIntent.status,
          metadata: { ...(paymentIntent.metadata as any), ...metadata },
          updatedAt: new Date(),
        },
      });
    }

    return paymentIntent;
  },

  /**
   * Process a refund
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update payment intent status if fully refunded
    if (refund.status === 'succeeded') {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const updatedStatus = paymentIntent.amount === refund.amount ? 'refunded' : paymentIntent.status;

      await prisma.paymentIntent.updateMany({
        where: { stripeIntentId: paymentIntentId },
        data: {
          status: updatedStatus,
          updatedAt: new Date(),
        },
      });
    }

    return refund;
  },

  /**
   * Handle Stripe webhook event
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.succeeded':
        // Handle charge succeeded (backup to payment_intent.succeeded)
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            typeof charge.payment_intent === 'string' 
              ? charge.payment_intent 
              : charge.payment_intent.id
          );
          if (paymentIntent.status === 'succeeded') {
            await this.handlePaymentSucceeded(paymentIntent);
          }
        }
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
      case 'charge.failed':
        await this.handleChargeFailed(event.data.object as Stripe.Charge);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionEvent(event);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed':
        await this.handleInvoiceEvent(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  },

  /**
   * Handle subscription events
   */
  async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    const { subscriptionService } = await import('./subscriptionService');
    await subscriptionService.handleSubscriptionWebhook(event);
  },

  /**
   * Handle invoice events
   */
  async handleInvoiceEvent(event: Stripe.Event): Promise<void> {
    const { subscriptionService } = await import('./subscriptionService');
    await subscriptionService.handleInvoiceWebhook(event);
  },

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Update payment intent status
    await prisma.paymentIntent.updateMany({
      where: { stripeIntentId: paymentIntent.id },
      data: {
        status: paymentIntent.status,
        updatedAt: new Date(),
      },
    });

    // Create customer order as backup if not already created
    // This ensures orders are created even if frontend confirmation fails
    try {
      const metadata = paymentIntent.metadata;
      if (metadata.storeId && metadata.customerEmail && metadata.packageInfoList) {
        // Check if customer order already exists
        const existingOrder = await prisma.customerOrder.findUnique({
          where: { paymentIntentId: paymentIntent.id },
        });

        if (!existingOrder) {
          // Get store to find merchant ID
          const store = await prisma.store.findUnique({
            where: { id: metadata.storeId },
            select: { merchantId: true },
          });

          if (store) {
            const { customerOrderService } = await import('./customerOrderService');
            
            // Parse package info list from metadata
            let packageInfoList: Array<{ slug?: string; count: number; price?: number }> = [];
            try {
              packageInfoList = JSON.parse(metadata.packageInfoList);
            } catch {
              // If parsing fails, create a default entry
              packageInfoList = [{ count: 1, price: paymentIntent.amount }];
            }

            await customerOrderService.createCustomerOrder({
              customerEmail: metadata.customerEmail,
              customerName: metadata.customerName || undefined,
              storeId: metadata.storeId,
              merchantId: store.merchantId,
              paymentIntentId: paymentIntent.id,
              totalAmount: paymentIntent.amount,
              packageInfoList,
              metadata: metadata as any,
            });

            console.log(`Customer order created via webhook for payment intent ${paymentIntent.id}`);
          }
        }
      }
    } catch (error: any) {
      // Log error but don't fail webhook processing
      console.error('Error creating customer order in webhook:', error);
    }
  },

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await prisma.paymentIntent.updateMany({
      where: { stripeIntentId: paymentIntent.id },
      data: {
        status: paymentIntent.status,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Handle canceled payment
   */
  async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await prisma.paymentIntent.updateMany({
      where: { stripeIntentId: paymentIntent.id },
      data: {
        status: 'canceled',
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Handle refund
   */
  async handleRefund(charge: Stripe.Charge): Promise<void> {
    if (charge.payment_intent) {
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent.id;

      // Update payment intent status
      await prisma.paymentIntent.updateMany({
        where: { stripeIntentId: paymentIntentId },
        data: {
          status: 'refunded',
          updatedAt: new Date(),
        },
      });

      // Update customer order status if exists
      const customerOrder = await prisma.customerOrder.findUnique({
        where: { paymentIntentId },
      });

      if (customerOrder) {
        await prisma.customerOrder.update({
          where: { id: customerOrder.id },
          data: {
            status: 'CANCELLED', // Or create a REFUNDED status
            updatedAt: new Date(),
          },
        });
      }
    }
  },

  /**
   * Handle failed charge
   */
  async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    if (charge.payment_intent) {
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent.id;

      await prisma.paymentIntent.updateMany({
        where: { stripeIntentId: paymentIntentId },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });
    }
  },

  /**
   * Get payment intent by Stripe ID
   */
  async getPaymentIntent(stripeIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      return await stripe.paymentIntents.retrieve(stripeIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return null;
    }
  },
};

