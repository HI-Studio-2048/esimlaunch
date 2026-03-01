import axios from 'axios';
import { prisma } from '../lib/prisma';
import { WebhookEventType, OrderStatus, BalanceTransactionType } from '@prisma/client';
import { emailService } from './emailService';
import { qrCodeService } from './qrCodeService';
import { esimAccessService } from './esimAccessService';

export interface ESIMAccessWebhook {
  notifyType: 'ORDER_STATUS' | 'ESIM_STATUS' | 'DATA_USAGE' | 'VALIDITY_USAGE' | 'BALANCE_LOW' | 'SMDP_EVENT' | 'CHECK_HEALTH';
  eventGenerateTime?: string;
  notifyId?: string;
  content: any;
}

export interface ForwardedWebhook {
  event: string;
  timestamp: string;
  data: any;
}

class WebhookService {
  /**
   * Forward webhook to merchant's configured webhook URL
   */
  async forwardWebhook(
    merchantId: string,
    webhookEvent: ESIMAccessWebhook
  ): Promise<void> {
    // Get merchant's webhook configuration (merchantId is not unique, use findFirst)
    const webhookConfig = await prisma.webhookConfig.findFirst({
      where: { merchantId },
    });

    if (!webhookConfig || !webhookConfig.isActive) {
      console.log(`No active webhook config for merchant ${merchantId}`);
      return;
    }

    // Check if this event type is subscribed to
    const eventType = this.mapESIMAccessEventType(webhookEvent.notifyType);
    if (webhookConfig.events.length > 0 && !webhookConfig.events.includes(eventType)) {
      console.log(`Merchant ${merchantId} not subscribed to event ${eventType}`);
      return;
    }

    // Transform webhook to our format
    const forwardedWebhook: ForwardedWebhook = {
      event: eventType.toLowerCase().replace('_', '.'),
      timestamp: webhookEvent.eventGenerateTime || new Date().toISOString(),
      data: webhookEvent.content,
    };

    try {
      // Forward webhook to merchant's URL
      const response = await axios.post(
        webhookConfig.url,
        forwardedWebhook,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': webhookConfig.secret
              ? this.generateSignature(JSON.stringify(forwardedWebhook), webhookConfig.secret)
              : undefined,
          },
          timeout: 10000, // 10 seconds
        }
      );

      console.log(`Webhook forwarded successfully to ${webhookConfig.url}`, {
        merchantId,
        event: eventType,
        status: response.status,
      });
    } catch (error: any) {
      console.error(`Failed to forward webhook to ${webhookConfig.url}:`, {
        merchantId,
        event: eventType,
        error: error.message,
        status: error.response?.status,
      });

      // In production, you might want to queue failed webhooks for retry
      // For now, we just log the error
    }
  }

  /**
   * Map eSIM Access webhook event types to our WebhookEventType enum
   */
  private mapESIMAccessEventType(
    notifyType: ESIMAccessWebhook['notifyType']
  ): WebhookEventType {
    switch (notifyType) {
      case 'ORDER_STATUS':
        return WebhookEventType.ORDER_STATUS;
      case 'ESIM_STATUS':
        return WebhookEventType.ESIM_STATUS;
      case 'DATA_USAGE':
        return WebhookEventType.DATA_USAGE;
      case 'VALIDITY_USAGE':
        return WebhookEventType.VALIDITY_USAGE;
      case 'BALANCE_LOW':
        return WebhookEventType.BALANCE_LOW;
      case 'SMDP_EVENT':
        return WebhookEventType.SMDP_EVENT;
      default:
        return WebhookEventType.ORDER_STATUS; // Default fallback
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Map eSIM Access order status to our OrderStatus enum
   */
  private mapOrderStatus(esimAccessStatus: string): OrderStatus | null {
    // eSIM Access statuses: GOT_RESOURCE, FAILED, CANCELLED, etc.
    switch (esimAccessStatus) {
      case 'GOT_RESOURCE':
        return OrderStatus.PROCESSING;
      case 'COMPLETED':
      case 'SUCCESS':
        return OrderStatus.COMPLETED;
      case 'FAILED':
      case 'ERROR':
        return OrderStatus.FAILED;
      case 'CANCELLED':
      case 'CANCELED':
        return OrderStatus.CANCELLED;
      default:
        return null; // Unknown status, don't update
    }
  }

  /**
   * Process webhook from eSIM Access
   * This finds the associated merchant and forwards the webhook
   */
  async processESIMAccessWebhook(webhook: ESIMAccessWebhook): Promise<void> {
    // For ORDER_STATUS and ESIM_STATUS, we can find the merchant via orderNo
    if (webhook.content?.orderNo) {
      const orderNo = webhook.content.orderNo;

      // Find order in our database
      const order = await prisma.order.findFirst({
        where: {
          esimAccessOrderNo: orderNo,
        },
        include: {
          merchant: true,
        },
      });

      if (order) {
        // Forward to merchant
        await this.forwardWebhook(order.merchantId, webhook);

        // Handle order status updates and balance refunds
        if (webhook.notifyType === 'ORDER_STATUS') {
          const newStatus = this.mapOrderStatus(webhook.content.orderStatus);
          const oldStatus = order.status;

          // Update order status
          if (newStatus && newStatus !== oldStatus) {
            await prisma.$transaction(async (tx) => {
              // Update order status
              await tx.order.update({
                where: { id: order.id },
                data: { status: newStatus },
              });

              // If order is completed, trigger eSIM delivery
              if (newStatus === OrderStatus.COMPLETED) {
                // Process eSIM delivery asynchronously (don't block webhook response)
                setImmediate(async () => {
                  try {
                    await this.deliverESIMs(order.id);
                  } catch (error) {
                    console.error('Error delivering eSIMs:', error);
                  }
                });
              }

              // Refund balance if order failed or was cancelled
              // Only refund if order was previously PENDING or PROCESSING (balance was deducted)
              // Order.totalAmount is in 1/10000 USD (Advanced); balance is in cents
              if (
                (newStatus === OrderStatus.FAILED || newStatus === OrderStatus.CANCELLED) &&
                (oldStatus === OrderStatus.PENDING || oldStatus === OrderStatus.PROCESSING) &&
                order.totalAmount
              ) {
                const refundCents = Math.round(Number(order.totalAmount) / 100);

                // Refund balance to merchant (cents)
                await tx.merchant.update({
                  where: { id: order.merchantId },
                  data: {
                    balance: {
                      increment: BigInt(refundCents),
                    },
                  },
                });

                // Create balance transaction record for audit
                await tx.balanceTransaction.create({
                  data: {
                    merchantId: order.merchantId,
                    orderId: order.id,
                    amount: BigInt(refundCents), // Positive for refund
                    type: BalanceTransactionType.REFUND,
                    description: `Refund for ${newStatus === OrderStatus.FAILED ? 'failed' : 'cancelled'} order ${orderNo}`,
                  },
                });

                console.log(`Refunded $${(refundCents / 100).toFixed(2)} to merchant ${order.merchantId} for order ${orderNo}`);
              }
            });
          }
        }
      } else {
        console.warn(`Order ${orderNo} not found in database`);
      }
    } else {
      // For other webhook types, we might need to query by esimTranNo or iccid
      // For now, we'll log that we received it but can't route it
      console.warn('Received webhook without orderNo, cannot route:', webhook);
    }
  }

  /**
   * Forward webhook to all merchants (for system-wide events like balance low)
   */
  async broadcastWebhook(webhookEvent: ESIMAccessWebhook): Promise<void> {
    // Get all active merchants with webhook configs
    const webhookConfigs = await prisma.webhookConfig.findMany({
      where: {
        isActive: true,
        merchant: { isActive: true },
      },
    });

    // Forward to all merchants
    const promises = webhookConfigs.map((config) =>
      this.forwardWebhook(config.merchantId, webhookEvent)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Deliver eSIMs to customer after order completion
   */
  async deliverESIMs(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, merchantId: true, esimAccessOrderNo: true },
      });
      if (!order?.esimAccessOrderNo) {
        console.log(`Order ${orderId} not found or missing esimAccessOrderNo`);
        return;
      }

      const profilesResult = await esimAccessService.queryProfiles({
        orderNo: order.esimAccessOrderNo,
      });
      if (!profilesResult.success || !profilesResult.obj?.esimList) {
        console.error('Failed to fetch eSIM profiles:', profilesResult.errorMessage);
        return;
      }
      const profiles = profilesResult.obj.esimList;

      for (const p of profiles) {
        try {
          const pkgCode = p.packageList?.[0]?.packageCode ?? null;
          const locCode = p.packageList?.[0]?.locationCode ?? null;
          let packageName: string | null = null;
          let planPrice: number | null = null;
          let supportTopUpType: string | null = null;
          if (pkgCode) {
            const pkgList = await esimAccessService.getPackages({ packageCode: pkgCode });
            const pkg = pkgList.obj?.packageList?.[0];
            if (pkg) {
              packageName = pkg.name ?? null;
              planPrice = pkg.price ?? null;
              const raw = (pkg as any).supportTopUpType;
              supportTopUpType = raw != null ? (typeof raw === 'string' ? raw : String(raw)) : null;
            }
          }
          const coverage = p.packageList?.map(pkg => ({
            locationCode: pkg.locationCode,
            country: pkg.locationCode,
          })) ?? null;

          const esimStatus = p.esimStatus != null ? String(p.esimStatus) : null;
          const smdpStatus = p.smdpStatus != null ? String(p.smdpStatus) : null;
          await prisma.esimProfile.upsert({
            where: { esimTranNo: p.esimTranNo },
            create: {
              merchantId: order.merchantId,
              esimTranNo: p.esimTranNo,
              iccid: p.iccid ?? null,
              orderNo: p.orderNo ?? null,
              orderId: order.id,
              ac: (p as any).ac ?? null,
              qrCodeUrl: p.qrCodeUrl ?? null,
              shortUrl: (p as any).shortUrl ?? null,
              smsStatus: p.smsStatus ?? null,
              dataType: p.dataType ?? null,
              activeType: p.activeType ? parseInt(String(p.activeType)) : null,
              packageCode: pkgCode,
              packageName,
              planPrice,
              supportTopUpType: supportTopUpType != null ? supportTopUpType : null,
              locationCode: locCode,
              coverage: coverage as any,
              orderedAt: new Date(),
              esimStatus,
              smdpStatus,
            },
            update: {
              iccid: p.iccid ?? undefined,
              ac: (p as any).ac ?? undefined,
              qrCodeUrl: p.qrCodeUrl ?? undefined,
              shortUrl: (p as any).shortUrl ?? undefined,
              packageCode: pkgCode ?? undefined,
              packageName: packageName ?? undefined,
              planPrice: planPrice ?? undefined,
              supportTopUpType: (supportTopUpType != null ? supportTopUpType : undefined),
              locationCode: locCode ?? undefined,
              coverage: coverage ? (coverage as any) : undefined,
              esimStatus: esimStatus ?? undefined,
              smdpStatus: smdpStatus ?? undefined,
            },
          });
        } catch (e) {
          console.error(`Failed to upsert eSIM profile ${p.esimTranNo}:`, e);
        }
      }

      const customerOrder = await prisma.customerOrder.findFirst({
        where: { orderId },
        include: { store: true },
      });
      if (!customerOrder) {
        console.log(`Profiles saved for merchant order ${orderId} (no store order to email)`);
        return;
      }

      const qrCodes = await Promise.all(
        profiles.map((profile) =>
          qrCodeService.generateQRCode({
            esimTranNo: profile.esimTranNo,
            iccid: profile.iccid,
            imsi: profile.imsi,
            qrCodeUrl: profile.qrCodeUrl,
          })
        )
      );
      await emailService.sendESIMDeliveryEmail({
        email: customerOrder.customerEmail,
        order: {
          id: customerOrder.id,
          totalAmount: Number(customerOrder.totalAmount),
          esimAccessOrderNo: customerOrder.esimAccessOrderNo,
        },
        qrCodes,
        profiles: profiles.map(p => ({
          esimTranNo: p.esimTranNo,
          iccid: p.iccid,
          data: `${(p.totalVolume / (1024 * 1024 * 1024)).toFixed(1)}GB`,
          validity: `${p.totalDuration} ${p.durationUnit}`,
        })),
        customerName: customerOrder.customerName || undefined,
        storeName: customerOrder.store.businessName || customerOrder.store.name,
      });
      console.log(`eSIM delivery email sent for order ${customerOrder.id}`);
    } catch (error: any) {
      console.error('Error in deliverESIMs:', error);
      throw error;
    }
  }
}

export const webhookService = new WebhookService();


