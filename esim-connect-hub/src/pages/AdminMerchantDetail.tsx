import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Calendar,
  Loader2,
  ArrowLeft,
  Store,
  CreditCard,
  MessageSquare,
  Shield,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Users,
  UserPlus,
  Trash2,
} from "lucide-react";

const ADMIN_EMAIL = "admin@esimlaunch.com";

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
      <span className="text-sm text-muted-foreground w-40 flex-shrink-0">{label}</span>
      <span className="text-sm flex-1">{children}</span>
    </div>
  );
}

export default function AdminMerchantDetail() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { merchantId } = useParams<{ merchantId: string }>();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin || !merchantId) return;
    const fetchMerchant = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.getAdminMerchant(merchantId);
        setMerchant(res ?? null);
      } catch (e: any) {
        setError(e?.message || "Failed to load merchant");
      } finally {
        setLoading(false);
      }
    };
    fetchMerchant();
  }, [isAdmin, merchantId]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  if (error || !merchant) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link to="/admin/merchants">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Merchants
          </Button>
        </Link>
        <p className="text-destructive text-sm">{error || "Merchant not found."}</p>
      </div>
    );
  }

  const sub = merchant.subscription;

  const handleDelete = async () => {
    if (!merchantId) return;
    setDeleting(true);
    try {
      const result: any = await apiClient.deleteAdminMerchant(merchantId);
      const stripe = result?.report?.stripe ?? "skipped";
      const clerk = result?.report?.clerk ?? "skipped";
      toast({
        title: "Merchant deleted",
        description: `Stripe: ${stripe}. Clerk: ${clerk}.`,
      });
      navigate("/admin/merchants", { replace: true });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete merchant",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/admin/merchants">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Merchants
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{merchant.name || merchant.email}</h1>
            {merchant.role === "ADMIN" && (
              <Badge className="text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin
              </Badge>
            )}
            {!merchant.isActive && (
              <Badge variant="destructive" className="text-xs">Inactive</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{merchant.email}</p>
          <p className="text-xs text-muted-foreground mt-1">ID: {merchant.id}</p>
        </div>
        {merchant.role !== "ADMIN" && merchant.id !== user?.id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1.5" />
                )}
                Delete merchant
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {merchant.email}?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm">
                    <p>This permanently removes the merchant. The action will:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Cancel and delete their Stripe customer + subscription{sub?.stripeSubscriptionId ? "" : " (none on file)"}</li>
                      <li>Delete their Clerk account{merchant.clerkUserId ? "" : " (none on file)"}</li>
                      <li>
                        Delete <strong>{merchant.stores?.length ?? 0} store(s)</strong>,{" "}
                        <strong>{merchant.referrals?.length ?? 0} referral record(s)</strong>,
                        and all their orders, API keys, commissions, and clicks
                      </li>
                    </ul>
                    <p className="text-destructive font-medium pt-2">This cannot be undone.</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting…" : "Delete permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Profile */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="px-6 py-2">
          <InfoRow label="Email">
            <a href={`mailto:${merchant.email}`} className="text-primary hover:underline flex items-center gap-1">
              {merchant.email} <Mail className="w-3.5 h-3.5" />
            </a>
          </InfoRow>
          <InfoRow label="Name">{merchant.name || <span className="text-muted-foreground">—</span>}</InfoRow>
          <InfoRow label="Service type">
            <Badge variant="secondary" className="text-xs">{merchant.serviceType}</Badge>
          </InfoRow>
          <InfoRow label="Role">
            <span className={merchant.role === "ADMIN" ? "text-primary font-medium" : ""}>{merchant.role}</span>
          </InfoRow>
          <InfoRow label="Email verified">
            {merchant.emailVerified
              ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
              : <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> Not verified</span>}
          </InfoRow>
          <InfoRow label="2FA">
            {merchant.twoFactorEnabled
              ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Enabled</span>
              : <span className="text-muted-foreground">Disabled</span>}
          </InfoRow>
          <InfoRow label="Joined"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{formatDate(merchant.createdAt)}</span></InfoRow>
          <InfoRow label="Referral code">{merchant.referralCode || <span className="text-muted-foreground">—</span>}</InfoRow>
          <InfoRow label="Referred by">
            {merchant.referredByMerchant ? (
              <Link
                to={`/admin/merchants/${merchant.referredByMerchant.id}`}
                className="text-primary hover:underline flex items-center gap-1"
              >
                {merchant.referredByMerchant.affiliateHandle ?? merchant.referredByMerchant.name ?? merchant.referredByMerchant.email}
                <span className="text-muted-foreground text-xs">({merchant.referredByMerchant.email})</span>
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </InfoRow>
        </div>
      </section>

      {/* Referrals */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">
            Referrals ({merchant.referrals?.length ?? 0})
          </h2>
          {merchant.referrals?.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {merchant.referrals.filter((r: any) => r.active).length} active
            </span>
          )}
        </div>
        <div className="px-6 py-4">
          {!merchant.referrals || merchant.referrals.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              This merchant hasn't referred anyone yet.
            </p>
          ) : (
            <div className="space-y-2">
              {merchant.referrals.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm bg-muted/30 border rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium">{r.name || r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </div>
                    {r.active ? (
                      <Badge className="bg-green-600 hover:bg-green-600 text-xs">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Signed up</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.signedUpAt)}
                    </span>
                    <Link
                      to={`/admin/merchants/${r.id}`}
                      className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Subscription</h2>
        </div>
        <div className="px-6 py-2">
          {sub ? (
            <>
              <InfoRow label="Plan"><span className="capitalize font-medium">{sub.plan}</span></InfoRow>
              <InfoRow label="Billing"><span className="capitalize">{sub.billingPeriod}</span></InfoRow>
              <InfoRow label="Status">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  sub.status === "active"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : sub.status === "past_due"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}>{sub.status}</span>
                {sub.cancelAtPeriodEnd && <span className="ml-2 text-xs text-orange-600">Cancels at period end</span>}
              </InfoRow>
              <InfoRow label="Period start">{formatDate(sub.currentPeriodStart)}</InfoRow>
              <InfoRow label="Period end">{formatDate(sub.currentPeriodEnd)}</InfoRow>
            </>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No active subscription.</p>
          )}
        </div>
      </section>

      {/* Stores */}
      <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Store className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Stores ({merchant.stores?.length ?? 0})</h2>
        </div>
        {merchant.stores?.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">No stores yet.</p>
        ) : (
          <div className="divide-y">
            {merchant.stores?.map((s: any) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/20">
                <div>
                  <div className="font-medium">{s.businessName}</div>
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {s.subdomainUrl && (
                      <a
                        href={s.subdomainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {s.subdomainUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {s.customDomainUrl && (
                      <a
                        href={s.customDomainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {s.customDomainUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      s.adminStatus === "completed"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : s.adminStatus === "in_progress"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : s.adminStatus === "rejected"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}>
                      {(s.adminStatus || "pending_review").replace("_", " ")}
                    </span>
                  </div>
                </div>
                <Link to={`/admin/stores/${s.id}`}>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Onboarding progress */}
      {merchant.onboardingProgress && (
        <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Onboarding progress</h2>
          </div>
          <div className="px-6 py-4">
            {(() => {
              const progress: Record<string, boolean> = merchant.onboardingProgress || {};
              const steps: { key: string; label: string }[] = [
                { key: "account", label: "Account created" },
                { key: "store", label: "Store created" },
                { key: "domain", label: "Domain connected" },
                { key: "firstSale", label: "First sale" },
                { key: "apiKey", label: "API key generated" },
                { key: "subscription", label: "Subscription active" },
              ];

              const hasAny = Object.keys(progress).some((k) => progress[k]);

              if (!hasAny) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No onboarding milestones recorded yet for this merchant.
                  </p>
                );
              }

              return (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {steps.map((step) => {
                    const completed = !!progress[step.key];
                    return (
                      <div
                        key={step.key}
                        className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                      >
                        {completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-60" />
                        )}
                        <span className={completed ? "font-medium" : "text-muted-foreground"}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* Recent support tickets */}
      {merchant.supportTickets?.length > 0 && (
        <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent support tickets ({merchant.supportTickets.length})</h2>
          </div>
          <div className="divide-y">
            {merchant.supportTickets.map((t: any) => (
              <div key={t.id} className="px-6 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono text-xs text-muted-foreground mr-2">{t.ticketNumber}</span>
                  <span>{t.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    t.status === "open"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : t.status === "resolved"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>{t.status}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="bg-card border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Stats</h2>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{merchant._count?.orders ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{merchant._count?.apiKeys ?? 0}</p>
            <p className="text-sm text-muted-foreground">API keys</p>
          </div>
        </div>
      </section>
    </div>
  );
}
