import { prisma } from '../lib/prisma';
import { emailService } from './emailService';

export interface CreateTicketParams {
  customerEmail: string;
  customerName?: string;
  customerId?: string;
  merchantId?: string;
  orderId?: string;
  subject: string;
  description: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AddMessageParams {
  ticketId: string;
  senderType: 'customer' | 'merchant' | 'admin';
  senderId?: string;
  senderEmail: string;
  senderName?: string;
  message: string;
  attachments?: any[];
  isInternal?: boolean;
}

export const supportService = {
  /**
   * Generate unique ticket number
   */
  async generateTicketNumber(): Promise<string> {
    const count = await prisma.supportTicket.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
    
    // Check if ticket number already exists (unlikely but possible)
    const exists = await prisma.supportTicket.findUnique({
      where: { ticketNumber },
    });
    
    if (exists) {
      // If exists, try with timestamp
      return `TKT-${Date.now()}`;
    }
    
    return ticketNumber;
  },

  /**
   * Create a new support ticket
   */
  async createTicket(params: CreateTicketParams) {
    const {
      customerEmail,
      customerName,
      customerId,
      merchantId,
      orderId,
      subject,
      description,
      category,
      priority = 'medium',
    } = params;

    const ticketNumber = await this.generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerEmail,
        customerName: customerName || null,
        customerId: customerId || null,
        merchantId: merchantId || null,
        orderId: orderId || null,
        subject,
        description,
        category: category || null,
        priority,
        status: 'open',
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    // Send confirmation email to customer
    try {
      await emailService.sendTicketConfirmationEmail(
        customerEmail,
        ticketNumber,
        subject
      );
    } catch (error) {
      console.error('Failed to send ticket confirmation email:', error);
      // Don't fail ticket creation if email fails
    }

    // Send notification to merchant if applicable
    if (merchantId) {
      try {
        const merchant = await prisma.merchant.findUnique({
          where: { id: merchantId },
          select: { email: true },
        });

        if (merchant) {
          await emailService.sendTicketNotificationEmail(
            merchant.email,
            ticketNumber,
            subject,
            customerEmail
          );
        }
      } catch (error) {
        console.error('Failed to send ticket notification email:', error);
      }
    }

    return ticket;
  },

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string, includeMessages: boolean = true) {
    return prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
        messages: includeMessages
          ? {
              orderBy: { createdAt: 'asc' },
            }
          : false,
      },
    });
  },

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber: string) {
    return prisma.supportTicket.findUnique({
      where: { ticketNumber },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  /**
   * Get tickets by customer email
   */
  async getTicketsByEmail(customerEmail: string) {
    return prisma.supportTicket.findMany({
      where: { customerEmail },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest message
        },
      },
    });
  },

  /**
   * Get tickets by merchant
   */
  async getTicketsByMerchant(merchantId: string, filters?: {
    status?: string;
    priority?: string;
    category?: string;
  }) {
    const where: any = {
      merchantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.category) {
      where.category = filters.category;
    }

    return prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  },

  /**
   * Add message to ticket
   */
  async addMessage(params: AddMessageParams) {
    const {
      ticketId,
      senderType,
      senderId,
      senderEmail,
      senderName,
      message,
      attachments,
      isInternal = false,
    } = params;

    // Get ticket to check if it exists and get related info
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        merchant: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Create message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderType,
        senderId: senderId || null,
        senderEmail,
        senderName: senderName || null,
        message,
        attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : null,
        isInternal,
      },
    });

    // Update ticket status if needed
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      // Reopen if customer responds
      if (senderType === 'customer') {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'open',
            resolvedAt: null,
          },
        });
      }
    }

    // Send email notifications
    try {
      if (senderType === 'customer') {
        // Notify merchant/admin
        if (ticket.merchantId && ticket.merchant) {
          await emailService.sendTicketReplyNotificationEmail(
            ticket.merchant.email,
            ticket.ticketNumber,
            message,
            senderEmail
          );
        }
      } else {
        // Notify customer
        await emailService.sendTicketReplyEmail(
          ticket.customerEmail,
          ticket.ticketNumber,
          message,
          senderName || 'Support Team'
        );
      }
    } catch (error) {
      console.error('Failed to send ticket reply email:', error);
    }

    return ticketMessage;
  },

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    assignedTo?: string
  ) {
    const updateData: any = {
      status,
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    } else {
      updateData.resolvedAt = null;
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });
  },

  /**
   * Update ticket priority
   */
  async updateTicketPriority(
    ticketId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ) {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { priority },
    });
  },

  /**
   * Get ticket statistics for merchant
   */
  async getTicketStats(merchantId: string) {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      prisma.supportTicket.count({ where: { merchantId } }),
      prisma.supportTicket.count({ where: { merchantId, status: 'open' } }),
      prisma.supportTicket.count({ where: { merchantId, status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { merchantId, status: 'resolved' } }),
      prisma.supportTicket.count({ where: { merchantId, status: 'closed' } }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };
  },
};










