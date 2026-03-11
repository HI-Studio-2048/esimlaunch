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

    let customerName: string | undefined;
    if (input.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
      customerName = user?.name ?? undefined;
    } else {
      const user = await this.prisma.user.findUnique({ where: { email } });
      customerName = user?.name ?? undefined;
    }

    // When linked: use esimlaunch as single source of truth so dashboard replies appear on site
    if (this.storeConfig.isLinked()) {
      return this.createTicketViaHub(email, customerName, input.subject.trim(), input.body.trim());
    }

    const userId = input.userId ?? (await this.prisma.user.findUnique({ where: { email } }))?.id;
    return this.prisma.supportTicket.create({
      data: {
        userId: userId ?? undefined,
        email,
        subject: input.subject.trim(),
        body: input.body.trim(),
        status: 'open',
      },
    });
  }

  private async createTicketViaHub(
    customerEmail: string,
    customerName: string | undefined,
    subject: string,
    description: string,
  ) {
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const config = await this.storeConfig.getConfig();
    if (!baseUrl || !config?.storeId) {
      throw new BadRequestException('Store not linked');
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: config.storeId,
        customerEmail,
        customerName: customerName ?? undefined,
        subject,
        description,
        category: 'general',
        priority: 'medium',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new BadRequestException(`Failed to create ticket: ${text?.slice(0, 100)}`);
    }

    const json = (await res.json()) as { success?: boolean; data?: any };
    const t = json.data;
    if (!t?.id) throw new BadRequestException('Invalid response from support service');

    return {
      id: t.id,
      subject: t.subject,
      body: t.description,
      status: t.status ?? 'open',
      createdAt: t.createdAt ?? new Date().toISOString(),
      replies: [],
    };
  }

  async listTickets(userEmail: string) {
    const email = userEmail?.trim().toLowerCase();
    if (!email) return [];

    if (this.storeConfig.isLinked()) {
      return this.listTicketsViaHub(email);
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return [];

    return this.prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
  }

  private async listTicketsViaHub(customerEmail: string) {
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const syncSecret = this.config.get<string>('TEMPLATE_ORDER_SYNC_SECRET');
    const config = await this.storeConfig.getConfig();
    if (!baseUrl || !syncSecret || !config?.storeId) return [];

    const res = await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/integration/support/tickets?customerEmail=${encodeURIComponent(customerEmail)}&storeId=${encodeURIComponent(config.storeId)}`,
      { headers: { 'x-template-sync-secret': syncSecret } },
    );
    if (!res.ok) return [];

    const json = (await res.json()) as { success?: boolean; data?: any[] };
    const tickets = json.data ?? [];
    return tickets.map((t: any) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      createdAt: t.createdAt,
      replies: [],
    }));
  }

  async getTicket(id: string, userEmail?: string, userId?: string) {
    let email = userEmail?.trim().toLowerCase();
    if (!email && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      email = user?.email?.toLowerCase();
    }
    if (this.storeConfig.isLinked()) {
      return this.getTicketViaHub(id, email);
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.userId && userId && ticket.userId === userId) return ticket;
    if (email && ticket.email.toLowerCase() === email) return ticket;
    throw new ForbiddenException('Not authorized to view this ticket');
  }

  private async getTicketViaHub(ticketId: string, customerEmail?: string) {
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const syncSecret = this.config.get<string>('TEMPLATE_ORDER_SYNC_SECRET');
    const config = await this.storeConfig.getConfig();
    if (!baseUrl || !syncSecret || !config?.storeId) throw new NotFoundException('Ticket not found');
    if (!customerEmail) throw new ForbiddenException('Email required');

    const res = await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/integration/support/tickets/${ticketId}?storeId=${encodeURIComponent(config.storeId)}&customerEmail=${encodeURIComponent(customerEmail)}`,
      { headers: { 'x-template-sync-secret': syncSecret } },
    );
    if (!res.ok) {
      if (res.status === 404) throw new NotFoundException('Ticket not found');
      if (res.status === 403) throw new ForbiddenException('Not authorized to view this ticket');
      throw new BadRequestException('Failed to fetch ticket');
    }

    const json = (await res.json()) as { success?: boolean; data?: any };
    const t = json.data;
    if (!t) throw new NotFoundException('Ticket not found');

    return {
      id: t.id,
      subject: t.subject,
      body: t.body,
      status: t.status,
      createdAt: t.createdAt,
      replies: (t.replies ?? []).map((r: any) => ({
        id: r.id,
        body: r.body,
        isStaff: r.isStaff,
        createdAt: r.createdAt,
      })),
    };
  }

  async addReply(id: string, body: string, userEmail?: string, userId?: string) {
    if (!body?.trim()) throw new BadRequestException('body is required');

    const email = userEmail?.trim().toLowerCase();
    if (!email) throw new ForbiddenException('Email required');

    if (this.storeConfig.isLinked()) {
      return this.addReplyViaHub(id, body.trim(), email, userId);
    }

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

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

  private async addReplyViaHub(ticketId: string, message: string, customerEmail: string, _userId?: string) {
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const syncSecret = this.config.get<string>('TEMPLATE_ORDER_SYNC_SECRET');
    const config = await this.storeConfig.getConfig();
    if (!baseUrl || !syncSecret || !config?.storeId) throw new BadRequestException('Store not linked');

    const res = await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/integration/support/tickets/${ticketId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-template-sync-secret': syncSecret },
        body: JSON.stringify({ storeId: config.storeId, customerEmail, message }),
      },
    );
    if (!res.ok) {
      if (res.status === 404) throw new NotFoundException('Ticket not found');
      if (res.status === 403) throw new ForbiddenException('Not authorized to reply');
      throw new BadRequestException('Failed to add reply');
    }

    const json = (await res.json()) as { success?: boolean; data?: any };
    const r = json.data;
    if (!r) throw new BadRequestException('Invalid response');
    return { id: r.id, body: r.body, isStaff: r.isStaff, createdAt: r.createdAt };
  }
}
