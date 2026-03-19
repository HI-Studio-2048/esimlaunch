import { Module } from '@nestjs/common';
import { EsimService } from './esim.service';
import { EsimController } from './esim.controller';
import { CountriesController } from './countries.controller';
import { StoreConfigService } from './store-config.service';

@Module({
  providers: [StoreConfigService, EsimService],
  controllers: [EsimController, CountriesController],
  exports: [EsimService, StoreConfigService],
})
export class EsimModule {}
