import { useState } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Zap, 
  Bug, 
  Bell,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Shield,
  Globe
} from "lucide-react";

type ChangeType = "feature" | "improvement" | "fix" | "security";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: ChangeType;
  changes: string[];
  icon: typeof Sparkles;
}

const changelogData: ChangelogEntry[] = [
  {
    version: "2.4.0",
    date: "January 15, 2025",
    title: "Multi-Currency Support & Advanced Analytics",
    description: "Accept payments in 25+ currencies and track performance with new analytics dashboard.",
    type: "feature",
    icon: Sparkles,
    changes: [
      "Added support for 25+ currencies with real-time conversion",
      "New advanced analytics dashboard with custom date ranges",
      "Export reports in CSV, PDF, and Excel formats",
      "Revenue forecasting with AI-powered predictions",
    ],
  },
  {
    version: "2.3.2",
    date: "January 8, 2025",
    title: "Performance Optimizations",
    description: "Significant speed improvements across the platform.",
    type: "improvement",
    icon: Zap,
    changes: [
      "50% faster dashboard loading times",
      "Optimized API response times",
      "Reduced memory usage in bulk operations",
      "Improved caching for frequently accessed data",
    ],
  },
  {
    version: "2.3.1",
    date: "December 28, 2024",
    title: "Security Patch",
    description: "Critical security updates and vulnerability fixes.",
    type: "security",
    icon: Shield,
    changes: [
      "Patched XSS vulnerability in user inputs",
      "Enhanced API key encryption",
      "Added rate limiting for authentication endpoints",
      "Improved session management security",
    ],
  },
  {
    version: "2.3.0",
    date: "December 15, 2024",
    title: "Global Coverage Expansion",
    description: "Added support for 20 new countries and regions.",
    type: "feature",
    icon: Globe,
    changes: [
      "Added eSIM coverage for 20 new countries",
      "New regional pricing tiers",
      "Local payment methods for APAC region",
      "Multi-language support for 8 new languages",
    ],
  },
  {
    version: "2.2.5",
    date: "December 1, 2024",
    title: "Bug Fixes & Stability",
    description: "Various bug fixes and stability improvements.",
    type: "fix",
    icon: Bug,
    changes: [
      "Fixed checkout flow intermittent errors",
      "Resolved dashboard data sync issues",
      "Fixed email notification delays",
      "Corrected timezone handling in reports",
    ],
  },
  {
    version: "2.2.0",
    date: "November 20, 2024",
    title: "White-Label Enhancements",
    description: "More customization options for your branded experience.",
    type: "feature",
    icon: Rocket,
    changes: [
      "Custom domain email notifications",
      "Branded PDF invoices and receipts",
      "Customizable checkout flow",
      "New theme builder with live preview",
    ],
  },
];

const typeConfig: Record<ChangeType, { label: string; className: string }> = {
  feature: { 
    label: "New Feature", 
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" 
  },
  improvement: { 
    label: "Improvement", 
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
  },
  fix: { 
    label: "Bug Fix", 
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" 
  },
  security: { 
    label: "Security", 
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
  },
};

const filterOptions: { value: ChangeType | "all"; label: string }[] = [
  { value: "all", label: "All Updates" },
  { value: "feature", label: "Features" },
  { value: "improvement", label: "Improvements" },
  { value: "fix", label: "Bug Fixes" },
  { value: "security", label: "Security" },
];

export default function Changelog() {
  const [filter, setFilter] = useState<ChangeType | "all">("all");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filteredChangelog = filter === "all" 
    ? changelogData 
    : changelogData.filter((entry) => entry.type === filter);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium gradient-bg text-primary-foreground mb-6">
              What's New
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Product <span className="gradient-text">Changelog</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Stay up to date with the latest features, improvements, and fixes 
              we're shipping to make eSIMLaunch even better.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="py-8 bg-muted/30">
        <div className="container-custom">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                    <Bell className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Get notified of updates</h3>
                    <p className="text-muted-foreground">
                      Subscribe to receive changelog updates in your inbox.
                    </p>
                  </div>
                </div>
                
                {subscribed ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">You're subscribed!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="md:w-64"
                      required
                    />
                    <Button type="submit" variant="gradient">
                      Subscribe
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8">
        <div className="container-custom">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12">
        <div className="container-custom">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
            
            <div className="space-y-8">
              {filteredChangelog.map((entry, index) => (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-0 md:pl-20"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-6 w-4 h-4 rounded-full gradient-bg border-4 border-background hidden md:block" />
                  
                  <Card className="card-hover">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                          <entry.icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <Badge variant="outline" className="font-mono">
                          v{entry.version}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={typeConfig[entry.type].className}
                        >
                          {typeConfig[entry.type].label}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {entry.date}
                        </span>
                      </div>
                      
                      <h3 className="font-display text-xl md:text-2xl font-bold mb-2">
                        {entry.title}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {entry.description}
                      </p>
                      
                      <div className="space-y-3">
                        {entry.changes.map((change, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{change}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Load Older Updates
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <SectionHeader
              badge="Feature Request"
              title="Have an Idea?"
              description="We're always looking for ways to improve eSIMLaunch. Share your feedback and feature requests with us."
              align="center"
            />
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <a href="mailto:feedback@esimlaunch.io">
                  Submit Feedback <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com/esimlaunch/roadmap" target="_blank" rel="noopener noreferrer">
                  View Public Roadmap
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
