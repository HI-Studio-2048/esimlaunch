import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { EmailService } from '../email/email.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async generatePdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, esimProfile: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 600]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = 560;
    const lineHeight = 18;

    const drawText = (text: string, size: number, bold = false) => {
      const f = bold ? fontBold : font;
      page.drawText(text, { x: 50, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    };

    drawText('Order Receipt', 20, true);
    y -= 10;

    drawText(`Order ID: ${order.id}`, 12);
    drawText(`Plan: ${order.planName ?? order.planId}`, 12);
    const amount = ((order.displayAmountCents ?? order.amountCents) / 100).toFixed(2);
    const currency = order.displayCurrency ?? 'USD';
    drawText(`Amount: ${amount} ${currency}`, 12);
    drawText(`Date: ${order.createdAt.toISOString().split('T')[0]}`, 12);
    drawText(`Status: ${order.status}`, 12);
    y -= 10;

    if (order.esimProfile) {
      drawText('eSIM Details', 14, true);
      if (order.esimProfile.iccid) drawText(`ICCID: ${order.esimProfile.iccid}`, 10);
      if (order.esimProfile.ac) drawText(`Activation Code: ${order.esimProfile.ac}`, 10);
    }

    return Buffer.from(await doc.save());
  }

  async resendReceipt(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, esimProfile: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const user = order.user;
    if (!user) throw new NotFoundException('User not found');

    const planName = order.planName ?? order.planId;
    const displayAmount = ((order.displayAmountCents ?? order.amountCents) / 100).toFixed(2);
    const displayCurrency = order.displayCurrency ?? 'USD';

    if (order.esimProfile) {
      await this.emailService.sendEsimReady({
        to: user.email,
        esimDetails: {
          planName,
          iccid: order.esimProfile.iccid,
          qrCodeUrl: order.esimProfile.qrCodeUrl,
          ac: order.esimProfile.ac,
          myEsimsUrl: `${this.config.get('WEB_APP_URL', 'http://localhost:3000')}/my-esims`,
        },
      });
      this.logger.log(`Resent eSIM-ready email for order ${orderId} to ${user.email}`);
    } else {
      await this.emailService.sendOrderConfirmation({
        to: user.email,
        orderDetails: {
          orderId: order.id,
          planName,
          displayAmount,
          displayCurrency,
          guestAccessLink: null,
        },
      });
      this.logger.log(`Resent order confirmation for order ${orderId} to ${user.email}`);
    }
  }
}
