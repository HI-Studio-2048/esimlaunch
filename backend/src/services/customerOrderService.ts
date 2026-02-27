import { prisma } from '../lib/prisma';
import { BalanceTransactionType, OrderStatus } from '@prisma/client';
import { esimAccessService } from './esimAccessService';
import { emailService } from './emailService';
import { qrCodeService } from './qrCodeService';

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

      const result = await prisma.$transaction(async (tx) => {
        // Check merchant balance (stored in cents)
        const merchant = await tx.merchant.findUnique({
          where: { id: merchantId },
          select: { balance: true },
        });

        if (!merchant) {
          throw new Error('MERCHANT_NOT_FOUND');
        }

        const currentBalance = Number(merchant.balance || 0n);
        if (currentBalance < totalAmount) {
          const err: any = new Error('Insufficient balance');
          err.code = 'INSUFFICIENT_BALANCE';
          throw err;
        }

        // Call eSIM Access API (method is orderProfiles, not createOrder)
        const orderResult = await esimAccessService.orderProfiles({
          transactionId,
          amount: totalAmount,
          packageInfoList: packageInfoList.map((pkg) => ({
            packageCode: pkg.packageCode,
            slug: pkg.slug,
            count: pkg.count,
            price: pkg.price,
          })),
        });

        if (!orderResult.success || !orderResult.obj?.orderNo) {
          const errMessage = orderResult.errorMessage || 'Failed to create eSIM order';
          throw new Error(errMessage);
        }

        // Create merchant order record
        const merchantOrder = await tx.order.create({
          data: {
            merchantId,
            transactionId,
            esimAccessOrderNo: orderResult.obj.orderNo,
            status: OrderStatus.PROCESSING,
            totalAmount: BigInt(totalAmount), // cents
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

        // Deduct balance and record transaction
        await tx.merchant.update({
          where: { id: merchantId },
          data: {
            balance: {
              decrement: BigInt(totalAmount),
            },
          },
        });

        await tx.balanceTransaction.create({
          data: {
            merchantId,
            orderId: merchantOrder.id,
            amount: BigInt(-totalAmount),
            type: BalanceTransactionType.ORDER,
            description: `Customer store order ${orderResult.obj.orderNo} - ${packageCount} package(s)`,
          },
        });

        return { orderResult, merchantOrder };
      });

      const { orderResult, merchantOrder } = result;

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

