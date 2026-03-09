import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { DeviceService } from './device.service';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /** GET /device/models?q= — search device models for autocomplete */
  @Get('models')
  models(@Query('q') q: string) {
    return { models: this.deviceService.searchModels(q ?? '') };
  }

  /** GET /device/check — compatibility by User-Agent, or by model (+ optional country) */
  @Get('check')
  check(
    @Query('user-agent') userAgent: string,
    @Query('model') model: string,
    @Query('country') country: string,
    @Req() req: Request,
  ) {
    if (model) {
      return this.deviceService.checkByModel(model, country);
    }
    const ua = userAgent ?? req.headers['user-agent'];
    return this.deviceService.checkCompatibility(ua);
  }
}
