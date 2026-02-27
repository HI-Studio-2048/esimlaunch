import { prisma } from '../lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface AnalyticsFilters {
  merchantId: string;
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
}

export const analyticsService = {
  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;

    const where: any = {
      merchantId,
      status: 'COMPLETED',
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startOfDay(startDate);
      }
      if (endDate) {
        where.createdAt.lte = endOfDay(endDate);
      }
    }

    // Total revenue
    const totalRevenue = await prisma.customerOrder.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Revenue by period
    const orders = await prisma.customerOrder.findMany({
      where,
      select: {
        totalAmount: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by period
    const revenueByPeriod: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (filters.groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (filters.groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = { revenue: 0, orders: 0 };
      }

      if (order.status === 'COMPLETED') {
        revenueByPeriod[key].revenue += Number(order.totalAmount) / 100;
        revenueByPeriod[key].orders += 1;
      }
    });

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0) / 100,
      totalOrders: totalRevenue._count.id,
      revenueByPeriod: Object.entries(revenueByPeriod).map(([period, data]) => ({
        period,
        revenue: data.revenue,
        orders: data.orders,
      })),
    };
  },

  /**
   * Get order analytics
   */
  async getOrderAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;

    const where: any = {
      merchantId,
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startOfDay(startDate);
      }
      if (endDate) {
        where.createdAt.lte = endOfDay(endDate);
      }
    }

    // Orders by status
    const ordersByStatus = await prisma.customerOrder.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    // Orders over time
    const ordersOverTime = await prisma.customerOrder.findMany({
      where,
      select: {
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by period
    const ordersByPeriod: Record<string, Record<string, number>> = {};
    ordersOverTime.forEach((order) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (filters.groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (filters.groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!ordersByPeriod[key]) {
        ordersByPeriod[key] = {};
      }

      ordersByPeriod[key][order.status] = (ordersByPeriod[key][order.status] || 0) + 1;
    });

    return {
      byStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      overTime: Object.entries(ordersByPeriod).map(([period, statuses]) => ({
        period,
        ...statuses,
      })),
    };
  },

  /**
   * Get package analytics
   */
  async getPackageAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;

    const where: any = {
      merchantId,
      status: 'COMPLETED',
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startOfDay(startDate);
      }
      if (endDate) {
        where.createdAt.lte = endOfDay(endDate);
      }
    }

    // Get orders with package info
    const orders = await prisma.customerOrder.findMany({
      where,
      select: {
        packageCount: true,
        totalAmount: true,
      },
    });

    const totalPackages = orders.reduce((sum, order) => sum + order.packageCount, 0);
    const averageOrderValue = orders.length > 0
      ? orders.reduce((sum, order) => sum + Number(order.totalAmount) / 100, 0) / orders.length
      : 0;

    return {
      totalPackagesSold: totalPackages,
      averageOrderValue,
      totalOrders: orders.length,
    };
  },

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;

    const where: any = {
      merchantId,
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startOfDay(startDate);
      }
      if (endDate) {
        where.createdAt.lte = endOfDay(endDate);
      }
    }

    // Unique customers
    const uniqueCustomers = await prisma.customerOrder.groupBy({
      by: ['customerEmail'],
      where,
    });

    // Repeat customers
    const customerOrderCounts = await prisma.customerOrder.groupBy({
      by: ['customerEmail'],
      where,
      _count: {
        id: true,
      },
    });

    const repeatCustomers = customerOrderCounts.filter(c => c._count.id > 1).length;

    return {
      totalCustomers: uniqueCustomers.length,
      repeatCustomers,
      newCustomers: uniqueCustomers.length - repeatCustomers,
    };
  },

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(merchantId: string, storeId?: string) {
    const now = new Date();
    const last30Days = subDays(now, 30);
    const last7Days = subDays(now, 7);

    const [revenue30d, revenue7d, orders30d, orders7d, customers30d] = await Promise.all([
      this.getRevenueAnalytics({ merchantId, storeId, startDate: last30Days, endDate: now }),
      this.getRevenueAnalytics({ merchantId, storeId, startDate: last7Days, endDate: now }),
      this.getOrderAnalytics({ merchantId, storeId, startDate: last30Days, endDate: now }),
      this.getOrderAnalytics({ merchantId, storeId, startDate: last7Days, endDate: now }),
      this.getCustomerAnalytics({ merchantId, storeId, startDate: last30Days, endDate: now }),
    ]);

    return {
      revenue: {
        last30Days: revenue30d.totalRevenue,
        last7Days: revenue7d.totalRevenue,
        growth: revenue7d.totalRevenue > 0 && revenue30d.totalRevenue > 0
          ? ((revenue7d.totalRevenue / (revenue30d.totalRevenue / 30 * 7)) - 1) * 100
          : 0,
      },
      orders: {
        last30Days: orders30d.overTime.reduce((sum, item) => {
          const { period, ...statusCounts } = item as any;
          return sum + Object.values(statusCounts).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        }, 0),
        last7Days: orders7d.overTime.reduce((sum, item) => {
          const { period, ...statusCounts } = item as any;
          return sum + Object.values(statusCounts).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        }, 0),
      },
      customers: customers30d,
    };
  },
};

