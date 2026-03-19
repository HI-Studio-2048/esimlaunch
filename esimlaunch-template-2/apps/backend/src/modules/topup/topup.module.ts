import { Module } from '@nestjs/common';
import { TopUpService } from './topup.service';
import { TopUpController } from './topup.controller';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [EsimModule],
  providers: [TopUpService],
  controllers: [TopUpController],
  exports: [TopUpService],
})
export class TopUpModule {}
