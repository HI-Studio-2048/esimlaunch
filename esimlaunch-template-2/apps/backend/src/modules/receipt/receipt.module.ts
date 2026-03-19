import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [ReceiptService],
  exports: [ReceiptService],
})
export class ReceiptModule {}
