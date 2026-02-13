import { prisma } from '../lib/prisma';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables: string[]; // Available variables for this template
}

export const emailTemplateService = {
  /**
   * Get email templates for merchant
   */
  async getTemplates(merchantId: string): Promise<EmailTemplate[]> {
    // For now, return default templates
    // In production, these would be stored in the database and customizable
    return [
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmed - {{orderNumber}}',
        htmlBody: `
          <h2>Order Confirmed</h2>
          <p>Thank you for your order, {{customerName}}!</p>
          <p><strong>Order Number:</strong> {{orderNumber}}</p>
          <p><strong>Total:</strong> {{totalAmount}}</p>
          <p>We'll send your eSIM QR codes shortly.</p>
        `,
        variables: ['orderNumber', 'customerName', 'totalAmount', 'orderDate'],
      },
      {
        id: 'esim-delivery',
        name: 'eSIM Delivery',
        subject: 'Your eSIM is Ready - {{orderNumber}}',
        htmlBody: `
          <h2>Your eSIM is Ready!</h2>
          <p>Hi {{customerName}},</p>
          <p>Your eSIM for order {{orderNumber}} is ready to use.</p>
          <p>Scan the QR code below to install:</p>
          {{qrCode}}
          <p>Need help? <a href="{{helpUrl}}">View setup guide</a></p>
        `,
        variables: ['orderNumber', 'customerName', 'qrCode', 'helpUrl'],
      },
      {
        id: 'ticket-confirmation',
        name: 'Support Ticket Confirmation',
        subject: 'Support Ticket Created - {{ticketNumber}}',
        htmlBody: `
          <h2>Support Ticket Created</h2>
          <p>Thank you for contacting us, {{customerName}}.</p>
          <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
          <p><strong>Subject:</strong> {{ticketSubject}}</p>
          <p>We'll get back to you soon!</p>
        `,
        variables: ['ticketNumber', 'customerName', 'ticketSubject'],
      },
    ];
  },

  /**
   * Get template by ID
   */
  async getTemplate(merchantId: string, templateId: string): Promise<EmailTemplate | null> {
    const templates = await this.getTemplates(merchantId);
    return templates.find(t => t.id === templateId) || null;
  },

  /**
   * Update template (save custom template)
   */
  async updateTemplate(
    merchantId: string,
    templateId: string,
    updates: Partial<EmailTemplate>
  ) {
    // In production, save to database
    // For now, return success
    return {
      success: true,
      message: 'Template updated successfully',
    };
  },

  /**
   * Render template with variables
   */
  renderTemplate(template: EmailTemplate, variables: Record<string, string>): {
    subject: string;
    htmlBody: string;
    textBody?: string;
  } {
    let subject = template.subject;
    let htmlBody = template.htmlBody;
    let textBody = template.textBody || '';

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      htmlBody = htmlBody.replace(regex, value);
      textBody = textBody.replace(regex, value);
    });

    return { subject, htmlBody, textBody };
  },

  /**
   * Preview template
   */
  async previewTemplate(
    merchantId: string,
    templateId: string,
    sampleVariables: Record<string, string>
  ) {
    const template = await this.getTemplate(merchantId, templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return this.renderTemplate(template, sampleVariables);
  },
};




