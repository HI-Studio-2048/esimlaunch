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
      const result = await apiClient.getEmailTemplates();
      setTemplates(result);
      if (result.length > 0) {
        setSelectedTemplate(result[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: selectedTemplate.subject,
          htmlBody: selectedTemplate.htmlBody,
          textBody: selectedTemplate.textBody,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Email template updated successfully",
        });
      } else {
        throw new Error(result.errorMessage || 'Failed to update template');
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
      // Generate sample variables
      const sampleVariables: Record<string, string> = {};
      selectedTemplate.variables?.forEach((variable: string) => {
        sampleVariables[variable] = `Sample ${variable}`;
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/email-templates/${selectedTemplate.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sampleVariables }),
      });
      const result = await response.json();
      if (result.success) {
        setPreview(result.data);
      } else {
        throw new Error(result.errorMessage || 'Failed to preview template');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to preview template",
        variant: "destructive",
      });
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

