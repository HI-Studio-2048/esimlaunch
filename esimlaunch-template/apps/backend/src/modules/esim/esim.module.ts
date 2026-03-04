import { Module } from '@nestjs/common';
import { EsimService } from './esim.service';
import { EsimController } from './esim.controller';

@Module({
  providers: [EsimService],
  controllers: [EsimController],
  exports: [EsimService],
})
export class EsimModule {}
