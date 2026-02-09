import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DNSInstructionsProps {
  domain: string;
  targetDomain?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function DNSInstructions({ 
  domain, 
  targetDomain = "yourstore.esimlaunch.com",
  isExpanded: controlledExpanded,
  onToggle
}: DNSInstructionsProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsExpanded = onToggle || ((_val?: boolean) => setInternalExpanded(prev => !prev));

  const cnameRecord = domain;
  const targetRecord = targetDomain;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: "DNS record copied to clipboard",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const dnsProviders = [
    { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" },
    { name: "GoDaddy", url: "https://www.godaddy.com/help/add-a-cname-record-19236" },
    { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/223/2237/how-can-i-set-up-a-cname-record-for-my-domain/" },
    { name: "Google Domains", url: "https://support.google.com/domains/answer/7630973" },
    { name: "AWS Route 53", url: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html" },
  ];

  if (!domain) return null;

  return (
    <div className="mt-4 border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">DNS Configuration Instructions</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 bg-muted/30">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  To use your custom domain, you need to configure a CNAME record in your DNS settings. 
                  This typically takes 5-30 minutes to propagate.
                </p>
              </div>

              {/* DNS Record Display */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    CNAME Record
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-background rounded-lg border border-border font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{cnameRecord}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground">Value:</span>
                        <span>{targetRecord}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${cnameRecord} CNAME ${targetRecord}`, "cname")}
                      className="flex-shrink-0"
                    >
                      {copiedField === "cname" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step-by-step Instructions */}
              <div className="space-y-3 pt-2">
                <h4 className="font-medium text-sm">Step-by-step Instructions:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Log in to your domain registrar or DNS provider</li>
                  <li>Navigate to DNS management or DNS settings</li>
                  <li>Find the option to add a new CNAME record</li>
                  <li>
                    Enter <code className="px-1 py-0.5 bg-background rounded text-foreground">{cnameRecord}</code> as the name/host
                  </li>
                  <li>
                    Enter <code className="px-1 py-0.5 bg-background rounded text-foreground">{targetRecord}</code> as the value/target
                  </li>
                  <li>Set TTL to 3600 (or leave as default)</li>
                  <li>Save the record and wait for DNS propagation (5-30 minutes)</li>
                </ol>
              </div>

              {/* DNS Provider Links */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Need help? Check your DNS provider's documentation:
                </p>
                <div className="flex flex-wrap gap-2">
                  {dnsProviders.map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {provider.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



