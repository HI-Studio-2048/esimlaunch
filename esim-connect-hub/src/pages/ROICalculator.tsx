import { motion } from "framer-motion";
import { ROICalculator as ROICalculatorComponent } from "@/components/shared/ROICalculator";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Calculator, TrendingUp, PiggyBank, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: TrendingUp,
    title: "You Set the Price",
    description: "Full control over your markup — charge what the market allows, not what providers dictate",
  },
  {
    icon: PiggyBank,
    title: "Wholesale Access",
    description: "Access competitive wholesale rates via eSIM Access and keep the entire markup as your profit",
  },
  {
    icon: Zap,
    title: "Scale Without Limits",
    description: "Automated fulfillment means your profits grow with every order, no extra overhead",
  },
];

export default function ROICalculatorPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="roi-calculator" className="relative py-20 lg:py-28 overflow-hidden scroll-mt-24">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Calculator className="h-4 w-4" />
              ROI Calculator
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6">
              See Exactly{" "}
              <span className="gradient-text">What You'll Earn</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Enter your wholesale cost and markup to instantly see your profit per sale,
              monthly earnings, and annual revenue potential.
            </p>
            <Button variant="outline" size="lg" className="mt-6" asChild>
              <Link to="/current-prices">
                View Wholesale Price List
                <span className="ml-2">→</span>
              </Link>
            </Button>
          </motion.div>

          {/* Calculator Component */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ROICalculatorComponent />
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            badge="Why eSIMLaunch?"
            title="Your Business, Your Margins"
            description="We give you the tools to price confidently and profit consistently"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold font-display mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Note */}
      <section className="py-16">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> These calculations are based on the wholesale cost and markup you enter.
              Actual results may vary depending on your provider, plan type, and market conditions.
              Platform subscription fees are not included in this estimate.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
