import { describe, it, expect, vi } from 'vitest';
import { testPrisma } from './setup';
import { createMerchant, createOrder } from './helpers';

/**
 * webhookService.processESIMAccessWebhook tests focus on:
 *   - Valid state transitions (PENDING → COMPLETED, PENDING → FAILED with refund)
 *   - Terminal-state protection (COMPLETED can't transition)
 *   - Unknown orderNo doesn't crash
 *
 * `forwardWebhook` posts to merchant webhook URLs (network I/O) — we stub it.
 * `deliverESIMs` is triggered via setImmediate when an order completes — we
 * stub it too so the test process doesn't hang on a pending timer.
 */

vi.mock('../src/services/esimAccessService', () => ({
  esimAccessService: {
    queryOrder: vi.fn(),
  },
  PLATFORM_PRICE_MARKUP: 125, // 1.25x expressed in hundredths
}));

// qrCodeService and emailService are pulled in by deliverESIMs — stub to avoid network.
vi.mock('../src/services/qrCodeService', () => ({
  qrCodeService: { generateQRCode: vi.fn(async () => 'data:image/png;base64,stub') },
}));
vi.mock('../src/services/emailService', () => ({
  emailService: { sendESIMDeliveryEmail: vi.fn(async () => true) },
}));

import { webhookService } from '../src/services/webhookService';

// Stub forwardWebhook to avoid real HTTP.
vi.spyOn(webhookService, 'forwardWebhook').mockResolvedValue();
// Stub deliverESIMs so the setImmediate callback doesn't try to hit the DB
// after the test tears down.
vi.spyOn(webhookService, 'deliverESIMs').mockResolvedValue({ statusUpdated: true });

function webhookPayload(orderNo: string, orderStatus: string) {
  return {
    notifyType: 'ORDER_STATUS' as const,
    content: { orderNo, orderStatus },
  };
}

describe('webhookService.processESIMAccessWebhook', () => {
  it('transitions PENDING → COMPLETED when eSIM Access reports GOT_RESOURCE', async () => {
    const merchant = await createMerchant();
    const order = await createOrder(merchant.id, {
      esimAccessOrderNo: 'B_complete_1',
      status: 'PENDING',
    });

    await webhookService.processESIMAccessWebhook(webhookPayload('B_complete_1', 'GOT_RESOURCE'));

    const after = await testPrisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('COMPLETED');
  });

  it('refunds merchant balance when an order transitions PENDING → FAILED', async () => {
    const merchant = await createMerchant({ balanceCents: 0n });
    const order = await createOrder(merchant.id, {
      esimAccessOrderNo: 'B_failed_1',
      status: 'PENDING',
      totalAmount: 200_000n, // 1/10000 USD → 20 cents refunded (200_000 / 100)
    });

    await webhookService.processESIMAccessWebhook(webhookPayload('B_failed_1', 'FAILED'));

    const afterOrder = await testPrisma.order.findUnique({ where: { id: order.id } });
    expect(afterOrder?.status).toBe('FAILED');

    const afterMerchant = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    // 200_000 / 100 = 2000 cents refunded
    expect(afterMerchant?.balance).toBe(2000n);

    const txs = await testPrisma.balanceTransaction.findMany({
      where: { merchantId: merchant.id, type: 'REFUND' },
    });
    expect(txs).toHaveLength(1);
    expect(txs[0].orderId).toBe(order.id);
  });

  it('does NOT transition from a terminal state (COMPLETED stays COMPLETED)', async () => {
    const merchant = await createMerchant({ balanceCents: 500n });
    const order = await createOrder(merchant.id, {
      esimAccessOrderNo: 'B_terminal_1',
      status: 'COMPLETED',
      totalAmount: 100_000n,
    });

    await webhookService.processESIMAccessWebhook(webhookPayload('B_terminal_1', 'FAILED'));

    const after = await testPrisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('COMPLETED');

    // Balance untouched — no refund should fire from a terminal-state transition
    const afterMerchant = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(afterMerchant?.balance).toBe(500n);
  });

  it('does not crash when the orderNo is not in our DB', async () => {
    await expect(
      webhookService.processESIMAccessWebhook(webhookPayload('does_not_exist', 'GOT_RESOURCE'))
    ).resolves.toBeUndefined();
  });
});
