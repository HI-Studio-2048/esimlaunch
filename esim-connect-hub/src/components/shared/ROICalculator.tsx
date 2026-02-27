import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, ShoppingCart, Percent, ArrowRight, Sparkles, Tag, BadgeDollarSign } from "lucide-react";

interface ROICalculatorProps {
  showCTA?: boolean;
}

export function ROICalculator({ showCTA = true }: ROICalculatorProps) {
  const [wholesaleCost, setWholesaleCost] = useState([8]);
  const [markupPercent, setMarkupPercent] = useState([40]);
  const [monthlySales, setMonthlySales] = useState([500]);

  const calculations = useMemo(() => {
    const cost = wholesaleCost[0];
    const markup = markupPercent[0] / 100;
    const sales = monthlySales[0];

    const sellingPrice = cost * (1 + markup);
    const profitPerSale = sellingPrice - cost;
    const monthlyRevenue = sellingPrice * sales;
    const monthlyCost = cost * sales;
    const monthlyProfit = profitPerSale * sales;
    const annualProfit = monthlyProfit * 12;
    const margin = (profitPerSale / sellingPrice) * 100;

    return {
      sellingPrice,
      profitPerSale,
      monthlyRevenue,
      monthlyCost,
      monthlyProfit,
      annualProfit,
      margin,
    };
  }, [wholesaleCost, markupPercent, monthlySales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrencyRounded = (value: number) => {
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
              Your Pricing Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Wholesale Cost */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Wholesale Cost per eSIM
                </label>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(wholesaleCost[0])}
                </span>
              </div>
              <Slider
                value={wholesaleCost}
                onValueChange={setWholesaleCost}
                min={1}
                max={50}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$1.00</span>
                <span>$50.00</span>
              </div>
            </div>

            {/* Markup */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Your Markup
                </label>
                <span className="text-lg font-semibold text-primary">
                  {markupPercent[0]}%
                </span>
              </div>
              <Slider
                value={markupPercent}
                onValueChange={setMarkupPercent}
                min={5}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Monthly Sales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  Monthly Sales Volume
                </label>
                <span className="text-lg font-semibold text-primary">
                  {formatNumber(monthlySales[0])} eSIMs
                </span>
              </div>
              <Slider
                value={monthlySales}
                onValueChange={setMonthlySales}
                min={10}
                max={10000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>10,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Per-sale breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Per eSIM Sold</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Cost</p>
                    <p className="text-base font-bold text-muted-foreground">{formatCurrency(calculations.sellingPrice - calculations.profitPerSale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Selling Price</p>
                    <p className="text-base font-bold">{formatCurrency(calculations.sellingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Profit</p>
                    <p className="text-base font-bold text-green-500">+{formatCurrency(calculations.profitPerSale)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Profit margin</span>
                  <span className="text-xs font-semibold text-primary">{calculations.margin.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Revenue & Cost */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Monthly Overview</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5" /> Revenue
                    </span>
                    <span className="font-semibold">{formatCurrencyRounded(calculations.monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Wholesale Cost
                    </span>
                    <span className="font-semibold text-muted-foreground">−{formatCurrencyRounded(calculations.monthlyCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profit Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="gradient-bg border-0 text-primary-foreground">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BadgeDollarSign className="h-5 w-5 opacity-80" />
                    <p className="text-sm opacity-90">Your Monthly Profit</p>
                  </div>
                  <p className="text-4xl font-bold font-display">
                    {formatCurrencyRounded(calculations.monthlyProfit)}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {calculations.margin.toFixed(1)}% margin
                    </span>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {formatCurrencyRounded(calculations.annualProfit)}/year
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
