import { prisma } from '../lib/prisma';
import { PLATFORM_PRICE_MARKUP } from './esimAccessService';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface AnalyticsFilters {
  merchantId: string;
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
}

// Helper: build date filter clause
function buildDateWhere(startDate?: Date, endDate?: Date): any {
  if (!startDate && !endDate) return undefined;
  const clause: any = {};
  if (startDate) clause.gte = startOfDay(startDate);
  if (endDate) clause.lte = endOfDay(endDate);
  return clause;
}

// Helper: get period key from date for grouping
function getPeriodKey(date: Date, groupBy?: string): string {
  if (groupBy === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (groupBy === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

// Convert Order.totalAmount (1/10000 USD) to dollars with platform markup
function advOrderToDollars(totalAmount: bigint | null): number {
  if (!totalAmount) return 0;
  return (Number(totalAmount) * PLATFORM_PRICE_MARKUP) / 10000;
}

// Convert CustomerOrder.totalAmount (cents) to dollars
function easyOrderToDollars(totalAmount: bigint | null): number {
  if (!totalAmount) return 0;
  return Number(totalAmount) / 100;
}

export const analyticsService = {
  /**
   * Get revenue analytics — merges both Order (Advanced) and CustomerOrder (Easy Way)
   */
  async getRevenueAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;
    const dateWhere = buildDateWhere(startDate, endDate);

    // Easy Way: CustomerOrder (totalAmount in cents)
    const easyWhere: any = { merchantId, status: 'COMPLETED' };
    if (storeId) easyWhere.storeId = storeId;
    if (dateWhere) easyWhere.createdAt = dateWhere;

    // Advanced Way: Order (totalAmount in 1/10000 USD) — skip if filtering by storeId
    const advWhere: any = { merchantId, status: 'COMPLETED', customerOrderId: null };
    if (dateWhere) advWhere.createdAt = dateWhere;

    const [easyAgg, easyOrders, advAgg, advOrders] = await Promise.all([
      prisma.customerOrder.aggregate({
        where: easyWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.customerOrder.findMany({
        where: easyWhere,
        select: { totalAmount: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Only include Advanced orders when not filtering by storeId (Advanced has no stores)
      storeId
        ? Promise.resolve({ _sum: { totalAmount: null }, _count: { id: 0 } })
        : prisma.order.aggregate({
            where: advWhere,
            _sum: { totalAmount: true },
            _count: { id: true },
          }),
      storeId
        ? Promise.resolve([])
        : prisma.order.findMany({
            where: advWhere,
            select: { totalAmount: true, createdAt: true, status: true },
            orderBy: { createdAt: 'asc' },
          }),
    ]);

    const easyRevenueDollars = easyOrderToDollars(easyAgg._sum.totalAmount);
    const advRevenueDollars = advOrderToDollars(advAgg._sum.totalAmount);

    // Merge into period buckets
    const revenueByPeriod: Record<string, { revenue: number; orders: number }> = {};

    for (const order of easyOrders) {
      const key = getPeriodKey(new Date(order.createdAt), filters.groupBy);
      if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, orders: 0 };
      revenueByPeriod[key].revenue += easyOrderToDollars(order.totalAmount);
      revenueByPeriod[key].orders += 1;
    }

    for (const order of advOrders) {
      const key = getPeriodKey(new Date(order.createdAt), filters.groupBy);
      if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, orders: 0 };
      revenueByPeriod[key].revenue += advOrderToDollars(order.totalAmount);
      revenueByPeriod[key].orders += 1;
    }

    return {
      totalRevenue: easyRevenueDollars + advRevenueDollars,
      totalOrders: easyAgg._count.id + advAgg._count.id,
      revenueByPeriod: Object.entries(revenueByPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, data]) => ({
          period,
          revenue: data.revenue,
          orders: data.orders,
        })),
    };
  },

  /**
   * Get order analytics — merges both Order (Advanced) and CustomerOrder (Easy Way)
   */
  async getOrderAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;
    const dateWhere = buildDateWhere(startDate, endDate);

    const easyWhere: any = { merchantId };
    if (storeId) easyWhere.storeId = storeId;
    if (dateWhere) easyWhere.createdAt = dateWhere;

    const advWhere: any = { merchantId, customerOrderId: null };
    if (dateWhere) advWhere.createdAt = dateWhere;

    const [easyByStatus, easyOverTime, advByStatus, advOverTime] = await Promise.all([
      prisma.customerOrder.groupBy({
        by: ['status'],
        where: easyWhere,
        _count: { id: true },
      }),
      prisma.customerOrder.findMany({
        where: easyWhere,
        select: { status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      storeId
        ? Promise.resolve([])
        : prisma.order.groupBy({
            by: ['status'],
            where: advWhere,
            _count: { id: true },
          }),
      storeId
        ? Promise.resolve([])
        : prisma.order.findMany({
            where: advWhere,
            select: { status: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          }),
    ]);

    // Merge status counts
    const statusMap: Record<string, number> = {};
    for (const item of easyByStatus) {
      statusMap[item.status] = (statusMap[item.status] || 0) + item._count.id;
    }
    for (const item of advByStatus) {
      statusMap[item.status] = (statusMap[item.status] || 0) + item._count.id;
    }

    // Merge period buckets
    const ordersByPeriod: Record<string, Record<string, number>> = {};
    for (const order of [...easyOverTime, ...advOverTime]) {
      const key = getPeriodKey(new Date(order.createdAt), filters.groupBy);
      if (!ordersByPeriod[key]) ordersByPeriod[key] = {};
      ordersByPeriod[key][order.status] = (ordersByPeriod[key][order.status] || 0) + 1;
    }

    return {
      byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      overTime: Object.entries(ordersByPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, statuses]) => ({ period, ...statuses })),
    };
  },

  /**
   * Get package analytics — merges both Order (Advanced) and CustomerOrder (Easy Way)
   */
  async getPackageAnalytics(filters: AnalyticsFilters) {
    const { merchantId, storeId, startDate, endDate } = filters;
    const dateWhere = buildDateWhere(startDate, endDate);

    const easyWhere: any = { merchantId, status: 'COMPLETED' };
    if (storeId) easyWhere.storeId = storeId;
    if (dateWhere) easyWhere.createdAt = dateWhere;

    const advWhere: any = { merchantId, status: 'COMPLETED', customerOrderId: null };
    if (dateWhere) advWhere.createdAt = dateWhere;

    const [easyOrders, advOrders] = await Promise.all([
      prisma.customerOrder.findMany({
        where: easyWhere,
        select: { packageCount: true, totalAmount: true },
      }),
      storeId
        ? Promise.resolve([])
        : prisma.order.findMany({
            where: advWhere,
            select: { packageCount: true, totalAmount: true },
          }),
    ]);

    const easyPackages = easyOrders.reduce((sum, o) => sum + o.packageCount, 0);
    const advPackages = advOrders.reduce((sum, o) => sum + o.packageCount, 0);
    const totalPackages = easyPackages + advPackages;

    const easyRevenue = easyOrders.reduce((sum, o) => sum + easyOrderToDollars(o.totalAmount), 0);
    const advRevenue = advOrders.reduce((sum, o) => sum + advOrderToDollars(o.totalAmount), 0);
    const totalOrders = easyOrders.length + advOrders.length;
    const averageOrderValue = totalOrders > 0 ? (easyRevenue + advRevenue) / totalOrders : 0;

    return {
      totalPackagesSold: totalPackages,
      averageOrderValue,
      totalOrders,
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

