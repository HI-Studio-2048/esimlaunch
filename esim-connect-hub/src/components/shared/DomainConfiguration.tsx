import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, CheckCircle, XCircle, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { DNSInstructions } from "./DNSInstructions";
import { cn } from "@/lib/utils";

interface DomainConfigurationProps {
  storeId?: string;
  currentDomain?: string;
  currentSubdomain?: string;
  onUpdate?: () => void;
}

type DomainStatus = "pending" | "verified" | "error" | "checking" | null;

export function DomainConfiguration({
  storeId,
  currentDomain,
  currentSubdomain,
  onUpdate,
}: DomainConfigurationProps) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [subdomain, setSubdomain] = useState(currentSubdomain || "");
  const [domainStatus, setDomainStatus] = useState<DomainStatus>(null);
  const [sslStatus, setSslStatus] = useState<"active" | "pending" | "error" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dnsExpanded, setDnsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentDomain) {
      setDomain(currentDomain);
      // Check domain status if domain exists
      checkDomainStatus();
    }
    if (currentSubdomain) {
      setSubdomain(currentSubdomain);
    }
  }, [currentDomain, currentSubdomain]);

  const validateDomain = (domainValue: string): boolean => {
    if (!domainValue) return true; // Empty is valid (optional)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domainValue);
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (value && !validateDomain(value)) {
      setDomainStatus("error");
    } else if (value) {
      setDomainStatus("pending");
    } else {
      setDomainStatus(null);
    }
  };

  const checkDomainStatus = async () => {
    if (!domain || !storeId) return;
    
    setIsVerifying(true);
    setDomainStatus("checking");
    try {
      // Mock verification - replace with actual API call when available
      if (apiClient.verifyDomain) {
        const status = await apiClient.verifyDomain(domain);
        setDomainStatus(status.verified ? "verified" : "pending");
        setSslStatus(status.sslActive ? "active" : status.verified ? "pending" : null);
      } else {
        // Fallback mock
        setDomainStatus("pending");
        setSslStatus("pending");
      }
    } catch (error) {
      setDomainStatus("error");
      setSslStatus("error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) {
      toast({
        title: "Error",
        description: "Store ID is required to update domain settings",
        variant: "destructive",
      });
      return;
    }

    if (domain && !validateDomain(domain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain name (e.g., esim.yourcompany.com)",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateStore(storeId, {
        domain: domain || undefined,
        subdomain: subdomain || undefined,
      });
      
      toast({
        title: "Domain Updated",
        description: "Your domain settings have been saved successfully",
      });
      
      onUpdate?.();
      
      // If domain was added, check status
      if (domain) {
        setTimeout(() => checkDomainStatus(), 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update domain settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasChanges = domain !== (currentDomain || "") || subdomain !== (currentSubdomain || "");

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {(currentDomain || currentSubdomain) && (
        <div className="p-4 rounded-xl bg-card border">
          <h3 className="font-medium mb-3">Current Configuration</h3>
          <div className="space-y-2 text-sm">
            {currentSubdomain && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subdomain:</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded">
                    {currentSubdomain}.esimlaunch.com
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${currentSubdomain}.esimlaunch.com`, "subdomain")}
                  >
                    {copiedField === "subdomain" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            {currentDomain && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Custom Domain:</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded">{currentDomain}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(currentDomain, "domain")}
                  >
                    {copiedField === "domain" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Domain Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customDomain">
            Custom Domain <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="customDomain"
                placeholder="esim.yourcompany.com"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                className={cn(
                  domain && !validateDomain(domain) && "border-destructive"
                )}
              />
              {domain && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {domainStatus === "verified" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : domainStatus === "error" ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : domainStatus === "checking" || isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
              )}
            </div>
            {domain && validateDomain(domain) && (
              <Button
                variant="outline"
                onClick={checkDomainStatus}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            )}
          </div>
          {domain && !validateDomain(domain) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Please enter a valid domain name (e.g., esim.yourcompany.com)
            </p>
          )}
          {domain && validateDomain(domain) && (
            <p className="text-xs text-muted-foreground">
              Enter your custom domain without http:// or https://
            </p>
          )}
        </div>

        {/* Subdomain Input */}
        <div className="space-y-2">
          <Label htmlFor="subdomain">
            Subdomain <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="subdomain"
              placeholder="yourstore"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">.esimlaunch.com</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose a subdomain for your store (letters, numbers, and hyphens only)
          </p>
        </div>
      </div>

      {/* DNS Instructions */}
      {domain && validateDomain(domain) && (
        <DNSInstructions
          domain={domain}
          targetDomain="esimlaunch.com" // Custom domains point to esimlaunch.com (where stores are hosted)
          isExpanded={dnsExpanded}
          onToggle={() => setDnsExpanded(!dnsExpanded)}
        />
      )}

      {/* Status Indicators */}
      {domain && validateDomain(domain) && (
        <div className="space-y-3 p-4 rounded-xl bg-card border">
          <h4 className="font-medium text-sm">Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">DNS Verification:</span>
              <div className="flex items-center gap-2">
                {domainStatus === "verified" ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Verified</span>
                  </>
                ) : domainStatus === "error" ? (
                  <>
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">Error</span>
                  </>
                ) : domainStatus === "checking" || isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Checking...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500">Pending</span>
                  </>
                )}
              </div>
            </div>
            {domainStatus === "verified" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SSL Certificate:</span>
                <div className="flex items-center gap-2">
                  {sslStatus === "active" ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Active</span>
                    </>
                  ) : sslStatus === "pending" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      <span className="text-yellow-500">Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Not Available</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <Button
          variant="gradient"
          onClick={handleSave}
          disabled={isSaving || (domain && !validateDomain(domain))}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 mr-2" />
              Save Domain Settings
            </>
          )}
        </Button>
      )}
    </div>
  );
}

