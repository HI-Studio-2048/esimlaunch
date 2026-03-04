import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Zap, Rocket, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    name: "Starter",
    icon: Zap,
    description: "Launch fast with essentials for solo founders and small teams.",
    monthlyPrice: 29,
    yearlyPrice: 288,
    features: [
      { text: "24h Support Response Time", included: true },
      { text: "Custom Domain", included: false },
      { text: "Full White-Labeling", included: true },
      { text: "Priority Email & Chat Support", included: false },
      { text: "Mobile App", included: false },
    ],
    highlighted: false,
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    icon: Rocket,
    description: "Scale revenue with multi-provider support and advanced analytics.",
    monthlyPrice: 79,
    yearlyPrice: 786,
    features: [
      { text: "12h Support Response Time", included: true },
      { text: "Custom Domain", included: true },
      { text: "Full White-Labeling", included: true },
      { text: "Priority Email & Chat Support", included: true },
      { text: "Mobile App", included: false },
    ],
    highlighted: true,
    cta: "Start Free Trial",
    badge: "Most Popular",
  },
  {
    name: "Scale",
    icon: Building2,
    description: "Built for high-volume brands and platforms with SLA-level support.",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: [
      { text: "4h Support Response Time", included: true },
      { text: "Custom Domain", included: true },
      { text: "Full White-Labeling", included: true },
      { text: "Priority Email & Chat Support", included: true },
      { text: "Mobile App", included: true },
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

const comparisonFeatures = [
  { name: "Support Response Time", starter: "24h", growth: "12h", scale: "4h" },
  { name: "Custom Domain", starter: false, growth: true, scale: true },
  { name: "Full White-Labeling", starter: true, growth: true, scale: true },
  { name: "Priority Email & Chat Support", starter: false, growth: true, scale: true },
  { name: "Mobile App", starter: false, growth: false, scale: true },
  { name: "Guest Checkout", description: "Enable purchases without creating an account to reduce friction.", starter: true, growth: true, scale: true },
  { name: "Social & SSO Login (OAuth)", description: "Let customers sign in with Google, Apple, Facebook, or LinkedIn.", starter: true, growth: true, scale: true },
  { name: "Discount Codes & Promotions", description: "Create percentage or fixed-amount coupons with single-use, multi-use, or unlimited usage options.", starter: true, growth: true, scale: true },
  { name: "Multilingual Storefront", description: "Translate products and pages to sell in multiple languages.", starter: true, growth: true, scale: true },
  { name: "Customer Wallet", description: "Holds credits earned from referrals and loyalty. Customers can top up and pay for eSIMs directly from their wallet at checkout.", starter: true, growth: true, scale: true },
  { name: "Referral Program", description: "Reward customers with wallet credits for every successful referral—credits are stored in the Customer Wallet and can be spent on future eSIM purchases.", starter: true, growth: true, scale: true },
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
                    <li key={feature.text} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={cn("text-sm", !feature.included && "text-muted-foreground")}>
                        {feature.text}
                      </span>
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
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-medium">{feature.name}</span>
                        {"description" in feature && feature.description && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-md">{feature.description}</p>
                        )}
                      </div>
                    </td>
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
