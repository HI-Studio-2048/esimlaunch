import Stripe from 'stripe';
import { env, STRIPE_API_VERSION } from '../config/env';
import { prisma } from '../lib/prisma';
import { preferencesService } from './preferencesService';

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: STRIPE_API_VERSION as any,
});

/** Convert Stripe timestamp (Unix seconds or ms) or Date to valid Date. Stripe SDK types vary by API version. */
function stripeTimestampToDate(v: unknown): Date {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN;
  if (!isNaN(n)) {
    const d = new Date(n >= 1e12 ? n : n * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Get period dates from Stripe subscription. Checks top-level, items.data[0], and trial_start/trial_end. */
function getSubscriptionPeriodDates(sub: any): { start: Date; end: Date } {
  const startVal = sub.current_period_start ?? sub.items?.data?.[0]?.current_period_start ?? sub.trial_start ?? sub.created;
  const endVal = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? sub.trial_end;
  const start = stripeTimestampToDate(startVal);
  let end = stripeTimestampToDate(endVal);
  // If end still invalid/same-day but we have trial_end, use it (trialing subs)
  if (sub.trial_end && (end.getTime() <= start.getTime() || isNaN(end.getTime()))) {
    end = stripeTimestampToDate(sub.trial_end);
  }
  return { start, end };
}

export type SubscriptionPlan = 'starter' | 'growth' | 'scale' | 'test' | 'api_only';
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
    // Check if merchant already has a Stripe customer ID (from subscription or from setup-intent)
    const subscription = await prisma.subscription.findUnique({
      where: { merchantId },
      select: { stripeCustomerId: true },
    });

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Check preference (e.g. customer created during setup-intent before subscription existed)
    const storedCustomerId = await preferencesService.get<string>(merchantId, 'stripe_customer_id');
    if (storedCustomerId) {
      return storedCustomerId;
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

    // API Only plan: free, no Stripe
    if (plan === 'api_only') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setFullYear(periodEnd.getFullYear() + 100); // Effectively perpetual
      const dbSubscription = await prisma.subscription.upsert({
        where: { merchantId },
        update: {
          plan: 'api_only',
          billingPeriod: 'monthly',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          updatedAt: new Date(),
        },
        create: {
          merchantId,
          plan: 'api_only',
          billingPeriod: 'monthly',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
        },
      });
      return dbSubscription;
    }

    // Get or create Stripe customer
    const stripeCustomerId = await this.getOrCreateStripeCustomer(merchantId, merchant.email);

    // Get plan price ID from environment based on plan and billing period
    const planPriceIds: Record<Exclude<SubscriptionPlan, 'api_only'>, Record<'monthly' | 'yearly', string>> = {
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
      test: {
        monthly: env.stripeTestPriceIdMonthly || '',
        yearly: env.stripeTestPriceIdYearly || '',
      },
    };

    const priceId = planPriceIds[plan][params.billingPeriod];
    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${plan} (${params.billingPeriod})`);
    }

    // Attach payment method if provided (skip if already attached to our customer from setup-intent)
    if (paymentMethodId) {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      const attachedTo = typeof pm.customer === 'string' ? pm.customer : (pm.customer as any)?.id ?? null;
      if (attachedTo !== stripeCustomerId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });
      }

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
      trial_period_days: 7, // 7-day free trial
      metadata: {
        merchantId,
        plan,
      },
    });

    const { start: currentPeriodStart, end: currentPeriodEnd } = getSubscriptionPeriodDates(subscription as any);

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
   * Only supports Stripe-backed plans; api_only cannot be set via this method.
   */
  async updateSubscription(
    merchantId: string,
    newPlan: Exclude<SubscriptionPlan, 'api_only'>,
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

    // Get new plan price ID (excludes api_only - no Stripe)
    const planPriceIds: Record<Exclude<SubscriptionPlan, 'api_only'>, Record<'monthly' | 'yearly', string>> = {
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
      test: {
        monthly: env.stripeTestPriceIdMonthly || '',
        yearly: env.stripeTestPriceIdYearly || '',
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
        currentPeriodStart: getSubscriptionPeriodDates(updatedSubscription as any).start,
        currentPeriodEnd: getSubscriptionPeriodDates(updatedSubscription as any).end,
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
   * Get subscription. Auto-syncs period dates from Stripe if they look wrong (e.g. same-day from old API bug).
   */
  async getSubscription(merchantId: string) {
    let subscription = await prisma.subscription.findUnique({
      where: { merchantId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 invoices
        },
      },
    });

    // Self-heal: if we have a Stripe sub but period dates look wrong (same day = 0 trial), sync from Stripe
    if (subscription?.stripeSubscriptionId) {
      const start = subscription.currentPeriodStart.getTime();
      const end = subscription.currentPeriodEnd.getTime();
      const sameDay = start === end || (end - start) < 24 * 60 * 60 * 1000;
      if (sameDay && subscription.status === 'trialing') {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
            expand: ['items.data'],
          });
          const { start: correctStart, end: correctEnd } = getSubscriptionPeriodDates(stripeSub as any);
          if (correctEnd.getTime() - correctStart.getTime() > 24 * 60 * 60 * 1000) {
            subscription = await prisma.subscription.update({
              where: { merchantId },
              data: { currentPeriodStart: correctStart, currentPeriodEnd: correctEnd },
              include: {
                invoices: { orderBy: { createdAt: 'desc' as const }, take: 10 },
              },
            });
          }
        } catch (e) {
          console.warn('Could not sync subscription dates from Stripe:', (e as Error).message);
        }
      }
    }

    return subscription;
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
        currentPeriodStart: getSubscriptionPeriodDates(subscription as any).start,
        currentPeriodEnd: getSubscriptionPeriodDates(subscription as any).end,
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

