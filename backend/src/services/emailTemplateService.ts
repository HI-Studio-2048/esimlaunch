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
   * Get default templates (used as fallback)
   */
  getDefaultTemplates(): EmailTemplate[] {
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
        textBody: 'Order Confirmed\n\nThank you for your order, {{customerName}}!\n\nOrder Number: {{orderNumber}}\nTotal: {{totalAmount}}\n\nWe\'ll send your eSIM QR codes shortly.',
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
        textBody: 'Your eSIM is Ready!\n\nHi {{customerName}},\n\nYour eSIM for order {{orderNumber}} is ready to use.\n\nScan the QR code below to install:\n{{qrCode}}\n\nNeed help? View setup guide: {{helpUrl}}',
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
        textBody: 'Support Ticket Created\n\nThank you for contacting us, {{customerName}}.\n\nTicket Number: {{ticketNumber}}\nSubject: {{ticketSubject}}\n\nWe\'ll get back to you soon!',
        variables: ['ticketNumber', 'customerName', 'ticketSubject'],
      },
    ];
  },

  /**
   * Get email templates for merchant
   */
  async getTemplates(merchantId: string): Promise<EmailTemplate[]> {
    // Get saved templates from database
    const savedTemplates = await prisma.emailTemplate.findMany({
      where: { merchantId },
    });

    // Get default templates
    const defaultTemplates = this.getDefaultTemplates();

    // Merge: use saved templates if they exist, otherwise use defaults
    return defaultTemplates.map(defaultTemplate => {
      const saved = savedTemplates.find(t => t.templateId === defaultTemplate.id);
      if (saved) {
        return {
          id: saved.templateId,
          name: saved.name,
          subject: saved.subject,
          htmlBody: saved.htmlBody,
          textBody: saved.textBody || defaultTemplate.textBody,
          variables: (saved.variables as string[]) || defaultTemplate.variables,
        };
      }
      return defaultTemplate;
    });
  },

  /**
   * Get template by ID
   */
  async getTemplate(merchantId: string, templateId: string): Promise<EmailTemplate | null> {
    // Try to get from database first
    const saved = await prisma.emailTemplate.findUnique({
      where: {
        merchantId_templateId: {
          merchantId,
          templateId,
        },
      },
    });

    if (saved) {
      return {
        id: saved.templateId,
        name: saved.name,
        subject: saved.subject,
        htmlBody: saved.htmlBody,
        textBody: saved.textBody || undefined,
        variables: (saved.variables as string[]) || undefined,
      };
    }

    // Fall back to default templates
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
    // Get default template to ensure we have all required fields
    const defaultTemplates = this.getDefaultTemplates();
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
    
    if (!defaultTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Prepare data for upsert
    const templateData = {
      merchantId,
      templateId,
      name: updates.name || defaultTemplate.name,
      subject: updates.subject || defaultTemplate.subject,
      htmlBody: updates.htmlBody || defaultTemplate.htmlBody,
      textBody: updates.textBody || defaultTemplate.textBody || null,
      variables: (updates.variables || defaultTemplate.variables) as any,
    };

    // Upsert template (create if doesn't exist, update if it does)
    await prisma.emailTemplate.upsert({
      where: {
        merchantId_templateId: {
          merchantId,
          templateId,
        },
      },
      create: templateData,
      update: {
        name: templateData.name,
        subject: templateData.subject,
        htmlBody: templateData.htmlBody,
        textBody: templateData.textBody,
        variables: templateData.variables,
      },
    });

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







