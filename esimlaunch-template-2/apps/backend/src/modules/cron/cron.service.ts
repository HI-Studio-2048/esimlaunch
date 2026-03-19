import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';
import { TopUpService } from '../topup/topup.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { EsimService } from '../esim/esim.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private ordersService: OrdersService,
    private topUpService: TopUpService,
    private affiliateService: AffiliateService,
    private esimService: EsimService,
    private prisma: PrismaService,
  ) {}

  /**
   * Every 5 minutes: retry failed eSIM orders.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedOrders() {
    this.logger.debug('Cron: retrying failed orders');
    await this.ordersService.retryFailedOrders();
  }

  /**
   * Every 5 minutes: retry failed top-ups.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedTopUps() {
    this.logger.debug('Cron: retrying failed top-ups');
    await this.topUpService.retryFailedTopUps();
  }

  /**
   * Every hour: sync eSIM profile statuses from provider.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncEsimProfiles() {
    this.logger.debug('Cron: syncing eSIM profile statuses');
    const profiles = await this.prisma.esimProfile.findMany({
      where: {
        esimTranNo: { not: null },
        esimStatus: { notIn: ['EXPIRED', 'REVOKED', 'CANCELLED'] },
      },
    });

    for (const profile of profiles) {
      if (!profile.esimTranNo) continue;
      try {
        const res = await this.esimService.getClient().queryUsage([profile.esimTranNo]);
        const usage = res.obj?.usageList?.[0];
        if (!usage) continue;

        const update: Record<string, unknown> = {};
        if (usage.orderUsage !== undefined) update.orderUsage = BigInt(usage.orderUsage);
        if (usage.totalVolume !== undefined) update.totalVolume = BigInt(usage.totalVolume);
        if (usage.expiredTime) update.expiredTime = new Date(usage.expiredTime);

        if (Object.keys(update).length > 0) {
          await this.prisma.esimProfile.update({ where: { id: profile.id }, data: update });

          // Record usage snapshot
          if (usage.orderUsage !== undefined) {
            await this.prisma.esimUsageHistory.create({
              data: {
                profileId: profile.id,
                usedBytes: BigInt(usage.orderUsage),
              },
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to sync usage for profile ${profile.id}`, err);
      }
    }
  }

  /**
   * Daily: make commissions available (after 14-day holding period).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processCommissions() {
    this.logger.debug('Cron: processing commissions');
    await this.affiliateService.makeCommissionsAvailable();
  }
}
