import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, CheckCircle2, XCircle, Loader2, Copy, RefreshCw, 
  AlertCircle, ExternalLink, Shield
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function DomainVerification() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    method: string | null;
    error?: string;
    instructions?: any;
  } | null>(null);

  useEffect(() => {
    if (storeId) {
      loadDomainStatus();
    }
  }, [storeId]);

  const loadDomainStatus = async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    try {
      const result = await apiClient.getDomainStatus(storeId);
      if (result) {
        setDomain(result.domain || "");
        setVerificationStatus({
          verified: result.verified || false,
          method: result.sslActive ? 'dns' : null,
          instructions: result,
        });
      }
    } catch (error: any) {
      console.error('Failed to load domain status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVerification = async () => {
    if (!storeId || !domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.verifyDomain(storeId, domain, 'dns');
      
      setVerificationStatus({
        verified: false,
        method: 'dns',
        instructions: result.instructions,
      });

      toast({
        title: "Verification Started",
        description: "Please add the DNS records shown below to your domain's DNS settings.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDNS = async () => {
    if (!storeId) return;

    setIsVerifying(true);
    try {
      const result = await apiClient.verifyDNS(storeId, 'dns');
      
      setVerificationStatus({
        verified: result.verified,
        method: result.method || 'dns',
        error: result.error,
      });

      if (result.verified) {
        toast({
          title: "Success!",
          description: "Domain verified successfully! Your store is now accessible via your custom domain.",
        });
        // Refresh status
        setTimeout(() => loadDomainStatus(), 1000);
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "DNS records not found. Please check your DNS settings.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify domain",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading && !verificationStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Domain Verification</h1>
          <p className="text-muted-foreground">
            Connect your custom domain to your eSIM store. This allows customers to access your store via your own domain name.
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Custom Domain Setup
            </CardTitle>
            <CardDescription>
              Verify ownership of your domain to enable custom domain access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Domain Input */}
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={verificationStatus?.verified}
                />
                {!verificationStatus?.verified && (
                  <Button
                    onClick={handleStartVerification}
                    disabled={isLoading || !domain.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Start Verification"
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your domain without http:// or www (e.g., example.com)
              </p>
            </div>

            {/* Verification Status */}
            {verificationStatus && (
              <div className={`p-4 rounded-lg border ${
                verificationStatus.verified
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {verificationStatus.verified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">
                        Domain Verified
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900 dark:text-yellow-100">
                        Verification Pending
                      </span>
                    </>
                  )}
                </div>
                {verificationStatus.error && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {verificationStatus.error}
                  </p>
                )}
              </div>
            )}

            {/* DNS Instructions */}
            {verificationStatus?.instructions && !verificationStatus.verified && (
              <Tabs defaultValue="txt" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="txt">TXT Record</TabsTrigger>
                  <TabsTrigger value="cname">CNAME Record</TabsTrigger>
                </TabsList>

                <TabsContent value="txt">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">TXT Record Method</CardTitle>
                      <CardDescription>
                        Add this TXT record to your domain's DNS settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Record Type</Label>
                        <div className="flex items-center gap-2">
                          <Badge>TXT</Badge>
                          <code className="flex-1 bg-muted p-2 rounded text-sm">
                            {verificationStatus.instructions.txtRecord?.name || '_esimlaunch-verification'}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(
                              verificationStatus.instructions.txtRecord?.name || '',
                              'Record Name'
                            )}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Record Value</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-muted p-2 rounded text-sm break-all">
                            {verificationStatus.instructions.txtRecord?.value || ''}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(
                              verificationStatus.instructions.txtRecord?.value || '',
                              'Record Value'
                            )}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Log in to your domain registrar or DNS provider</li>
                          <li>Navigate to DNS settings</li>
                          <li>Add a new TXT record with the values above</li>
                          <li>Wait 5-10 minutes for DNS propagation</li>
                          <li>Click "Verify DNS" below</li>
                        </ol>
                      </div>
                      <Button
                        onClick={handleVerifyDNS}
                        disabled={isVerifying}
                        className="w-full"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Verify DNS
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cname">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">CNAME Record Method</CardTitle>
                      <CardDescription>
                        Point your domain to our servers using a CNAME record
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Record Type</Label>
                        <div className="flex items-center gap-2">
                          <Badge>CNAME</Badge>
                          <code className="flex-1 bg-muted p-2 rounded text-sm">
                            {domain || 'your-domain.com'}
                          </code>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Points To</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-muted p-2 rounded text-sm">
                            {verificationStatus.instructions.cnameRecord?.value || `${storeId}.esimlaunch.com`}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(
                              verificationStatus.instructions.cnameRecord?.value || '',
                              'CNAME Value'
                            )}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Log in to your domain registrar or DNS provider</li>
                          <li>Navigate to DNS settings</li>
                          <li>Add a CNAME record pointing to the value above</li>
                          <li>Wait 5-10 minutes for DNS propagation</li>
                          <li>Click "Verify DNS" below</li>
                        </ol>
                      </div>
                      <Button
                        onClick={handleVerifyDNS}
                        disabled={isVerifying}
                        className="w-full"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Verify DNS
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* SSL Status */}
            {verificationStatus?.verified && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">SSL Certificate</p>
                      <p className="text-sm text-muted-foreground">
                        SSL will be automatically provisioned after domain verification
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50">
                    Active
                  </Badge>
                </div>
              </div>
            )}

            {/* Help Links */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Need help?</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="/help-center" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    DNS Setup Guide
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/contact" target="_blank" rel="noopener noreferrer">
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


