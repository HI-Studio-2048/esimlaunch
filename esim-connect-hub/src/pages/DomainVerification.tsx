import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, ArrowRight, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DomainVerification() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      domain: "yourstore.esimlaunch.com",
      custom: false,
      desc: "Free subdomain included with all plans",
    },
    {
      name: "Growth",
      domain: "yourstore.esimlaunch.com",
      custom: false,
      desc: "Free subdomain included",
    },
    {
      name: "Scale",
      domain: "yourdomain.com",
      custom: true,
      desc: "Custom domain setup handled by our team",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container-custom max-w-3xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Domain setup</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Domain configuration for your store is handled by the eSIMLaunch team. You don't need to touch any DNS settings yourself.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4 mb-8"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-5 ${plan.custom ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{plan.name} Plan</span>
                {plan.custom && (
                  <span className="text-xs px-2 py-0.5 rounded-full gradient-bg text-primary-foreground font-medium">Custom</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted rounded-lg px-3 py-2 mb-3 break-all">
                {plan.domain}
              </p>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                {plan.desc}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <CardTitle>Want a custom domain?</CardTitle>
              </div>
              <CardDescription>
                On the Scale plan, your store can be served from your own domain (e.g. <span className="font-mono text-foreground">esim.yourbrand.com</span>). Our team handles all DNS configuration, SSL certificates, and deployment — you just point your domain to us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Upgrade to Scale", desc: "Upgrade your plan to unlock custom domain support" },
                  { step: "2", title: "Contact our team", desc: "Send us your domain name and we handle everything" },
                  { step: "3", title: "Go live", desc: "Your store is served from your custom domain with SSL" },
                ].map((item) => (
                  <div key={item.step} className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="w-7 h-7 rounded-full gradient-bg text-primary-foreground text-xs font-bold flex items-center justify-center mb-2">
                      {item.step}
                    </div>
                    <p className="font-medium text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="gap-2"
                  onClick={() => window.open("mailto:support@esimlaunch.com?subject=Custom Domain Setup", "_blank")}
                >
                  <Mail className="w-4 h-4" />
                  Email Us About Custom Domain
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate("/settings/billing")}
                >
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/settings")}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
}
