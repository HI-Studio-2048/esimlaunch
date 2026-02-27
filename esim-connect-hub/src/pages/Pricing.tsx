import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Rocket, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    name: "Starter",
    icon: Zap,
    description: "Perfect for getting started with your eSIM business",
    monthlyPrice: 29,
    yearlyPrice: 288,
    features: [
      "Up to 100 orders/month",
      "eSIM Access integration",
      "Basic analytics dashboard",
      "Email support",
      "Custom branding",
      "Standard API access",
    ],
    highlighted: false,
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    icon: Rocket,
    description: "For growing businesses ready to scale",
    monthlyPrice: 79,
    yearlyPrice: 786,
    features: [
      "Up to 1,000 orders/month",
      "eSIM Access + advanced pricing",
      "Advanced analytics & reports",
      "Priority email support",
      "White label domain",
      "Margin control engine",
      "SEO tools included",
      "Webhook integrations",
    ],
    highlighted: true,
    cta: "Start Free Trial",
    badge: "Most Popular",
  },
  {
    name: "Scale",
    icon: Building2,
    description: "Enterprise features for high-volume sellers",
    monthlyPrice: 199,
    yearlyPrice: 1982,
    features: [
      "Unlimited orders",
      "Full eSIM Access catalog",
      "Real-time analytics",
      "24/7 priority support",
      "Multiple admin users",
      "Custom API integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom development",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

const comparisonFeatures = [
  { name: "Monthly Orders", starter: "100", growth: "1,000", scale: "Unlimited" },
  { name: "eSIM Catalog Access", starter: "Full", growth: "Full", scale: "Full" },
  { name: "Custom Branding", starter: true, growth: true, scale: true },
  { name: "White Label Domain", starter: false, growth: true, scale: true },
  { name: "Margin Control", starter: false, growth: true, scale: true },
  { name: "SEO Tools", starter: false, growth: true, scale: true },
  { name: "API Access", starter: "Basic", growth: "Full", scale: "Custom" },
  { name: "Analytics", starter: "Basic", growth: "Advanced", scale: "Real-time" },
  { name: "Support", starter: "Email", growth: "Priority", scale: "24/7 + Manager" },
  { name: "Multi-user Access", starter: false, growth: false, scale: true },
  { name: "SLA Guarantee", starter: false, growth: false, scale: true },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  // Calculate actual savings percentage (using first plan as reference)
  const samplePlan = pricingPlans[0];
  const annualCost = samplePlan.monthlyPrice * 12;
  const yearlyCost = samplePlan.yearlyPrice;
  const savingsPercent = Math.round(((annualCost - yearlyCost) / annualCost) * 100);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Pricing"
            title="Simple, transparent pricing"
            description="Choose the plan that fits your business. All plans include a 14-day free trial."
          />

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <span className={cn("text-sm font-medium", !isYearly && "text-foreground", isYearly && "text-muted-foreground")}>
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={cn("text-sm font-medium", isYearly && "text-foreground", !isYearly && "text-muted-foreground")}>
              Yearly
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full gradient-bg text-primary-foreground">
                Save {savingsPercent}%
              </span>
            </span>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative bg-card rounded-3xl p-8 shadow-card transition-all duration-300",
                  plan.highlighted && "ring-2 ring-primary shadow-xl scale-105 z-10"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gradient-bg text-primary-foreground text-sm font-medium">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    plan.highlighted ? "gradient-bg" : "bg-primary/10"
                  )}>
                    <plan.icon className={cn(
                      "w-6 h-6",
                      plan.highlighted ? "text-primary-foreground" : "text-primary"
                    )} />
                  </div>
                  <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                </div>

                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="font-display text-5xl font-bold">
                    ${isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && (
                    <span className="text-sm text-muted-foreground block mt-1">
                      Billed annually (${plan.yearlyPrice}/year)
                    </span>
                  )}
                </div>

                <Button
                  variant={plan.highlighted ? "gradient" : "outline"}
                  className="w-full mb-8"
                  size="lg"
                  asChild
                >
                  <Link to={plan.cta === "Contact Sales" ? "/contact" : "/signup"} className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <SectionHeader
            title="Compare all features"
            description="See exactly what's included in each plan"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 overflow-x-auto"
          >
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">Starter</th>
                  <th className="text-center py-4 px-4 font-semibold">
                    <span className="gradient-text">Growth</span>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold">Scale</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-border/50">
                    <td className="py-4 px-4">{feature.name}</td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.starter === "boolean" ? (
                        feature.starter ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span>{feature.starter}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4 bg-primary/5">
                      {typeof feature.growth === "boolean" ? (
                        feature.growth ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="font-medium">{feature.growth}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.scale === "boolean" ? (
                        feature.scale ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span>{feature.scale}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Have questions?</h2>
          <p className="text-muted-foreground mb-8">
            Check out our FAQ or contact our sales team for personalized help.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/faq">View FAQ</Link>
            </Button>
            <Button variant="gradient" size="lg" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
