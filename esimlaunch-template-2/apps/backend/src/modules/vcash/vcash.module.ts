import { Module } from '@nestjs/common';
import { VCashController } from './vcash.controller';

@Module({
  controllers: [VCashController],
})
export class VCashModule {}
