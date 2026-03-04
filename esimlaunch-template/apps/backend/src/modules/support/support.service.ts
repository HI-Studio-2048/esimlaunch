import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

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
    if (!userId) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      userId = user?.id ?? undefined;
    }

    return this.prisma.supportTicket.create({
      data: {
        userId,
        email,
        subject: input.subject.trim(),
        body: input.body.trim(),
        status: 'open',
      },
    });
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
