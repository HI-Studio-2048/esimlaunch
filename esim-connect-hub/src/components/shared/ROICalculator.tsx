import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Users, Percent, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface ROICalculatorProps {
  showCTA?: boolean;
}

export function ROICalculator({ showCTA = true }: ROICalculatorProps) {
  const [monthlyVisitors, setMonthlyVisitors] = useState([10000]);
  const [conversionRate, setConversionRate] = useState([3]);
  const [averageOrderValue, setAverageOrderValue] = useState([50]);

  const calculations = useMemo(() => {
    const visitors = monthlyVisitors[0];
    const conversion = conversionRate[0] / 100;
    const aov = averageOrderValue[0];

    // Without eSIMLaunch (assuming 30% lower conversion and 20% lower AOV)
    const withoutConversion = conversion * 0.7;
    const withoutAOV = aov * 0.8;
    const withoutRevenue = visitors * withoutConversion * withoutAOV;

    // With eSIMLaunch
    const withRevenue = visitors * conversion * aov;

    // Difference
    const additionalRevenue = withRevenue - withoutRevenue;
    const percentageIncrease = ((withRevenue - withoutRevenue) / withoutRevenue) * 100;

    return {
      withoutRevenue: Math.round(withoutRevenue),
      withRevenue: Math.round(withRevenue),
      additionalRevenue: Math.round(additionalRevenue),
      percentageIncrease: Math.round(percentageIncrease),
      annualAdditional: Math.round(additionalRevenue * 12),
    };
  }, [monthlyVisitors, conversionRate, averageOrderValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Configure Your Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Monthly Visitors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Monthly Visitors
                </label>
                <span className="text-lg font-semibold text-primary">
                  {formatNumber(monthlyVisitors[0])}
                </span>
              </div>
              <Slider
                value={monthlyVisitors}
                onValueChange={setMonthlyVisitors}
                min={1000}
                max={500000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1K</span>
                <span>500K</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Conversion Rate
                </label>
                <span className="text-lg font-semibold text-primary">
                  {conversionRate[0]}%
                </span>
              </div>
              <Slider
                value={conversionRate}
                onValueChange={setConversionRate}
                min={0.5}
                max={15}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Average Order Value
                </label>
                <span className="text-lg font-semibold text-primary">
                  ${averageOrderValue[0]}
                </span>
              </div>
              <Slider
                value={averageOrderValue}
                onValueChange={setAverageOrderValue}
                min={10}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$10</span>
                <span>$200</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Comparison Cards */}
          <div className="grid gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Without eSIMLaunch</p>
                      <p className="text-2xl font-bold font-display text-muted-foreground">
                        {formatCurrency(calculations.withoutRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary font-medium">With eSIMLaunch</p>
                      <p className="text-2xl font-bold font-display text-primary">
                        {formatCurrency(calculations.withRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Revenue Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="gradient-bg border-0 text-primary-foreground">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <p className="text-sm opacity-90">Additional Monthly Revenue</p>
                  <p className="text-4xl font-bold font-display">
                    +{formatCurrency(calculations.additionalRevenue)}
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      +{calculations.percentageIncrease}% increase
                    </span>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {formatCurrency(calculations.annualAdditional)}/year
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button variant="gradient" size="lg" className="flex-1" asChild>
                <a href="/pricing">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="flex-1" asChild>
                <a href="/demo">
                  Schedule Demo
                </a>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
