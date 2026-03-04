import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma.module';
import { EsimModule } from './modules/esim/esim.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { TopUpModule } from './modules/topup/topup.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { VCashModule } from './modules/vcash/vcash.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { EmailModule } from './modules/email/email.module';
import { CronModule } from './modules/cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EsimModule,
    OrdersModule,
    UsersModule,
    TopUpModule,
    AffiliateModule,
    VCashModule,
    WebhooksModule,
    StripeModule,
    CurrencyModule,
    EmailModule,
    CronModule,
  ],
})
export class AppModule {}
