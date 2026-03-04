import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from '../orders/orders.module';
import { TopUpModule } from '../topup/topup.module';
import { AffiliateModule } from '../affiliate/affiliate.module';

@Module({
  imports: [OrdersModule, TopUpModule, AffiliateModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
