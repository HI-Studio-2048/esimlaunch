import { motion } from "framer-motion";
import { ROICalculator as ROICalculatorComponent } from "@/components/shared/ROICalculator";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Calculator, TrendingUp, PiggyBank, Zap } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Higher Conversions",
    description: "eSIMLaunch's optimized checkout flow increases conversion rates by up to 30%",
  },
  {
    icon: PiggyBank,
    title: "Better Margins",
    description: "Access wholesale pricing from multiple providers to maximize your profits",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Automated eSIM delivery means happy customers and fewer support tickets",
  },
];

export default function ROICalculatorPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
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
              Calculate Your{" "}
              <span className="gradient-text">Revenue Potential</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              See how much additional revenue you could generate by switching to eSIMLaunch.
              Adjust the sliders to match your business metrics.
            </p>
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
            title="How We Boost Your Revenue"
            description="Our platform is designed to maximize every aspect of your eSIM business"
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
              <strong>Methodology:</strong> Our calculations assume a 30% improvement in conversion rate
              and 20% increase in average order value based on data from existing eSIMLaunch customers.
              Actual results may vary based on your specific business model, traffic quality, and market conditions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
