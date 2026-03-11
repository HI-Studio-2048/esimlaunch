import express from 'express';
import { prisma } from '../lib/prisma';
import { supportService } from '../services/supportService';

const router = express.Router();

/**
 * POST /api/integration/template-order
 * Register an order from a linked template site so it appears in the dashboard.
 * Auth: x-template-sync-secret header must match TEMPLATE_ORDER_SYNC_SECRET.
 */
router.post('/template-order', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret) {
    return res.status(501).json({
      success: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Template order sync is not configured',
    });
  }

  const provided = req.headers['x-template-sync-secret'];
  if (provided !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }

  const { storeId, templateOrderId, customerEmail, customerName, totalAmountCents, packageCount, status, paymentRef } = req.body || {};

  if (!storeId || !templateOrderId || !customerEmail || totalAmountCents == null) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'storeId, templateOrderId, customerEmail, totalAmountCents required',
    });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    });
    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    const dedupeId = `template_${storeId}_${templateOrderId}`;
    const existing = await prisma.customerOrder.findFirst({
      where: { paymentIntentId: dedupeId },
    });
    if (existing) {
      return res.json({ success: true, orderId: existing.id, duplicate: true });
    }

    const customerOrder = await prisma.customerOrder.create({
      data: {
        customerEmail,
        customerName: customerName || null,
        storeId,
        merchantId: store.merchantId,
        paymentIntentId: dedupeId,
        totalAmount: BigInt(Math.round(Number(totalAmountCents))),
        packageCount: packageCount ?? 1,
        status: status === 'COMPLETED' ? 'COMPLETED' : status === 'PROCESSING' ? 'PROCESSING' : 'PENDING',
      },
    });

    return res.json({ success: true, orderId: customerOrder.id });
  } catch (err: any) {
    console.error('Template order sync failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'SYNC_FAILED',
      errorMessage: err?.message || 'Failed to register order',
    });
  }
});

/**
 * POST /api/integration/topup
 * Register a customer eSIM top-up from a linked template site.
 * Auth: x-template-sync-secret header must match TEMPLATE_ORDER_SYNC_SECRET.
 */
router.post('/topup', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret) {
    return res.status(501).json({
      success: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Template sync is not configured',
    });
  }

  const provided = req.headers['x-template-sync-secret'];
  if (provided !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }

  const { storeId, merchantId, customerEmail, customerName, iccid, esimTranNo, packageCode, amountCents, status, paymentRef } = req.body || {};

  if ((!merchantId && !storeId) || !customerEmail || amountCents == null) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'merchantId or storeId, customerEmail, amountCents required',
    });
  }

  try {
    let resolvedMerchantId = merchantId;
    if (!resolvedMerchantId && storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      });
      if (!store) {
        return res.status(404).json({
          success: false,
          errorCode: 'STORE_NOT_FOUND',
          errorMessage: 'Store not found',
        });
      }
      resolvedMerchantId = store.merchantId;
    }

    const topup = await prisma.customerTopUp.create({
      data: {
        merchantId: resolvedMerchantId,
        storeId: storeId || null,
        customerEmail,
        customerName: customerName || null,
        iccid: iccid || null,
        esimTranNo: esimTranNo || null,
        packageCode: packageCode || null,
        amountCents: Math.round(Number(amountCents)),
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
        paymentRef: paymentRef || null,
      },
    });

    return res.json({ success: true, topupId: topup.id });
  } catch (err: any) {
    console.error('Top-up sync failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'SYNC_FAILED',
      errorMessage: err?.message || 'Failed to register top-up',
    });
  }
});

// ---------------------------------------------------------------------------
// Support ticket integration (template ↔ dashboard bidirectional)
// When template is linked, it uses esimlaunch as single source of truth so
// merchant replies in dashboard appear on the template site.
// ---------------------------------------------------------------------------

/**
 * GET /api/integration/support/tickets?customerEmail=...&storeId=...
 * List support tickets for a customer in a store. Auth: x-template-sync-secret.
 */
router.get('/support/tickets', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret || req.headers['x-template-sync-secret'] !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }
  const { customerEmail, storeId } = req.query;
  if (!customerEmail || !storeId || typeof customerEmail !== 'string' || typeof storeId !== 'string') {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'customerEmail and storeId required',
    });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    });
    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    const tickets = await supportService.getTicketsByEmail(customerEmail);
    const storeTickets = tickets.filter((t: any) => t.merchantId === store.merchantId);

    return res.json({
      success: true,
      data: storeTickets.map((t: any) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.createdAt,
        messageCount: t.messages?.length ?? 0,
      })),
    });
  } catch (err: any) {
    console.error('Support tickets fetch failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: err?.message || 'Failed to fetch tickets',
    });
  }
});

/**
 * GET /api/integration/support/tickets/:ticketId?storeId=...&customerEmail=...
 * Get ticket with messages. Auth: x-template-sync-secret.
 */
router.get('/support/tickets/:ticketId', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret || req.headers['x-template-sync-secret'] !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }
  const { ticketId } = req.params;
  const { storeId, customerEmail } = req.query;
  if (!storeId || !customerEmail || typeof storeId !== 'string' || typeof customerEmail !== 'string') {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'storeId and customerEmail required',
    });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    });
    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    // Support both UUID (id) and ticketNumber (e.g. TKT-000001, t1_xxx) for template compatibility
    let ticket = await supportService.getTicketById(ticketId, true);
    if (!ticket && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId)) {
      ticket = await supportService.getTicketByNumber(ticketId);
    }
    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }
    if (ticket.customerEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'Not authorized to view this ticket',
      });
    }
    if (ticket.merchantId !== store.merchantId) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'Ticket does not belong to this store',
      });
    }

    const messages = (ticket.messages || [])
      .filter((m: any) => !m.isInternal)
      .map((m: any) => ({
        id: m.id,
        body: m.message,
        isStaff: m.senderType === 'merchant' || m.senderType === 'admin',
        senderType: m.senderType,
        createdAt: m.createdAt,
      }));

    return res.json({
      success: true,
      data: {
        id: ticket.id,
        subject: ticket.subject,
        body: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        ticketNumber: ticket.ticketNumber,
        createdAt: ticket.createdAt,
        replies: messages,
      },
    });
  } catch (err: any) {
    console.error('Support ticket fetch failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: err?.message || 'Failed to fetch ticket',
    });
  }
});

/**
 * POST /api/integration/support/tickets/:ticketId/messages
 * Add customer reply to ticket. Auth: x-template-sync-secret.
 */
router.post('/support/tickets/:ticketId/messages', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret || req.headers['x-template-sync-secret'] !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }
  const { ticketId } = req.params;
  const { storeId, customerEmail, customerName, message } = req.body || {};
  if (!storeId || !customerEmail || !message?.trim()) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'storeId, customerEmail, message required',
    });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    });
    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    // Support both UUID (id) and ticketNumber for template compatibility
    let ticket = await supportService.getTicketById(ticketId, false);
    if (!ticket && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId)) {
      ticket = await supportService.getTicketByNumber(ticketId);
    }
    if (!ticket) {
      return res.status(404).json({
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: 'Ticket not found',
      });
    }
    if (ticket.customerEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'Not authorized to reply to this ticket',
      });
    }
    if (ticket.merchantId !== store.merchantId) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'Ticket does not belong to this store',
      });
    }

    const msg = await supportService.addMessage({
      ticketId: ticket.id,
      senderType: 'customer',
      senderEmail: customerEmail,
      senderName: customerName || undefined,
      message: message.trim(),
      isInternal: false,
    });

    return res.json({
      success: true,
      data: {
        id: msg.id,
        body: msg.message,
        isStaff: false,
        createdAt: msg.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Support ticket reply failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'REPLY_FAILED',
      errorMessage: err?.message || 'Failed to add reply',
    });
  }
});

export default router;
