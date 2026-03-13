import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { authenticateCustomer } from '../middleware/customerAuth';
import { optionalSupportAuth } from '../middleware/optionalSupportAuth';
import { supportService } from '../services/supportService';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Validation schemas
const createTicketSchema = z.object({
  customerEmail: z.string().email('Invalid email address'),
  customerName: z.string().optional(),
  merchantId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['billing', 'technical', 'order_issue', 'general']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const addMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  attachments: z.array(z.any()).optional(),
  isInternal: z.boolean().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  assignedTo: z.string().uuid().optional(),
});

const updatePrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

/**
 * POST /api/support/tickets
 * Create a new support ticket (public endpoint)
 */
router.post('/tickets', async (req, res, next) => {
  try {
    const data = createTicketSchema.parse(req.body);
    
    // If customer is authenticated, use their ID
    const customerId = (req as any).customer?.id;

    // Resolve storeId to merchantId if provided
    let merchantId = data.merchantId;
    if (!merchantId && data.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: data.storeId },
        select: { merchantId: true },
      });
      if (store) merchantId = store.merchantId;
    }

    const { storeId, ...ticketData } = data;
    const ticket = await supportService.createTicket({
      ...ticketData,
      merchantId,
      customerId,
    });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        errorCode: 'TICKET_CREATION_FAILED',
        errorMessage: error.message || 'Failed to create support ticket',
      });
    }
  }
});

/**
 * GET /api/support/tickets
 * Get tickets (requires merchant authentication via JWT)
 */
router.get('/tickets', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const merchant = (req as any).merchant;

    if (!merchant) {
      return res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Merchant authentication required',
      });
    }

    // Get merchant tickets with optional filters
    const filters = {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      category: req.query.category as string | undefined,
    };

    const tickets = await supportService.getTicketsByMerchant(merchant.id, filters);
    return res.json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch tickets',
    });
  }
});

/**
 * GET /api/support/tickets/number/:ticketNumber
 * Get ticket by ticket number (public, for email links)
 * MUST be defined before /tickets/:ticketId to avoid route shadowing
 */
router.get('/tickets/number/:ticketNumber', async (req, res, next) => {
  try {
    const ticketNumber = req.params.ticketNumber;
    const ticket = await supportService.getTicketByNumber(ticketNumber);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch ticket',
    });
  }
});

/**
 * GET /api/support/tickets/:ticketId
 * Get ticket by ID (optional auth: merchant JWT or customer JWT for access control)
 */
router.get('/tickets/:ticketId', optionalSupportAuth, async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;
    const customer = (req as any).customer;
    const merchant = (req as any).merchant;

    const ticket = await supportService.getTicketById(ticketId, true);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }

    // Check authorization
    if (customer && ticket.customerEmail !== customer.email) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'You do not have access to this ticket',
      });
    }

    if (merchant && ticket.merchantId !== merchant.id) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'You do not have access to this ticket',
      });
    }

    // Explicitly add isStaff to each message so frontends can reliably show "Support" vs customer
    const messages = (ticket.messages || []).map((m: any) => ({
      ...m,
      isStaff: (m.senderType || '').toLowerCase() === 'merchant' || (m.senderType || '').toLowerCase() === 'admin',
    }));

    res.json({
      success: true,
      data: { ...ticket, messages },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch ticket',
    });
  }
});

/**
 * POST /api/support/tickets/:ticketId/messages
 * Add message to ticket (optional auth: merchant JWT = staff reply, customer JWT = customer reply)
 */
router.post('/tickets/:ticketId/messages', optionalSupportAuth, async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;
    const data = addMessageSchema.parse(req.body);
    const customer = (req as any).customer;
    const merchant = (req as any).merchant;

    // Get ticket to verify access
    const ticket = await supportService.getTicketById(ticketId, false);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }

    // Determine sender info
    let senderType: 'customer' | 'merchant' | 'admin';
    let senderId: string | undefined;
    let senderEmail: string;
    let senderName: string | undefined;

    if (customer) {
      senderType = 'customer';
      senderId = customer.id;
      senderEmail = customer.email;
    } else if (merchant) {
      senderType = 'merchant';
      senderId = merchant.id;
      senderEmail = merchant.email;
      senderName = merchant.name || undefined;
    } else {
      // Public reply (must match ticket email)
      senderType = 'customer';
      senderEmail = ticket.customerEmail;
    }

    // Check authorization
    if (customer && ticket.customerEmail !== customer.email) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'You do not have access to this ticket',
      });
    }

    if (merchant && ticket.merchantId !== merchant.id) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'You do not have access to this ticket',
      });
    }

    const message = await supportService.addMessage({
      ticketId,
      senderType,
      senderId,
      senderEmail,
      senderName,
      message: data.message,
      attachments: data.attachments,
      isInternal: data.isInternal || false,
    });

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        errorCode: 'MESSAGE_CREATION_FAILED',
        errorMessage: error.message || 'Failed to add message',
      });
    }
  }
});

/**
 * PUT /api/support/tickets/:ticketId/status
 * Update ticket status (merchant only)
 */
router.put('/tickets/:ticketId/status', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;
    const merchantId = (req as any).merchant!.id;
    const data = updateStatusSchema.parse(req.body);

    // Verify ticket belongs to merchant
    const ticket = await supportService.getTicketById(ticketId, false);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }

    if (ticket.merchantId !== merchantId) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'You do not have access to this ticket',
      });
    }

    const updatedTicket = await supportService.updateTicketStatus(
      ticketId,
      data.status,
      data.assignedTo
    );

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        errorCode: 'UPDATE_FAILED',
        errorMessage: error.message || 'Failed to update ticket status',
      });
    }
  }
});

/**
 * PUT /api/support/tickets/:ticketId/priority
 * Update ticket priority (merchant only)
 */
router.put('/tickets/:ticketId/priority', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;
    const merchantId = (req as any).merchant!.id;
    const data = updatePrioritySchema.parse(req.body);

    // Verify ticket belongs to merchant
    const ticket = await supportService.getTicketById(ticketId, false);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }

    if (ticket.merchantId !== merchantId) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'You do not have access to this ticket',
      });
    }

    const updatedTicket = await supportService.updateTicketPriority(
      ticketId,
      data.priority
    );

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        errorCode: 'UPDATE_FAILED',
        errorMessage: error.message || 'Failed to update ticket priority',
      });
    }
  }
});

/**
 * GET /api/support/stats
 * Get ticket statistics (merchant only)
 */
router.get('/stats', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const stats = await supportService.getTicketStats(merchantId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch ticket statistics',
    });
  }
});

export default router;





