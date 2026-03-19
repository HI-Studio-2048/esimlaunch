import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { StoreConfigService } from '../esim/store-config.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    private storeConfig: StoreConfigService,
    private prisma: PrismaService,
  ) {
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

  /** Cache for merchant email templates fetched from hub. TTL 5 minutes. */
  private hubTemplateCache: { templates: Record<string, { subject?: string; htmlBody?: string }>; expiresAt: number } | null = null;

  /**
   * Fetch merchant-customized email templates from main backend (if linked).
   * Returns a map of templateId -> { subject, htmlBody }.
   */
  private async fetchHubTemplates(): Promise<Record<string, { subject?: string; htmlBody?: string }>> {
    if (!this.storeConfig.isLinked()) return {};

    const now = Date.now();
    if (this.hubTemplateCache && this.hubTemplateCache.expiresAt > now) {
      return this.hubTemplateCache.templates;
    }

    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');
    const syncSecret = this.config.get<string>('TEMPLATE_ORDER_SYNC_SECRET');
    if (!baseUrl || !syncSecret) return {};

    const config = await this.storeConfig.getConfig();
    if (!config?.storeId) return {};

    try {
      const res = await fetch(
        `${baseUrl.replace(/\/$/, '')}/api/integration/email-templates?storeId=${encodeURIComponent(config.storeId)}`,
        { headers: { 'x-template-sync-secret': syncSecret } },
      );
      if (!res.ok) return this.hubTemplateCache?.templates ?? {};

      const json = (await res.json()) as { success?: boolean; data?: any[] };
      const templates: Record<string, { subject?: string; htmlBody?: string }> = {};
      for (const t of json.data ?? []) {
        if (t.templateId && t.htmlBody) {
          templates[t.templateId] = { subject: t.subject, htmlBody: t.htmlBody };
        }
      }
      this.hubTemplateCache = { templates, expiresAt: now + 5 * 60 * 1000 };
      return templates;
    } catch (err) {
      this.logger.warn('Failed to fetch hub email templates', err);
      return this.hubTemplateCache?.templates ?? {};
    }
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
    const data = { ...opts.data };
    if (this.storeConfig.isLinked()) {
      const config = await this.storeConfig.getConfig();
      if (config?.branding) {
        (data as Record<string, unknown>).businessName = config.branding.businessName;
        (data as Record<string, unknown>).logoUrl = config.branding.logoUrl ?? null;
      }
    }

    // Try merchant-customized template from hub first, fall back to local .hbs
    let html: string;
    let subject = opts.subject;
    const hubTemplates = await this.fetchHubTemplates();
    const hubTemplate = hubTemplates[opts.template];
    if (hubTemplate?.htmlBody) {
      html = handlebars.compile(hubTemplate.htmlBody)(data);
      if (hubTemplate.subject) {
        subject = handlebars.compile(hubTemplate.subject)(data);
      }
    } else {
      html = this.renderTemplate(opts.template, data);
    }

    const from = this.config.get<string>('EMAIL_FROM') || this.config.get<string>('SMTP_USER') || 'noreply@esimlaunch.com';

    try {
      await this.transporter.sendMail({ from, to: opts.to, subject, html });
      this.logger.log(`Email sent [${opts.template}] to ${opts.to}`);
      await this.prisma.emailLog.create({
        data: { to: opts.to, subject, template: opts.template, status: 'sent' },
      }).catch((e) => this.logger.warn('Failed to log email', e));
    } catch (err) {
      this.logger.error(`Failed to send email [${opts.template}] to ${opts.to}`, err);
      await this.prisma.emailLog.create({
        data: { to: opts.to, subject, template: opts.template, status: 'failed' },
      }).catch((e) => this.logger.warn('Failed to log email failure', e));
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

  sendTopupConfirmation(opts: {
    to: string;
    planCode: string;
    iccid: string;
    amount?: string;
    myEsimsUrl?: string;
  }): Promise<void> {
    return this.send({
      to: opts.to,
      subject: 'Your data top-up is confirmed!',
      template: 'topup-confirmation',
      data: {
        planCode: opts.planCode,
        iccid: opts.iccid,
        amount: opts.amount,
        myEsimsUrl: opts.myEsimsUrl,
      },
    });
  }
}
