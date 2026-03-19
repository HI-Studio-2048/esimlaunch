import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { OrdersModule } from '../orders/orders.module';
import { TopUpModule } from '../topup/topup.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [OrdersModule, TopUpModule, AffiliateModule, EsimModule],
  providers: [CronService],
})
export class CronModule {}
