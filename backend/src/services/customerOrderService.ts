import { prisma } from '../lib/prisma';
import { BalanceTransactionType, OrderStatus } from '@prisma/client';
import { esimAccessService, PLATFORM_PRICE_MARKUP } from './esimAccessService';
import { emailService } from './emailService';
import { qrCodeService } from './qrCodeService';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const ORDER_TOKEN_SECRET = env.jwtSecret;
const ORDER_TOKEN_EXPIRY = '7d';

export function generateOrderToken(orderId: string, email: string): string {
  return jwt.sign({ orderId, email, type: 'order_access' }, ORDER_TOKEN_SECRET, {
    expiresIn: ORDER_TOKEN_EXPIRY,
  });
}

export function verifyOrderToken(token: string): { orderId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, ORDER_TOKEN_SECRET) as any;
    if (decoded.type !== 'order_access') return null;
    return { orderId: decoded.orderId, email: decoded.email };
  } catch {
    return null;
  }
}

export interface CreateCustomerOrderParams {
  customerEmail: string;
  customerName?: string;
  customerId?: string; // Link to Customer account if exists
  storeId: string;
  merchantId: string;
  paymentIntentId?: string;
  totalAmount: number; // Amount in cents
  packageInfoList: Array<{
    packageCode?: string;
    slug?: string;
    count: number;
    price?: number;
  }>;
  metadata?: Record<string, any>;
}

export const customerOrderService = {
  /**
   * Create a customer order from a purchase
   */
  async createCustomerOrder(params: CreateCustomerOrderParams) {
    const {
      customerEmail,
      customerName,
      customerId,
      storeId,
      merchantId,
      paymentIntentId,
      totalAmount,
      packageInfoList,
      metadata = {},
    } = params;

    // If customerId not provided, try to find customer by email
    let linkedCustomerId = customerId;
    if (!linkedCustomerId) {
      const customer = await prisma.customer.findUnique({
        where: { email: customerEmail },
        select: { id: true },
      });
      linkedCustomerId = customer?.id ?? undefined;
    }

    // Calculate package count
    const packageCount = packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0);

    // Create customer order row first so we always have a record of the attempt
    const customerOrder = await prisma.customerOrder.create({
      data: {
        customerId: linkedCustomerId,
        customerEmail,
        customerName: customerName || null,
        storeId,
        merchantId,
        paymentIntentId: paymentIntentId || null,
        totalAmount: BigInt(totalAmount), // amount in cents charged to customer
        packageCount,
        status: OrderStatus.PENDING,
      },
    });

    // Create merchant order via eSIM Access API and deduct merchant balance
    try {
      const transactionId = `customer_${customerOrder.id}_${Date.now()}`;

      // Resolve wholesale amount (1/10000 USD) and enrich packageInfoList from eSIM Access catalog.
      // totalAmount is the customer-facing price in cents; eSIM Access expects the wholesale price.
      const resolved = await esimAccessService.resolveOrderFromPackages(packageInfoList);
      const wholesaleAmount = resolved.amount; // 1/10000 USD
      const enrichedPackageInfoList = resolved.enrichedPackageInfoList;

      // Merchant is charged the marked-up wholesale price (same formula as Advanced Way in api.ts)
      const merchantChargeCents = Math.round((Number(wholesaleAmount) * PLATFORM_PRICE_MARKUP) / 100);

      // Step 1: Atomic balance deduction (same pattern as Advanced Way in api.ts)
      // The WHERE clause ensures deduction only happens if merchant has sufficient balance.
      let deducted = false;
      try {
        const result = await prisma.$executeRaw`
          UPDATE "Merchant"
          SET balance = balance - ${BigInt(merchantChargeCents)}
          WHERE id = ${merchantId}
            AND balance >= ${BigInt(merchantChargeCents)}
        `;
        deducted = result > 0;
      } catch (err) {
        console.error('[CustomerOrder] Balance deduction failed:', err);
      }

      if (!deducted) {
        await prisma.customerOrder.update({
          where: { id: customerOrder.id },
          data: { status: OrderStatus.FAILED },
        });
        const err: any = new Error('Insufficient balance');
        err.code = 'INSUFFICIENT_BALANCE';
        throw err;
      }

      // Step 2: Call eSIM Access API with wholesale amount (1/10000 USD)
      let orderResult: any;
      try {
        orderResult = await esimAccessService.orderProfiles({
          transactionId,
          amount: wholesaleAmount,
          packageInfoList: enrichedPackageInfoList.map((pkg) => ({
            packageCode: pkg.packageCode,
            slug: pkg.slug,
            count: pkg.count,
            price: pkg.price,
          })),
        });
      } catch (apiError: any) {
        // API call threw — refund merchant balance with audit trail
        console.error('[CustomerOrder] eSIM Access API call failed, refunding merchant:', {
          merchantId,
          merchantChargeCents,
          error: apiError?.message,
        });
        await prisma.$transaction([
          prisma.merchant.update({
            where: { id: merchantId },
            data: { balance: { increment: BigInt(merchantChargeCents) } },
          }),
          prisma.balanceTransaction.create({
            data: {
              merchantId,
              amount: BigInt(merchantChargeCents),
              type: BalanceTransactionType.REFUND,
              description: `Refund: eSIM provider API error — ${apiError?.message || 'unknown error'}`,
            },
          }),
        ]);
        throw apiError;
      }

      if (!orderResult.success || !orderResult.obj?.orderNo) {
        // API returned failure — refund merchant balance with audit trail
        const errMessage = orderResult.errorMessage || 'Failed to create eSIM order';
        console.error('[CustomerOrder] eSIM Access rejected order, refunding merchant:', {
          merchantId,
          merchantChargeCents,
          errorCode: orderResult.errorCode,
          errorMessage: errMessage,
        });
        await prisma.$transaction([
          prisma.merchant.update({
            where: { id: merchantId },
            data: { balance: { increment: BigInt(merchantChargeCents) } },
          }),
          prisma.balanceTransaction.create({
            data: {
              merchantId,
              amount: BigInt(merchantChargeCents),
              type: BalanceTransactionType.REFUND,
              description: `Refund: eSIM provider rejected order — ${orderResult.errorCode || 'unknown'}: ${errMessage}`,
            },
          }),
        ]);
        throw new Error(errMessage);
      }

      // Step 3: Create records in a transaction (balance already deducted)
      const { merchantOrder } = await prisma.$transaction(async (tx) => {
        // Create merchant order record
        // Store totalAmount in 1/10000 USD (wholesale) for consistency with Advanced Way orders
        const merchantOrder = await tx.order.create({
          data: {
            merchantId,
            transactionId,
            esimAccessOrderNo: orderResult.obj.orderNo,
            status: OrderStatus.PROCESSING,
            totalAmount: BigInt(wholesaleAmount), // 1/10000 USD (wholesale), consistent with Advanced Way
            packageCount,
            customerOrderId: customerOrder.id,
          },
        });

        // Link customer order to merchant order & update status
        await tx.customerOrder.update({
          where: { id: customerOrder.id },
          data: {
            orderId: merchantOrder.id,
            esimAccessOrderNo: orderResult.obj.orderNo,
            status: OrderStatus.PROCESSING,
          },
        });

        // Record balance transaction (balance already deducted atomically above)
        await tx.balanceTransaction.create({
          data: {
            merchantId,
            orderId: merchantOrder.id,
            amount: BigInt(-merchantChargeCents),
            type: BalanceTransactionType.ORDER,
            description: `Customer store order ${orderResult.obj.orderNo} - ${packageCount} package(s)`,
          },
        });

        return { merchantOrder };
      });

        // Send order confirmation email
        try {
          await emailService.sendOrderConfirmationEmail({
            email: customerEmail,
            order: {
              id: customerOrder.id,
              totalAmount: totalAmount,
              status: OrderStatus.PROCESSING,
              createdAt: customerOrder.createdAt.toISOString(),
            },
            packages: packageInfoList.map(pkg => ({
              data: pkg.slug || pkg.packageCode || '',
            })),
            customerName: customerName || undefined,
          });
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
        }

        // Trigger affiliate commission if merchant was referred
        try {
          const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: { referredBy: true },
          });
          if (merchant?.referredBy) {
            const { affiliateService } = await import('./affiliateService');
            await affiliateService.createCommission({
              affiliateId: merchant.referredBy,
              referredMerchantId: merchantId,
              customerOrderId: customerOrder.id,
              amount: totalAmount,
              commissionRate: 10,
            });
          }
        } catch (commissionError) {
          console.error('Failed to create affiliate commission:', commissionError);
        }

        return {
          ...customerOrder,
          orderId: merchantOrder.id,
          esimAccessOrderNo: (orderResult as any).obj?.orderNo,
        };
    } catch (error: any) {
      // Update customer order status to failed
      await prisma.customerOrder.update({
        where: { id: customerOrder.id },
        data: {
          status: OrderStatus.FAILED,
        },
      });

      throw error;
    }
  },

  /**
   * Link customer order to merchant order
   */
  async linkToMerchantOrder(customerOrderId: string, merchantOrderId: string) {
    return prisma.customerOrder.update({
      where: { id: customerOrderId },
      data: {
        orderId: merchantOrderId,
      },
    });
  },

  /**
   * Update customer order status
   */
  async updateStatus(customerOrderId: string, status: OrderStatus) {
    return prisma.customerOrder.update({
      where: { id: customerOrderId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Get customer orders by email
   */
  async getByEmail(email: string) {
    return prisma.customerOrder.findMany({
      where: {
        customerEmail: email,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
        order: {
          select: {
            id: true,
            esimAccessOrderNo: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Get customer order by ID
   */
  async getById(orderId: string) {
    return prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            businessName: true,
            primaryColor: true,
            logoUrl: true,
          },
        },
        order: {
          select: {
            id: true,
            esimAccessOrderNo: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  },

  /**
   * Get customer order by payment intent ID
   */
  async getByPaymentIntentId(paymentIntentId: string) {
    return prisma.customerOrder.findUnique({
      where: { paymentIntentId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
        order: {
          select: {
            id: true,
            esimAccessOrderNo: true,
            status: true,
          },
        },
      },
    });
  },
};

