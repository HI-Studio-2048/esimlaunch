import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { OptionalClerkEmailGuard } from '../../common/guards/optional-clerk-email.guard';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [EsimModule],
  controllers: [SupportController],
  providers: [SupportService, OptionalClerkEmailGuard],
  exports: [SupportService],
})
export class SupportModule {}
