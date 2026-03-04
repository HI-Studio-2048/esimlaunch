import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Store,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Mail,
  Palette,
  Globe,
  Save,
} from "lucide-react";

const ADMIN_EMAIL = "admin@esimlaunch.com";

const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending review" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground w-44 flex-shrink-0">{label}</span>
      <span className="text-sm flex-1">{children}</span>
    </div>
  );
}

export default function AdminStoreDetail() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adminStatus, setAdminStatus] = useState("pending_review");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin || !storeId) return;
    const fetchStore = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.getAdminStore(storeId);
        const data = res;
        setStore(data);
        setAdminStatus(data?.adminStatus || "pending_review");
        setAdminNotes(data?.adminNotes || "");
      } catch (e: any) {
        setError(e?.message || "Failed to load store");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [isAdmin, storeId]);

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    setSaved(false);
    try {
      await apiClient.updateAdminStoreRequest(storeId, { adminStatus, adminNotes });
      setStore((prev: any) => ({ ...prev, adminStatus, adminNotes }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  if (error || !store) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Admin
          </Button>
        </Link>
        <p className="text-destructive text-sm">{error || "Store not found."}</p>
      </div>
    );
  }

  const templateSettings = store.templateSettings
    ? (typeof store.templateSettings === "string"
        ? JSON.parse(store.templateSettings)
        : store.templateSettings)
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Link to="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Admin
          </Button>
        </Link>
        {store.merchant && (
          <>
            <span className="text-muted-foreground">/</span>
            <Link to={`/admin/merchants/${store.merchant.id}`}>
              <Button variant="ghost" size="sm">
                {store.merchant.email}
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{store.businessName}</h1>
          <p className="text-muted-foreground text-sm">{store.name}</p>
          <p className="text-xs text-muted-foreground mt-1">ID: {store.id}</p>
        </div>
      </div>

      {/* Admin status & notes (editable) */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Admin workflow</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">Status</label>
            <Select value={adminStatus} onValueChange={setAdminStatus}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">Admin notes</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes visible only to admins..."
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved</span>}
          </div>
        </div>
      </section>

      {/* Store overview */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Overview</h2>
        </div>
        <div className="px-6 py-2">
          <InfoRow label="Business name">{store.businessName}</InfoRow>
          <InfoRow label="Store name">{store.name}</InfoRow>
          <InfoRow label="Active">
            {store.isActive
              ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
              : <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> No</span>}
          </InfoRow>
          <InfoRow label="Created"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{formatDate(store.createdAt)}</span></InfoRow>
          <InfoRow label="Updated">{formatDate(store.updatedAt)}</InfoRow>
          <InfoRow label="Template">
            <Badge variant="secondary" className="text-xs">{store.templateKey || "default"}</Badge>
          </InfoRow>
          <InfoRow label="Currency">{store.defaultCurrency || "USD"}</InfoRow>
        </div>
      </section>

      {/* URLs */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">URLs</h2>
        </div>
        <div className="px-6 py-2">
          <InfoRow label="Subdomain">
            {store.subdomain ? (
              <div className="space-y-1">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{store.subdomain}</code>
                {store.subdomainUrl && (
                  <a href={store.subdomainUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-xs ml-1">
                    {store.subdomainUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : <span className="text-muted-foreground">—</span>}
          </InfoRow>
          <InfoRow label="Custom domain">
            {store.domain ? (
              <div className="space-y-1">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{store.domain}</code>
                {store.customDomainUrl && (
                  <a href={store.customDomainUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-xs ml-1">
                    {store.customDomainUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : <span className="text-muted-foreground">—</span>}
          </InfoRow>
          <InfoRow label="Domain verified">
            {store.domainVerified
              ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
              : <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> Not verified</span>}
          </InfoRow>
          {store.domainVerificationMethod && (
            <InfoRow label="Verification method">
              <Badge variant="outline" className="text-xs">{store.domainVerificationMethod}</Badge>
            </InfoRow>
          )}
        </div>
      </section>

      {/* Branding */}
      {(store.primaryColor || store.secondaryColor || store.accentColor) && (
        <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Branding</h2>
          </div>
          <div className="px-6 py-4 flex items-center gap-6">
            {[
              { label: "Primary", color: store.primaryColor },
              { label: "Secondary", color: store.secondaryColor },
              { label: "Accent", color: store.accentColor },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full border shadow-sm"
                  style={{ backgroundColor: color || "#ccc" }}
                />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs font-mono">{color || "—"}</p>
                </div>
              </div>
            ))}
            {store.logoUrl && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Logo</p>
                <img src={store.logoUrl} alt="Store logo" className="h-8 object-contain" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Template settings */}
      {templateSettings && (
        <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Template settings</h2>
          </div>
          <div className="px-6 py-4">
            <pre className="text-xs text-muted-foreground overflow-x-auto bg-muted rounded p-3">
              {JSON.stringify(templateSettings, null, 2)}
            </pre>
          </div>
        </section>
      )}

      {/* Merchant */}
      {store.merchant && (
        <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Merchant</h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <a href={`mailto:${store.merchant.email}`} className="text-primary hover:underline">
                  {store.merchant.email}
                </a>
              </div>
              {store.merchant.name && (
                <p className="text-sm text-muted-foreground mt-0.5 ml-5">{store.merchant.name}</p>
              )}
              {store.merchant.subscription && (
                <p className="text-xs text-muted-foreground mt-1 ml-5 capitalize">
                  Plan: {store.merchant.subscription.plan} ({store.merchant.subscription.status})
                </p>
              )}
            </div>
            <Link to={`/admin/merchants/${store.merchant.id}`}>
              <Button variant="outline" size="sm">View merchant</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
