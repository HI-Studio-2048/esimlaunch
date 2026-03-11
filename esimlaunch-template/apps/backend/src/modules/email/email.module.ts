import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EsimModule } from '../esim/esim.module';

@Global()
@Module({
  imports: [EsimModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
