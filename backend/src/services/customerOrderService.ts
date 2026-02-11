import { prisma } from '../lib/prisma';
import { OrderStatus } from '@prisma/client';
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
      linkedCustomerId = customer?.id || null;
    }

    // Calculate package count
    const packageCount = packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0);

    // Create customer order
    const customerOrder = await prisma.customerOrder.create({
      data: {
        customerId: linkedCustomerId,
        customerEmail,
        customerName: customerName || null,
        storeId,
        merchantId,
        paymentIntentId: paymentIntentId || null,
        totalAmount: BigInt(totalAmount),
        packageCount,
        status: OrderStatus.PENDING,
      },
    });

    // Create merchant order via eSIM Access API
    try {
      const transactionId = `customer_${customerOrder.id}_${Date.now()}`;
      
      const orderResult = await esimAccessService.createOrder({
        transactionId,
        amount: totalAmount,
        packageInfoList: packageInfoList.map(pkg => ({
          packageCode: pkg.packageCode,
          slug: pkg.slug,
          count: pkg.count,
          price: pkg.price,
        })),
      });

      if (orderResult.success && orderResult.obj?.orderNo) {
        // Create merchant order record
        const merchantOrder = await prisma.order.create({
          data: {
            merchantId,
            transactionId,
            esimAccessOrderNo: orderResult.obj.orderNo,
            status: OrderStatus.PROCESSING,
            totalAmount: BigInt(totalAmount),
            packageCount,
            customerOrderId: customerOrder.id,
          },
        });

        // Link customer order to merchant order
        await prisma.customerOrder.update({
          where: { id: customerOrder.id },
          data: {
            orderId: merchantOrder.id,
            esimAccessOrderNo: orderResult.obj.orderNo,
            status: OrderStatus.PROCESSING,
          },
        });

        // Send order confirmation email
        try {
          const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { businessName: true, name: true },
          });

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
          // Don't fail order creation if email fails
        }

        return {
          ...customerOrder,
          orderId: merchantOrder.id,
          esimAccessOrderNo: orderResult.obj.orderNo,
        };
      } else {
        // Order creation failed, update customer order status
        await prisma.customerOrder.update({
          where: { id: customerOrder.id },
          data: {
            status: OrderStatus.FAILED,
          },
        });

        throw new Error(orderResult.errorMessage || 'Failed to create eSIM order');
      }
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

