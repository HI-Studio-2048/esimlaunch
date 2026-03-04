import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.example.com'),
      port: parseInt(this.config.get<string>('SMTP_PORT', '587'), 10),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  private renderTemplate(templateName: string, data: Record<string, unknown>): string {
    const file = path.join(__dirname, 'templates', `${templateName}.hbs`);
    if (!fs.existsSync(file)) {
      // Fallback: simple text
      return JSON.stringify(data);
    }
    const src = fs.readFileSync(file, 'utf-8');
    return handlebars.compile(src)(data);
  }

  async send(opts: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    const html = this.renderTemplate(opts.template, opts.data);
    const from = this.config.get<string>('EMAIL_FROM', 'noreply@example.com');

    try {
      await this.transporter.sendMail({ from, to: opts.to, subject: opts.subject, html });
      this.logger.log(`Email sent [${opts.template}] to ${opts.to}`);
    } catch (err) {
      this.logger.error(`Failed to send email [${opts.template}] to ${opts.to}`, err);
    }
  }

  // -------------------------------------------------------------------
  // Convenience wrappers
  // -------------------------------------------------------------------

  sendOrderConfirmation(opts: {
    to: string;
    orderDetails: Record<string, unknown>;
  }): Promise<void> {
    return this.send({
      to: opts.to,
      subject: 'Your eSIM order confirmation',
      template: 'order-confirmation',
      data: opts.orderDetails,
    });
  }

  sendEsimReady(opts: {
    to: string;
    esimDetails: Record<string, unknown>;
  }): Promise<void> {
    return this.send({
      to: opts.to,
      subject: 'Your eSIM is ready!',
      template: 'esim-ready',
      data: opts.esimDetails,
    });
  }

  sendGuestAccess(opts: {
    to: string;
    orderId: string;
    token: string;
    appUrl: string;
  }): Promise<void> {
    const link = `${opts.appUrl}/orders/${opts.orderId}?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;
    return this.send({
      to: opts.to,
      subject: 'View your eSIM order',
      template: 'guest-access',
      data: { link, orderId: opts.orderId },
    });
  }
}
