import { motion } from "framer-motion";
import {
  Layers, Wifi, Signal, CheckCircle2, DollarSign, TrendingUp,
  Search, BarChart3, Globe, LayoutDashboard, Users, ShoppingCart,
  Shield, Lock, KeyRound, FileCheck, RefreshCcw, GitBranch,
  Check, ArrowUp, Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DelayedItem = ({ delay, children, className = "" }: { delay: number; children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export function ProvidersVisual() {
  const providers = [
    { name: "Airalo", status: "Connected", color: "bg-green-500" },
    { name: "eSIM Go", status: "Connected", color: "bg-green-500" },
    { name: "MobiMatter", status: "Active", color: "bg-green-500" },
    { name: "RedteaGo", status: "Pending", color: "bg-yellow-500" },
  ];
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Providers</span>
      </div>
      {providers.map((p, i) => (
        <DelayedItem key={p.name} delay={i * 0.12}>
          <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground text-xs font-bold">
                {p.name[0]}
              </div>
              <span className="text-sm font-medium">{p.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${p.color}`} />
              <span className="text-xs text-muted-foreground">{p.status}</span>
            </div>
          </div>
        </DelayedItem>
      ))}
      <DelayedItem delay={0.5}>
        <div className="text-center pt-2">
          <Badge variant="secondary" className="text-xs">4 of 12 providers connected</Badge>
        </div>
      </DelayedItem>
    </div>
  );
}

export function PricingVisual() {
  const plans = [
    { region: "Europe", base: "$4.50", retail: "$8.99", margin: "100%" },
    { region: "Asia", base: "$3.20", retail: "$6.99", margin: "118%" },
    { region: "Americas", base: "$5.00", retail: "$9.99", margin: "100%" },
  ];
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing Engine</span>
        </div>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">Auto-optimized</Badge>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium px-3 pb-1">
        <span>Region</span><span>Cost</span><span>Retail</span><span>Margin</span>
      </div>
      {plans.map((p, i) => (
        <DelayedItem key={p.region} delay={i * 0.12}>
          <div className="grid grid-cols-4 gap-2 items-center p-3 bg-background rounded-xl border border-border/50 text-sm">
            <span className="font-medium">{p.region}</span>
            <span className="text-muted-foreground">{p.base}</span>
            <span className="text-primary font-semibold">{p.retail}</span>
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              <TrendingUp className="w-3 h-3" />{p.margin}
            </span>
          </div>
        </DelayedItem>
      ))}
    </div>
  );
}

export function SEOVisual() {
  const keywords = [
    { word: "buy esim europe", rank: "#2", change: "+3" },
    { word: "travel esim usa", rank: "#5", change: "+7" },
    { word: "esim data plan", rank: "#8", change: "+2" },
  ];
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO Performance</span>
        </div>
        <Badge variant="secondary" className="text-xs">Last 30 days</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <DelayedItem delay={0.1}>
          <div className="p-3 bg-background rounded-xl border border-border/50 text-center">
            <div className="text-lg font-bold text-primary">2.4K</div>
            <div className="text-xs text-muted-foreground">Organic Visits</div>
          </div>
        </DelayedItem>
        <DelayedItem delay={0.15}>
          <div className="p-3 bg-background rounded-xl border border-border/50 text-center">
            <div className="text-lg font-bold text-green-600">+42%</div>
            <div className="text-xs text-muted-foreground">Growth</div>
          </div>
        </DelayedItem>
      </div>
      {keywords.map((k, i) => (
        <DelayedItem key={k.word} delay={0.2 + i * 0.1}>
          <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border/50 text-sm">
            <span className="text-muted-foreground truncate flex-1">{k.word}</span>
            <span className="font-semibold mx-3">{k.rank}</span>
            <span className="text-green-600 text-xs flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />{k.change}</span>
          </div>
        </DelayedItem>
      ))}
    </div>
  );
}

export function DashboardVisual() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 mb-2">
        <LayoutDashboard className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dashboard</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Revenue", value: "$12,450", icon: DollarSign },
          { label: "Orders", value: "384", icon: ShoppingCart },
          { label: "Users", value: "1,247", icon: Users },
        ].map((s, i) => (
          <DelayedItem key={s.label} delay={i * 0.1}>
            <div className="p-3 bg-background rounded-xl border border-border/50">
              <s.icon className="w-4 h-4 text-primary mb-1" />
              <div className="text-sm font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </DelayedItem>
        ))}
      </div>
      <DelayedItem delay={0.35}>
        <div className="bg-background rounded-xl border border-border/50 p-3">
          <div className="text-xs text-muted-foreground mb-2">Sales this week</div>
          <div className="flex items-end gap-1 h-16">
            {[35, 55, 40, 70, 50, 80, 65].map((h, i) => (
              <div key={i} className="flex-1 gradient-bg rounded-t-sm opacity-80" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </DelayedItem>
      <DelayedItem delay={0.45}>
        <div className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border/50">
          <Activity className="w-3 h-3 text-green-500" />
          <span className="text-xs text-muted-foreground">3 new orders in the last hour</span>
        </div>
      </DelayedItem>
    </div>
  );
}

export function SecurityVisual() {
  const checks = [
    { label: "SSL/TLS Encryption", status: true },
    { label: "GDPR Compliance", status: true },
    { label: "PCI DSS Level 1", status: true },
    { label: "SOC 2 Type II", status: true },
    { label: "Daily Backups", status: true },
  ];
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security Status</span>
      </div>
      <DelayedItem delay={0.1}>
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-green-700 dark:text-green-400">All Systems Secure</div>
            <div className="text-xs text-muted-foreground">Last scan: 2 minutes ago</div>
          </div>
        </div>
      </DelayedItem>
      {checks.map((c, i) => (
        <DelayedItem key={c.label} delay={0.2 + i * 0.08}>
          <div className="flex items-center gap-3 px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm">{c.label}</span>
          </div>
        </DelayedItem>
      ))}
    </div>
  );
}

export function UpdatesVisual() {
  const updates = [
    { version: "v3.2.1", status: "Live", date: "Today", type: "patch" },
    { version: "v3.2.0", status: "Deployed", date: "Jan 28", type: "minor" },
    { version: "v3.1.0", status: "Deployed", date: "Jan 15", type: "minor" },
  ];
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deploy Pipeline</span>
      </div>
      <DelayedItem delay={0.1}>
        <div className="p-3 bg-background rounded-xl border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current deployment</span>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">Healthy</Badge>
          </div>
          <Progress value={100} className="h-1.5" />
        </div>
      </DelayedItem>
      {updates.map((u, i) => (
        <DelayedItem key={u.version} delay={0.2 + i * 0.1}>
          <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {i === 0 ? <RefreshCcw className="w-4 h-4 text-primary" /> : <Check className="w-4 h-4 text-green-500" />}
              </div>
              <div>
                <span className="text-sm font-medium">{u.version}</span>
                <span className="text-xs text-muted-foreground ml-2">{u.date}</span>
              </div>
            </div>
            <Badge variant={i === 0 ? "default" : "secondary"} className="text-xs">{u.status}</Badge>
          </div>
        </DelayedItem>
      ))}
    </div>
  );
}

export const featureVisualMap: Record<string, React.FC> = {
  providers: ProvidersVisual,
  pricing: PricingVisual,
  seo: SEOVisual,
  dashboard: DashboardVisual,
  security: SecurityVisual,
  updates: UpdatesVisual,
};
