import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { OptionalClerkEmailGuard } from '../../common/guards/optional-clerk-email.guard';

@Controller('support')
@UseGuards(CsrfGuard, OptionalClerkEmailGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /** POST /support/tickets — create ticket (email from body for guests, or Authorization Bearer token for signed-in) */
  @Post('tickets')
  async createTicket(
    @Body() body: { subject: string; body: string; email?: string },
    @Req() req: { userId?: string; userEmail?: string },
  ) {
    const email = req.userEmail ?? body.email?.trim().toLowerCase();
    if (!email) throw new BadRequestException('email is required (header or body)');
    return this.supportService.createTicket({
      subject: body.subject,
      body: body.body,
      email,
      userId: req.userId,
    });
  }

  /** GET /support/tickets — list user's tickets (requires Authorization Bearer token) */
  @Get('tickets')
  async listTickets(@Req() req: { userEmail?: string }) {
    if (!req.userEmail) throw new UnauthorizedException('Authorization header is required');
    return this.supportService.listTickets(req.userEmail);
  }

  /** GET /support/tickets/:id — get ticket with replies (requires Authorization Bearer token) */
  @Get('tickets/:id')
  async getTicket(
    @Param('id') id: string,
    @Req() req: { userEmail?: string; userId?: string },
  ) {
    if (!req.userEmail && !req.userId) throw new UnauthorizedException('Authorization header is required');
    return this.supportService.getTicket(id, req.userEmail, req.userId);
  }

  /** POST /support/tickets/:id/replies — add reply (requires Authorization Bearer token) */
  @Post('tickets/:id/replies')
  async addReply(
    @Param('id') id: string,
    @Body() body: { body: string },
    @Req() req: { userEmail?: string; userId?: string },
  ) {
    if (!req.userEmail && !req.userId) throw new UnauthorizedException('Authorization header is required');
    return this.supportService.addReply(id, body.body, req.userEmail, req.userId);
  }
}
