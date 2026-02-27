import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Code2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Webhook,
  Pencil,
  X,
  KeyRound,
  RotateCcw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeyRow {
  id: string;
  name: string;
  token: string;
  prefix?: string;
  createdAt?: string;
  type: "access" | "secret" | "custom";
}

interface WebhookConfig {
  url: string;
  id?: string;
}

export default function Developer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [rollingKeys, setRollingKeys] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([{ url: "" }]);
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [editingWebhookIdx, setEditingWebhookIdx] = useState<number | null>(null);
  const [webhookDraft, setWebhookDraft] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
    loadWebhooks();
  }, []);

  const loadApiKeys = async () => {
    setKeysLoading(true);
    try {
      const res = await apiClient.getApiKeys();
      // The API returns an array directly, but handle different response formats
      const keys = Array.isArray(res) ? res : (res?.apiKeys || res?.keys || []);
      setApiKeys((prevKeys) => {
        // Create a map of existing keys with full tokens (preserve them)
        const existingTokens = new Map(prevKeys.map(k => [k.id, k.token]));
        
        return keys.map((k: any) => {
          const existingToken = existingTokens.get(k.id);
          return {
            id: k.id,
            name: k.name || "API Key",
            // API only returns full key on creation, otherwise just keyPrefix
            // Preserve full token if we have it in state, otherwise use empty string
            token: existingToken && existingToken.length > 12 ? existingToken : "",
            prefix: k.prefix || k.keyPrefix || (k.key || "").slice(0, 12),
            createdAt: k.createdAt,
            type: k.name?.toLowerCase().includes("secret") ? "secret" : "custom",
          };
        });
      });
    } catch (err: any) {
      console.warn("API keys unavailable:", err?.message);
      setApiKeys([]);
    } finally {
      setKeysLoading(false);
    }
  };

  const loadWebhooks = async () => {
    setWebhookLoading(true);
    try {
      const res = await apiClient.getWebhooks();
      const list = res?.webhooks || (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        setWebhooks(list.map((w: any) => ({ url: w.url || "", id: w.id })));
      }
    } catch {
      // Non-blocking
    } finally {
      setWebhookLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskToken = (token: string, prefix?: string) => {
    // If we have a prefix (from API), use it for masking
    if (prefix) {
      return prefix + "•".repeat(24);
    }
    // Otherwise mask the token itself
    if (!token) return "—";
    if (token.length <= 12) return "•".repeat(token.length);
    return token.slice(0, 12) + "•".repeat(Math.min(token.length - 12, 24));
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await apiClient.createApiKey(newKeyName, 1000);
      // Get the full API key (only available on creation)
      const fullKey = res?.key || res?.apiKey || res?.token || "";
      
      // Store the full key (only available on creation)
      const newKey: ApiKeyRow = {
        id: res?.id || Date.now().toString(),
        name: newKeyName,
        token: fullKey,
        prefix: res?.keyPrefix || fullKey.slice(0, 12),
        createdAt: res?.createdAt || new Date().toISOString(),
        type: "custom",
      };
      
      // Note: API keys are stored in the database and can be used for external API calls
      // For dashboard/internal use, JWT tokens are used (which work across devices)
      // API keys in localStorage are only needed for external integrations
      
      // Add to local state immediately for display
      setApiKeys((prev) => [...prev, newKey]);
      setVisibleKeys((prev) => new Set(prev).add(newKey.id));
      setNewKeyName("");
      setShowCreateForm(false);
      // Reload keys from server to ensure sync (will preserve the full token we just stored)
      await loadApiKeys();
      toast({
        title: "API Key created",
        description: "Copy the key now — it won't be shown again.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create API key.", variant: "destructive" });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? Any integrations using it will stop working.")) return;
    try {
      await apiClient.revokeApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "Key revoked", description: "API key has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to revoke key.", variant: "destructive" });
    }
  };

  const handleRollKeys = async () => {
    if (!confirm("Roll all API keys? All existing keys will be invalidated.")) return;
    setRollingKeys(true);
    try {
      // Revoke all and create new ones
      for (const k of apiKeys) {
        await apiClient.revokeApiKey(k.id);
      }
      const res = await apiClient.createApiKey("Default", 1000);
      // Get the full API key (only available on creation)
      const fullKey = res?.key || res?.apiKey || "";
      
      // Store the full key (only available on creation)
      const newKey: ApiKeyRow = {
        id: res?.id || Date.now().toString(),
        name: "Default",
        token: fullKey,
        prefix: res?.keyPrefix || fullKey.slice(0, 12),
        createdAt: res?.createdAt || new Date().toISOString(),
        type: "custom",
      };
      
      // Note: API keys are stored in the database and can be used for external API calls
      // For dashboard/internal use, JWT tokens are used (which work across devices)
      
      // Set the new key immediately
      setApiKeys([newKey]);
      setVisibleKeys(new Set([newKey.id]));
      // Reload keys from server to ensure sync (will preserve the full token we just stored)
      await loadApiKeys();
      toast({ title: "Keys rolled", description: "New API keys have been generated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to roll keys.", variant: "destructive" });
    } finally {
      setRollingKeys(false);
    }
  };

  const handleSaveWebhook = async (idx: number) => {
    setSavingWebhook(true);
    try {
      const current = webhooks[idx];
      if (current.id) {
        await apiClient.updateWebhook(current.id, webhookDraft, ["*"]);
        setWebhooks((prev) => prev.map((w, i) => i === idx ? { ...w, url: webhookDraft } : w));
      } else {
        const res = await apiClient.createWebhook(webhookDraft, ["*"]);
        setWebhooks((prev) => prev.map((w, i) => i === idx ? { url: webhookDraft, id: res?.id } : w));
      }
      setEditingWebhookIdx(null);
      toast({ title: "Webhook saved", description: "Webhook URL has been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save webhook.", variant: "destructive" });
    } finally {
      setSavingWebhook(false);
    }
  };

  const TokenRow = ({ keyRow }: { keyRow: ApiKeyRow }) => {
    const isVisible = visibleKeys.has(keyRow.id);
    const hasFullToken = !!keyRow.token && keyRow.token.length > 12; // Full token is longer than prefix
    const displayToken = isVisible && hasFullToken 
      ? keyRow.token 
      : maskToken(keyRow.token, keyRow.prefix);
    const copied = copiedKey === keyRow.id;

    return (
      <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
        <td className="py-3 px-4 text-sm font-medium">{keyRow.name}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className={cn("font-mono text-xs", !isVisible && "tracking-widest text-muted-foreground")}>
              {displayToken || "—"}
            </span>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
          {keyRow.createdAt ? new Date(keyRow.createdAt).toLocaleDateString() : "—"}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            {hasFullToken && (
              <>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => toggleVisibility(keyRow.id)}
                  className="h-7 w-7"
                  title={isVisible ? "Hide" : "Show"}
                >
                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => copyToClipboard(keyRow.token, keyRow.id)}
                  className="h-7 w-7"
                  title="Copy"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </>
            )}
            <Button
              variant="ghost" size="icon"
              onClick={() => handleRevokeKey(keyRow.id)}
              className="h-7 w-7 text-destructive hover:text-destructive"
              title="Revoke"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Developer</h1>
              <p className="text-sm text-muted-foreground">API keys, webhooks, and documentation</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/api-docs")}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              API Docs
            </Button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 max-w-4xl">
        {/* API Keys Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border overflow-hidden mb-5"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              API Keys
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRollKeys}
                disabled={rollingKeys || apiKeys.length === 0}
                className="gap-2 h-8"
              >
                {rollingKeys ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Roll Keys
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="gap-2 h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                New Key
              </Button>
            </div>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Key Name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Key"
                  className="h-9 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                />
              </div>
              <Button size="sm" onClick={handleCreateKey} disabled={creatingKey || !newKeyName.trim()} className="h-9 gap-2">
                {creatingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowCreateForm(false); setNewKeyName(""); }} className="h-9">
                Cancel
              </Button>
            </div>
          )}

          {keysLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Code2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm font-medium mb-1">No API keys yet</p>
              <p className="text-xs mb-4">Create your first API key to start using the API.</p>
              <Button size="sm" variant="gradient" onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Token</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Create Time</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((keyRow) => (
                    <TokenRow key={keyRow.id} keyRow={keyRow} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Webhook Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border overflow-hidden mb-5"
        >
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Webhook className="w-4 h-4 text-primary" />
              Webhooks
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              eSIMlaunch will send HTTP POST requests to your URL when events occur.
            </p>
          </div>
          <div className="p-5 space-y-3">
            {webhookLoading ? (
              <div className="h-12 bg-muted rounded animate-pulse" />
            ) : (
              webhooks.map((webhook, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    {editingWebhookIdx === idx ? (
                      <Input
                        value={webhookDraft}
                        onChange={(e) => setWebhookDraft(e.target.value)}
                        placeholder="https://your-server.com/webhook"
                        className="h-9 text-sm font-mono"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveWebhook(idx);
                          if (e.key === "Escape") setEditingWebhookIdx(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted/30">
                        <span className={cn("text-sm font-mono flex-1", !webhook.url && "text-muted-foreground")}>
                          {webhook.url || "No URL configured"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingWebhookIdx === idx ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSaveWebhook(idx)}
                          disabled={savingWebhook}
                          className="h-9 gap-2"
                        >
                          {savingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingWebhookIdx(null)}
                          className="h-9"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWebhookDraft(webhook.url);
                          setEditingWebhookIdx(idx);
                        }}
                        className="h-9 gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* API Docs Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
              <Code2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base">API Documentation</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Learn how to integrate eSIMlaunch API into your platform. Full reference with examples.
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={() => navigate("/api-docs")}
              className="gap-2 shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              View Docs
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

