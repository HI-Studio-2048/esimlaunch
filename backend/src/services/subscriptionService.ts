import Stripe from 'stripe';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: '2026-01-28.clover' as any,
});

export type SubscriptionPlan = 'starter' | 'growth' | 'scale';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface CreateSubscriptionParams {
  merchantId: string;
  plan: SubscriptionPlan;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export const subscriptionService = {
  /**
   * Create or get Stripe customer for merchant
   */
  async getOrCreateStripeCustomer(merchantId: string, email: string): Promise<string> {
    // Check if merchant already has a Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { merchantId },
      select: { stripeCustomerId: true },
    });

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        merchantId,
      },
    });

    return customer.id;
  },

  /**
   * Create subscription
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<any> {
    const { merchantId, plan, paymentMethodId } = params;

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { email: true },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get or create Stripe customer
    const stripeCustomerId = await this.getOrCreateStripeCustomer(merchantId, merchant.email);

    // Get plan price ID from environment based on plan and billing period
    const planPriceIds: Record<SubscriptionPlan, Record<'monthly' | 'yearly', string>> = {
      starter: {
        monthly: env.stripeStarterPriceIdMonthly || '',
        yearly: env.stripeStarterPriceIdYearly || '',
      },
      growth: {
        monthly: env.stripeGrowthPriceIdMonthly || '',
        yearly: env.stripeGrowthPriceIdYearly || '',
      },
      scale: {
        monthly: env.stripeScalePriceIdMonthly || '',
        yearly: env.stripeScalePriceIdYearly || '',
      },
    };

    const priceId = planPriceIds[plan][params.billingPeriod];
    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${plan} (${params.billingPeriod})`);
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 14, // 14-day free trial
      metadata: {
        merchantId,
        plan,
      },
    });

    // Calculate period dates (cast to any — Stripe SDK types vary by API version)
    const sub = subscription as any;
    const currentPeriodStart = new Date(sub.current_period_start * 1000);
    const currentPeriodEnd = new Date(sub.current_period_end * 1000);

    // Store subscription in database (including billingPeriod)
    const dbSubscription = await prisma.subscription.upsert({
      where: { merchantId },
      update: {
        plan,
        billingPeriod: params.billingPeriod,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart,
        currentPeriodEnd,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
        updatedAt: new Date(),
      },
      create: {
        merchantId,
        plan,
        billingPeriod: params.billingPeriod,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart,
        currentPeriodEnd,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
      },
    });

    return {
      ...dbSubscription,
      stripeSubscription: subscription,
    };
  },

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    merchantId: string,
    newPlan: SubscriptionPlan,
    billingPeriod?: 'monthly' | 'yearly'
  ): Promise<any> {
    const subscription = await prisma.subscription.findUnique({
      where: { merchantId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('Subscription not found');
    }

    // Preserve current billing period from DB when not specified
    const currentBillingPeriod = (billingPeriod || subscription.billingPeriod || 'monthly') as 'monthly' | 'yearly';

    // Get new plan price ID
    const planPriceIds: Record<SubscriptionPlan, Record<'monthly' | 'yearly', string>> = {
      starter: {
        monthly: env.stripeStarterPriceIdMonthly || '',
        yearly: env.stripeStarterPriceIdYearly || '',
      },
      growth: {
        monthly: env.stripeGrowthPriceIdMonthly || '',
        yearly: env.stripeGrowthPriceIdYearly || '',
      },
      scale: {
        monthly: env.stripeScalePriceIdMonthly || '',
        yearly: env.stripeScalePriceIdYearly || '',
      },
    };

    const newPriceId = planPriceIds[newPlan][currentBillingPeriod];
    if (!newPriceId) {
      throw new Error(`Price ID not configured for plan: ${newPlan} (${currentBillingPeriod})`);
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Prorate the difference
      metadata: {
        ...stripeSubscription.metadata,
        plan: newPlan,
      },
    });

    // Update database (preserve billing period; Stripe price implies it)
    const dbSubscription = await prisma.subscription.update({
      where: { merchantId },
      data: {
        plan: newPlan,
        billingPeriod: currentBillingPeriod,
        status: updatedSubscription.status as SubscriptionStatus,
        currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
        updatedAt: new Date(),
      },
    });

    return dbSubscription;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(merchantId: string, cancelImmediately: boolean = false): Promise<any> {
    const subscription = await prisma.subscription.findUnique({
      where: { merchantId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('Subscription not found');
    }

    let updatedStripeSubscription: Stripe.Subscription;

    if (cancelImmediately) {
      // Cancel immediately
      updatedStripeSubscription = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } else {
      // Cancel at period end
      updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update database
    const dbSubscription = await prisma.subscription.update({
      where: { merchantId },
      data: {
        status: updatedStripeSubscription.status as SubscriptionStatus,
        cancelAtPeriodEnd: updatedStripeSubscription.cancel_at_period_end || false,
        updatedAt: new Date(),
      },
    });

    return dbSubscription;
  },

  /**
   * Get subscription
   */
  async getSubscription(merchantId: string) {
    return prisma.subscription.findUnique({
      where: { merchantId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 invoices
        },
      },
    });
  },

  /**
   * Get invoices
   */
  async getInvoices(merchantId: string) {
    return prisma.invoice.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Handle subscription webhook
   */
  async handleSubscriptionWebhook(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;

    // Find merchant by Stripe customer ID
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) {
      console.warn(`Subscription not found for Stripe subscription ${subscription.id}`);
      return;
    }

    const metadata = subscription.metadata || {};
    const planFromStripe = (metadata.plan as SubscriptionPlan) || dbSubscription.plan;

    // Update subscription status and plan (sync from Stripe metadata)
    await prisma.subscription.update({
      where: { merchantId: dbSubscription.merchantId },
      data: {
        plan: planFromStripe,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Handle invoice webhook
   */
  async handleInvoiceWebhook(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    const invoiceAny = invoice as any;
    if (!invoiceAny.customer || !invoiceAny.subscription) {
      return;
    }

    // Find subscription
    const subscriptionId = typeof invoiceAny.subscription === 'string' 
      ? invoiceAny.subscription 
      : invoiceAny.subscription.id;

    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!dbSubscription) {
      return;
    }

    // Create or update invoice
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        amount: BigInt(invoice.amount_paid),
        currency: invoice.currency,
        status: invoice.status || 'open',
        invoicePdf: invoice.invoice_pdf || null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        updatedAt: new Date(),
      },
      create: {
        merchantId: dbSubscription.merchantId,
        subscriptionId: dbSubscription.id,
        stripeInvoiceId: invoice.id,
        amount: BigInt(invoice.amount_paid),
        currency: invoice.currency,
        status: invoice.status || 'open',
        invoicePdf: invoice.invoice_pdf || null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      },
    });
  },
};

