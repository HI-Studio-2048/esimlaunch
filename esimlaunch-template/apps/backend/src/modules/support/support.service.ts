import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { StoreConfigService } from '../esim/store-config.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private storeConfig: StoreConfigService,
  ) {}

  async createTicket(input: {
    subject: string;
    body: string;
    email?: string;
    userId?: string;
  }) {
    if (!input.subject?.trim()) throw new BadRequestException('subject is required');
    if (!input.body?.trim()) throw new BadRequestException('body is required');

    const email = input.email?.trim().toLowerCase();
    if (!email) throw new BadRequestException('email is required');

    let userId = input.userId;
    let customerName: string | undefined;
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      customerName = user?.name ?? undefined;
    } else {
      const user = await this.prisma.user.findUnique({ where: { email } });
      userId = user?.id ?? undefined;
      customerName = user?.name ?? undefined;
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        email,
        subject: input.subject.trim(),
        body: input.body.trim(),
        status: 'open',
      },
    });

    // When linked to a store, forward to esimlaunch so the ticket appears in merchant dashboard
    this.forwardTicketToEsimlaunch({
      customerEmail: email,
      customerName,
      subject: input.subject.trim(),
      description: input.body.trim(),
    }).catch((err) =>
      this.logger.warn('Failed to forward support ticket to esimlaunch', err?.message || err),
    );

    return ticket;
  }

  /**
   * Forward ticket to esimlaunch when store is linked. Tickets appear in merchant dashboard.
   */
  private async forwardTicketToEsimlaunch(payload: {
    customerEmail: string;
    customerName?: string;
    subject: string;
    description: string;
  }): Promise<void> {
    if (!this.storeConfig.isLinked()) return;
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const config = await this.storeConfig.getConfig();
    if (!baseUrl || !config?.storeId) return;

    const url = `${baseUrl.replace(/\/$/, '')}/api/support/tickets`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: config.storeId,
        customerEmail: payload.customerEmail,
        customerName: payload.customerName ?? undefined,
        subject: payload.subject,
        description: payload.description,
        category: 'general',
        priority: 'medium',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`esimlaunch support API ${res.status}: ${text?.slice(0, 200)}`);
    }
  }

  async listTickets(userEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return [];

    return this.prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getTicket(id: string, userEmail?: string, userId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const email = userEmail?.trim().toLowerCase();
    if (ticket.userId && userId && ticket.userId === userId) return ticket;
    if (email && ticket.email.toLowerCase() === email) return ticket;
    throw new ForbiddenException('Not authorized to view this ticket');
  }

  async addReply(id: string, body: string, userEmail?: string, userId?: string) {
    if (!body?.trim()) throw new BadRequestException('body is required');

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const email = userEmail?.trim().toLowerCase();
    if (ticket.userId && userId && ticket.userId === userId) {
      return this.prisma.supportTicketReply.create({
        data: { ticketId: id, body: body.trim(), isStaff: false },
      });
    }
    if (email && ticket.email.toLowerCase() === email) {
      return this.prisma.supportTicketReply.create({
        data: { ticketId: id, body: body.trim(), isStaff: false },
      });
    }
    throw new ForbiddenException('Not authorized to reply to this ticket');
  }
}
