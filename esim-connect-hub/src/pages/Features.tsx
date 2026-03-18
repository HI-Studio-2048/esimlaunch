import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Layers, Globe, DollarSign, Search, LayoutDashboard, Shield,
  RefreshCcw, Palette, Users, Zap, BarChart3, Lock, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { featureVisualMap } from "@/components/features/FeatureVisuals";
import { cn } from "@/lib/utils";

const mainFeatures = [
  {
    icon: Layers,
    title: "Multi-Provider Integration",
    description: "Connect to multiple eSIM providers simultaneously. Access the best rates and coverage from a single dashboard.",
    image: "providers"
  },
  {
    icon: DollarSign,
    title: "Smart Pricing Engine",
    description: "Full control over your margins. Set custom prices, run promotions, and automate pricing rules by region or plan.",
    image: "pricing"
  },
  {
    icon: Search,
    title: "Built-in SEO Tools",
    description: "Rank higher on search engines with our SEO-optimized storefront. Meta tags, sitemaps, and schema markup included.",
    image: "seo"
  },
  {
    icon: LayoutDashboard,
    title: "Powerful User Dashboard",
    description: "Give your customers a beautiful self-service portal to manage eSIMs, view usage, and access support.",
    image: "dashboard"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption, automated backups, and compliance with global data protection regulations.",
    image: "security"
  },
  {
    icon: RefreshCcw,
    title: "Automatic Updates",
    description: "Always run the latest version. We handle updates, patches, and new features seamlessly in the background.",
    image: "updates"
  },
];

const additionalFeatures = [
  { icon: Globe, title: "190+ Countries", description: "Global coverage with local carriers" },
  { icon: Palette, title: "White Label", description: "Your brand, your domain, your store" },
  { icon: Users, title: "Multi-user Access", description: "Team roles and permissions" },
  { icon: Zap, title: "Instant Activation", description: "eSIMs delivered in seconds" },
  { icon: BarChart3, title: "Real-time Analytics", description: "Track every metric that matters" },
  { icon: Lock, title: "Secure Payments", description: "PCI-compliant payment processing" },
];

const FeatureSection = ({
  feature,
  index,
  reverse = false,
}: {
  feature: typeof mainFeatures[0];
  index: number;
  reverse?: boolean;
}) => {
  const Icon = feature.icon;
  const VisualComponent = featureVisualMap[feature.image];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={cn(
        "grid lg:grid-cols-2 gap-12 items-center",
        reverse && "lg:flex-row-reverse"
      )}
    >
      <div className={cn("space-y-6", reverse && "lg:order-2")}>
        <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
          <Icon className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="font-display text-3xl md:text-4xl font-bold">{feature.title}</h3>
        <p className="text-lg text-muted-foreground">{feature.description}</p>
        <Button variant="outline" size="lg" asChild>
          <Link to="/pricing">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      <div className={cn("relative", reverse && "lg:order-1")}>
        <motion.div
          className="bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="aspect-video bg-muted/30 rounded-2xl relative overflow-hidden">
            {VisualComponent ? <VisualComponent /> : (
              <div className="flex items-center justify-center h-full">
                <Icon className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Floating accent */}
        <motion.div
          className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl gradient-bg opacity-20 blur-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
};

export default function Features() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Features"
            title="Everything you need to succeed"
            description="Powerful tools designed to help you launch, grow, and scale your eSIM business with confidence."
          />
        </div>
      </section>

      {/* Main Features */}
      <section className="section-padding">
        <div className="container-custom space-y-24 lg:space-y-32">
          {mainFeatures.map((feature, index) => (
            <FeatureSection
              key={feature.title}
              feature={feature}
              index={index}
              reverse={index % 2 === 1}
            />
          ))}
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <SectionHeader
            title="And so much more"
            description="Every feature you need, built right in."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {additionalFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-bg rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to explore all features?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Start your 7-day free trial and see how eSIMLaunch can transform your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="bg-background text-foreground hover:bg-background/90" asChild>
                <Link to="/pricing">Start Free Trial</Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/dashboard">View Demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
