import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, DollarSign, Link as LinkIcon, Users, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HeroStrip } from "./affiliate/HeroStrip";
import { LeaderboardTab } from "./affiliate/LeaderboardTab";
import { BountiesGoalsTab } from "./affiliate/BountiesGoalsTab";
import { HandleEditor } from "./affiliate/HandleEditor";

type CommissionTypeFilter = "all" | "order" | "subscription" | "bounty" | "weekly_goal";

const TYPE_FILTER_LABELS: { value: CommissionTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "order", label: "Orders" },
  { value: "subscription", label: "Subscriptions" },
  { value: "bounty", label: "Bounties" },
  { value: "weekly_goal", label: "Goals" },
];

function OverviewTab() {
  const { toast } = useToast();
  const [affiliateCode, setAffiliateCode] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CommissionTypeFilter>("all");
  const [referralsOpen, setReferralsOpen] = useState<null | "all" | "active">(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  const openReferrals = async (mode: "all" | "active") => {
    setReferralsOpen(mode);
    if (referrals.length > 0) return;
    setReferralsLoading(true);
    try {
      const data = await apiClient.getAffiliateReferrals();
      setReferrals(data || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load referrals",
        variant: "destructive",
      });
    } finally {
      setReferralsLoading(false);
    }
  };

  const visibleReferrals = referralsOpen === "active"
    ? referrals.filter((r) => r.active)
    : referrals;

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    setIsLoading(true);
    try {
      try {
        const codeData = await apiClient.getAffiliateCode();
        setAffiliateCode(codeData.affiliateCode || "");
      } catch (error: any) {
        console.error("Failed to load affiliate code:", error);
      }

      try {
        const refData = await apiClient.getReferralCode();
        setReferralCode(refData.referralCode || "");
      } catch (error: any) {
        console.error("Failed to load referral code:", error);
      }

      try {
        const statsData = await apiClient.getAffiliateStats();
        setStats(statsData);
      } catch (error: any) {
        console.error("Failed to load stats:", error);
      }

      try {
        const commData = await apiClient.getAffiliateCommissions();
        setCommissions(commData || []);
      } catch (error: any) {
        console.error("Failed to load commissions:", error);
        setCommissions([]);
      }
    } catch (error: any) {
      console.error("Failed to load affiliate data:", error);
      if (!affiliateCode && !referralCode && !stats && commissions.length === 0) {
        toast({
          title: "Error",
          description: error.message || "Failed to load affiliate data. Some features may not be available.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const getReferralLink = (code: string) => {
    if (!code) return "";
    return `${window.location.origin}/r/${code}`;
  };

  const handleRequestPayout = async () => {
    setIsRequestingPayout(true);
    try {
      const result: any = await apiClient.requestAffiliatePayout();
      toast({
        title: "Commissions credited",
        description: result?.message || "Your pending commissions have been added to your account balance.",
      });
      await loadAffiliateData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to credit commissions", variant: "destructive" });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const filteredCommissions = commissions.filter((c: any) => {
    if (typeFilter === "all") return true;
    const commType = c.type ?? "order";
    return commType === typeFilter;
  });

  const formatCommissionType = (type: string | undefined): string => {
    switch (type ?? "order") {
      case "order": return "Order";
      case "subscription": return "Subscription";
      case "bounty": return "Bounty";
      case "weekly_goal": return "Weekly Goal";
      default: return type ?? "Order";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="mb-4">
        <p className="text-muted-foreground">
          Earn {stats?.commissionRate ?? 10}% on every eSIM sold by merchants you refer. Commissions are credited to your account balance.
        </p>
      </div>

      {/* Codes */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link to refer new merchants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={getReferralLink(referralCode)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(getReferralLink(referralCode), "Referral link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label className="text-sm">Referral Code</Label>
              <div className="flex gap-2 mt-1">
                <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                  {referralCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(referralCode, "Referral code")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Affiliate Code
            </CardTitle>
            <CardDescription>Your unique affiliate identifier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted p-3 rounded text-lg font-mono text-center">
                {affiliateCode}
              </code>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(affiliateCode, "Affiliate code")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Button */}
      {stats && stats.pendingCommissions > 0 && (() => {
        const pendingAmount = commissions
          .filter((c: any) => c.status === "pending")
          .reduce((sum: number, c: any) => sum + c.amount, 0);
        const minPayout = (stats.minPayoutCents ?? 1000) / 100;
        const belowMin = pendingAmount < minPayout;
        return (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">You have pending commissions</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ${pendingAmount.toFixed(2)} across {stats.pendingCommissions} commission{stats.pendingCommissions !== 1 ? "s" : ""}.
                {" "}Minimum to credit: ${minPayout.toFixed(2)}.
              </p>
            </div>
            <Button
              onClick={handleRequestPayout}
              disabled={isRequestingPayout || belowMin}
              className="shrink-0"
              title={belowMin ? `Need $${minPayout.toFixed(2)} minimum` : undefined}
            >
              {isRequestingPayout ? "Processing..." : "Credit to Balance"}
            </Button>
          </div>
        );
      })()}

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${commissions.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + c.amount, 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingCommissions} commissions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.paidCommissions} commissions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Link Clicks</p>
                <p className="text-2xl font-bold">{stats.clicksAllTime ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.clicks30d ?? 0} in last 30d</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold">{(stats.conversionRate ?? 0).toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">signups / clicks</p>
              </div>
            </CardContent>
          </Card>
          <button
            type="button"
            onClick={() => openReferrals("all")}
            className="text-left"
          >
            <Card className="hover:bg-muted/40 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Referred Merchants
                  </p>
                  <p className="text-2xl font-bold">{stats.referredMerchants}</p>
                  <p className="text-xs text-muted-foreground mt-1">click to view</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button
            type="button"
            onClick={() => openReferrals("active")}
            className="text-left"
          >
            <Card className="hover:bg-muted/40 transition-colors cursor-pointer h-full border-green-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Active Referrals
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeReferredMerchants ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">subscribed &amp; counting</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>
      )}

      <Dialog open={referralsOpen !== null} onOpenChange={(open) => !open && setReferralsOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {referralsOpen === "active" ? "Active Referred Merchants" : "Referred Merchants"}
            </DialogTitle>
            <DialogDescription>
              {referralsOpen === "active"
                ? "Merchants from your referrals who are currently subscribed. Only active referrals count toward bounties, weekly goals, and tier progress."
                : "Everyone who signed up with your referral code. Active = subscribed; only active referrals count toward bounties and goals."}
            </DialogDescription>
          </DialogHeader>
          {referralsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : visibleReferrals.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {referralsOpen === "active"
                ? "No active referrals yet. They become active once they start a paid subscription."
                : "No referrals yet. Share your link to start!"}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto -mx-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Signed up</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleReferrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.name || r.email}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(r.signedUpAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {r.active ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Signed up</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>Track your affiliate commissions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Type filter chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TYPE_FILTER_LABELS.map(({ value, label }) => (
              <Button
                key={value}
                variant={typeFilter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          {filteredCommissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No commissions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start referring merchants to earn commissions!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCommissionType(commission.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {commission.referredMerchant
                        ? `Referred merchant sale${commission.referredMerchant.email ? ` — ${commission.referredMerchant.email}` : ""}`
                        : "Order commission"}
                    </TableCell>
                    <TableCell>
                      ${commission.amount.toFixed(2)} {commission.currency}
                    </TableCell>
                    <TableCell>
                      {commission.commissionRate}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          commission.status === "paid" ? "default" :
                          commission.status === "pending" ? "secondary" : "destructive"
                        }
                      >
                        {commission.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AffiliateDashboard() {
  const { data: gam } = useQuery({
    queryKey: ["affiliate-gamification"],
    queryFn: () => apiClient.getAffiliateGamification(),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Affiliate Program</h1>
        </div>

        <HeroStrip />
        <HandleEditor initialHandle={gam?.handle ?? null} />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="bounties">Bounties &amp; Goals</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="leaderboard">
            <LeaderboardTab />
          </TabsContent>
          <TabsContent value="bounties">
            <BountiesGoalsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
