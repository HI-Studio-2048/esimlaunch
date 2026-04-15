import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, CheckCircle2, DollarSign, Users, TrendingUp, Link as LinkIcon } from "lucide-react";
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

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [affiliateCode, setAffiliateCode] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    setIsLoading(true);
    try {
      // Load affiliate code
      try {
        const codeData = await apiClient.getAffiliateCode();
        setAffiliateCode(codeData.affiliateCode || '');
      } catch (error: any) {
        console.error('Failed to load affiliate code:', error);
        // Don't show error toast for individual failures
      }

      // Load referral code
      try {
        const refData = await apiClient.getReferralCode();
        setReferralCode(refData.referralCode || '');
      } catch (error: any) {
        console.error('Failed to load referral code:', error);
      }

      // Load stats
      try {
        const statsData = await apiClient.getAffiliateStats();
        setStats(statsData);
      } catch (error: any) {
        console.error('Failed to load stats:', error);
        // Stats are optional, don't show error toast
      }

      // Load commissions
      try {
        const commData = await apiClient.getAffiliateCommissions();
        setCommissions(commData || []);
      } catch (error: any) {
        console.error('Failed to load commissions:', error);
        setCommissions([]);
      }
    } catch (error: any) {
      console.error('Failed to load affiliate data:', error);
      // Only show toast if all requests failed
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
    return `${window.location.origin}/signup?ref=${code}`;
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
          <h1 className="text-3xl font-bold mb-2">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Earn {stats?.commissionRate ?? 10}% on every eSIM sold by merchants you refer. Commissions are credited to your account balance.
          </p>
        </div>

        {/* Codes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Your Referral Link
              </CardTitle>
              <CardDescription>
                Share this link to refer new merchants
              </CardDescription>
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
                  onClick={() => copyToClipboard(getReferralLink(referralCode), 'Referral link')}
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
                    onClick={() => copyToClipboard(referralCode, 'Referral code')}
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
              <CardDescription>
                Your unique affiliate identifier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted p-3 rounded text-lg font-mono text-center">
                  {affiliateCode}
                </code>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(affiliateCode, 'Affiliate code')}
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
            .filter((c: any) => c.status === 'pending')
            .reduce((sum: number, c: any) => sum + c.amount, 0);
          const minPayout = (stats.minPayoutCents ?? 1000) / 100;
          const belowMin = pendingAmount < minPayout;
          return (
            <div className="mb-6">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-300">You have pending commissions</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    ${pendingAmount.toFixed(2)} across {stats.pendingCommissions} commission{stats.pendingCommissions !== 1 ? 's' : ''}.
                    {' '}Minimum to credit: ${minPayout.toFixed(2)}.
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
            </div>
          );
        })()}

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-6">
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
                    ${commissions.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.amount, 0).toFixed(2)}
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
                  <p className="text-sm text-muted-foreground">Referred Merchants</p>
                  <p className="text-2xl font-bold">{stats.referredMerchants}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>
              Track your affiliate commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {commission.referredMerchant
                          ? `Referred merchant sale${commission.referredMerchant.email ? ` — ${commission.referredMerchant.email}` : ''}`
                          : 'Order commission'}
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
                            commission.status === 'paid' ? 'default' :
                            commission.status === 'pending' ? 'secondary' : 'destructive'
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
    </div>
  );
}

