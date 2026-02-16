import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, Mail } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function EmailTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await (apiClient as any).getEmailTemplates();
      // apiClient.request for /api/* routes extracts data, so result is the array directly
      const templatesData = Array.isArray(result) ? result : (result?.data || []);
      
      if (templatesData.length > 0) {
        setTemplates(templatesData);
        setSelectedTemplate(templatesData[0]);
      } else {
        // Fallback: Use default templates if API returns empty or invalid data
        const defaultTemplates = [
          {
            id: 'order-confirmation',
            name: 'Order Confirmation',
            subject: 'Order Confirmed - {{orderNumber}}',
            htmlBody: '<h2>Order Confirmed</h2><p>Thank you for your order, {{customerName}}!</p><p><strong>Order Number:</strong> {{orderNumber}}</p><p><strong>Total:</strong> {{totalAmount}}</p><p>We\'ll send your eSIM QR codes shortly.</p>',
            textBody: 'Order Confirmed\n\nThank you for your order, {{customerName}}!\n\nOrder Number: {{orderNumber}}\nTotal: {{totalAmount}}\n\nWe\'ll send your eSIM QR codes shortly.',
            variables: ['orderNumber', 'customerName', 'totalAmount', 'orderDate'],
          },
          {
            id: 'esim-delivery',
            name: 'eSIM Delivery',
            subject: 'Your eSIM is Ready - {{orderNumber}}',
            htmlBody: '<h2>Your eSIM is Ready!</h2><p>Hi {{customerName}},</p><p>Your eSIM for order {{orderNumber}} is ready to use.</p><p>Scan the QR code below to install:</p>{{qrCode}}<p>Need help? <a href="{{helpUrl}}">View setup guide</a></p>',
            textBody: 'Your eSIM is Ready!\n\nHi {{customerName}},\n\nYour eSIM for order {{orderNumber}} is ready to use.\n\nScan the QR code below to install:\n{{qrCode}}\n\nNeed help? View setup guide: {{helpUrl}}',
            variables: ['orderNumber', 'customerName', 'qrCode', 'helpUrl'],
          },
          {
            id: 'ticket-confirmation',
            name: 'Support Ticket Confirmation',
            subject: 'Support Ticket Created - {{ticketNumber}}',
            htmlBody: '<h2>Support Ticket Created</h2><p>Thank you for contacting us, {{customerName}}.</p><p><strong>Ticket Number:</strong> {{ticketNumber}}</p><p><strong>Subject:</strong> {{ticketSubject}}</p><p>We\'ll get back to you soon!</p>',
            textBody: 'Support Ticket Created\n\nThank you for contacting us, {{customerName}}.\n\nTicket Number: {{ticketNumber}}\nSubject: {{ticketSubject}}\n\nWe\'ll get back to you soon!',
            variables: ['ticketNumber', 'customerName', 'ticketSubject'],
          },
        ];
        setTemplates(defaultTemplates);
        setSelectedTemplate(defaultTemplates[0]);
      }
    } catch (error: any) {
      console.error('Failed to load email templates:', error);
      // Fallback: Use default templates if API fails
      const defaultTemplates = [
        {
          id: 'order-confirmation',
          name: 'Order Confirmation',
          subject: 'Order Confirmed - {{orderNumber}}',
          htmlBody: '<h2>Order Confirmed</h2><p>Thank you for your order, {{customerName}}!</p><p><strong>Order Number:</strong> {{orderNumber}}</p><p><strong>Total:</strong> {{totalAmount}}</p><p>We\'ll send your eSIM QR codes shortly.</p>',
          textBody: 'Order Confirmed\n\nThank you for your order, {{customerName}}!\n\nOrder Number: {{orderNumber}}\nTotal: {{totalAmount}}\n\nWe\'ll send your eSIM QR codes shortly.',
          variables: ['orderNumber', 'customerName', 'totalAmount', 'orderDate'],
        },
        {
          id: 'esim-delivery',
          name: 'eSIM Delivery',
          subject: 'Your eSIM is Ready - {{orderNumber}}',
          htmlBody: '<h2>Your eSIM is Ready!</h2><p>Hi {{customerName}},</p><p>Your eSIM for order {{orderNumber}} is ready to use.</p><p>Scan the QR code below to install:</p>{{qrCode}}<p>Need help? <a href="{{helpUrl}}">View setup guide</a></p>',
          textBody: 'Your eSIM is Ready!\n\nHi {{customerName}},\n\nYour eSIM for order {{orderNumber}} is ready to use.\n\nScan the QR code below to install:\n{{qrCode}}\n\nNeed help? View setup guide: {{helpUrl}}',
          variables: ['orderNumber', 'customerName', 'qrCode', 'helpUrl'],
        },
        {
          id: 'ticket-confirmation',
          name: 'Support Ticket Confirmation',
          subject: 'Support Ticket Created - {{ticketNumber}}',
          htmlBody: '<h2>Support Ticket Created</h2><p>Thank you for contacting us, {{customerName}}.</p><p><strong>Ticket Number:</strong> {{ticketNumber}}</p><p><strong>Subject:</strong> {{ticketSubject}}</p><p>We\'ll get back to you soon!</p>',
          textBody: 'Support Ticket Created\n\nThank you for contacting us, {{customerName}}.\n\nTicket Number: {{ticketNumber}}\nSubject: {{ticketSubject}}\n\nWe\'ll get back to you soon!',
          variables: ['ticketNumber', 'customerName', 'ticketSubject'],
        },
      ];
      setTemplates(defaultTemplates);
      setSelectedTemplate(defaultTemplates[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const result = await (apiClient as any).updateEmailTemplate(selectedTemplate.id, {
        subject: selectedTemplate.subject,
        htmlBody: selectedTemplate.htmlBody,
        textBody: selectedTemplate.textBody,
      });

      if (result && result.success) {
        toast({
          title: "Success",
          description: "Email template updated successfully",
        });
      } else {
        throw new Error(result?.errorMessage || 'Failed to update template');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    try {
      // Generate sample variables with realistic values
      const sampleVariables: Record<string, string> = {};
      selectedTemplate.variables?.forEach((variable: string) => {
        // Provide realistic sample values based on variable name
        if (variable.toLowerCase().includes('number') || variable.toLowerCase().includes('id')) {
          sampleVariables[variable] = '12345';
        } else if (variable.toLowerCase().includes('name')) {
          sampleVariables[variable] = 'John Doe';
        } else if (variable.toLowerCase().includes('amount') || variable.toLowerCase().includes('price') || variable.toLowerCase().includes('total')) {
          sampleVariables[variable] = '$29.99';
        } else if (variable.toLowerCase().includes('date')) {
          sampleVariables[variable] = new Date().toLocaleDateString();
        } else if (variable.toLowerCase().includes('url') || variable.toLowerCase().includes('link')) {
          sampleVariables[variable] = 'https://example.com/help';
        } else if (variable.toLowerCase().includes('qr') || variable.toLowerCase().includes('code')) {
          sampleVariables[variable] = '[QR Code Image]';
        } else if (variable.toLowerCase().includes('subject')) {
          sampleVariables[variable] = 'Sample Subject';
        } else {
          sampleVariables[variable] = `Sample ${variable}`;
        }
      });

      const result = await (apiClient as any).previewEmailTemplate(selectedTemplate.id, sampleVariables);

      // apiClient.request extracts data, so result is the preview object directly
      if (result && (result.subject || result.htmlBody)) {
        setPreview(result);
      } else if (result && result.data) {
        // Fallback: if it's still wrapped
        setPreview(result.data);
      } else {
        // If API fails, generate preview locally
        let subject = selectedTemplate.subject;
        let htmlBody = selectedTemplate.htmlBody;
        let textBody = selectedTemplate.textBody || '';

        Object.entries(sampleVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, value);
          htmlBody = htmlBody.replace(regex, value);
          textBody = textBody.replace(regex, value);
        });

        setPreview({ subject, htmlBody, textBody });
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      // Fallback: Generate preview locally if API fails
      try {
        const sampleVariables: Record<string, string> = {};
        selectedTemplate.variables?.forEach((variable: string) => {
          if (variable.toLowerCase().includes('number') || variable.toLowerCase().includes('id')) {
            sampleVariables[variable] = '12345';
          } else if (variable.toLowerCase().includes('name')) {
            sampleVariables[variable] = 'John Doe';
          } else if (variable.toLowerCase().includes('amount') || variable.toLowerCase().includes('price') || variable.toLowerCase().includes('total')) {
            sampleVariables[variable] = '$29.99';
          } else if (variable.toLowerCase().includes('date')) {
            sampleVariables[variable] = new Date().toLocaleDateString();
          } else if (variable.toLowerCase().includes('url') || variable.toLowerCase().includes('link')) {
            sampleVariables[variable] = 'https://example.com/help';
          } else if (variable.toLowerCase().includes('qr') || variable.toLowerCase().includes('code')) {
            sampleVariables[variable] = '[QR Code Image]';
          } else {
            sampleVariables[variable] = `Sample ${variable}`;
          }
        });

        let subject = selectedTemplate.subject;
        let htmlBody = selectedTemplate.htmlBody;
        let textBody = selectedTemplate.textBody || '';

        Object.entries(sampleVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, value);
          htmlBody = htmlBody.replace(regex, value);
          textBody = textBody.replace(regex, value);
        });

        setPreview({ subject, htmlBody, textBody });
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: error.message || "Failed to preview template",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Email Templates</h1>
          <p className="text-muted-foreground">
            Customize your email templates for order confirmations and eSIM delivery
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Template List */}
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Editor */}
          {selectedTemplate && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>
                      Available variables: {selectedTemplate.variables?.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="subject" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="subject">Subject</TabsTrigger>
                    <TabsTrigger value="html">HTML Body</TabsTrigger>
                    <TabsTrigger value="text">Text Body</TabsTrigger>
                  </TabsList>

                  <TabsContent value="subject">
                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          subject: e.target.value,
                        })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="html">
                    <div className="space-y-2">
                      <Label>HTML Body</Label>
                      <Textarea
                        value={selectedTemplate.htmlBody}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          htmlBody: e.target.value,
                        })}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="text">
                    <div className="space-y-2">
                      <Label>Text Body (Plain Text)</Label>
                      <Textarea
                        value={selectedTemplate.textBody || ''}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          textBody: e.target.value,
                        })}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Modal */}
        {preview && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <p className="font-medium">{preview.subject}</p>
                </div>
                <div>
                  <Label>HTML Preview</Label>
                  <div
                    className="border rounded-lg p-4 bg-muted"
                    dangerouslySetInnerHTML={{ __html: preview.htmlBody }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

