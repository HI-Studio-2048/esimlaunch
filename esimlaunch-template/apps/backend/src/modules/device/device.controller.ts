import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { DeviceService } from './device.service';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /** GET /device/check — returns compatibility info. Uses query param or request User-Agent. */
  @Get('check')
  check(@Query('user-agent') userAgent: string, @Req() req: Request) {
    const ua = userAgent ?? req.headers['user-agent'];
    return this.deviceService.checkCompatibility(ua);
  }
}
