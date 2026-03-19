import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EsimModule } from '../esim/esim.module';
import { ReceiptModule } from '../receipt/receipt.module';
import { OptionalClerkEmailGuard } from '../../common/guards/optional-clerk-email.guard';

@Module({
  imports: [EsimModule, ReceiptModule],
  providers: [OrdersService, OptionalClerkEmailGuard],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
