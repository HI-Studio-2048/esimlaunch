import { motion } from "framer-motion";
import { Handshake, Globe, TrendingUp } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Globe,
    title: "Global Reach",
    description: "Access to our network of 190+ countries",
  },
  {
    icon: TrendingUp,
    title: "Revenue Share",
    description: "Competitive commission structure",
  },
  {
    icon: Handshake,
    title: "Dedicated Support",
    description: "Personal account manager for partners",
  },
];

export default function DemoStorePartners() {
  const { config } = useDemoStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Partner Program
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            Join our partner program and earn revenue by promoting our eSIM services
          </motion.p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Partner Benefits</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="p-6 text-center">
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: `${config.primaryColor}15` }}
                    >
                      <benefit.icon className="h-7 w-7" style={{ color: config.primaryColor }} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Register as a partner and get your unique referral link",
              },
              {
                step: "2",
                title: "Promote",
                description: "Share your link and promote our eSIM services",
              },
              {
                step: "3",
                title: "Earn",
                description: "Receive commissions on every successful referral",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-start gap-4 bg-card rounded-2xl p-6"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ background: config.primaryColor }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Become a Partner?</h2>
          <p className="text-muted-foreground mb-6">
            Join our partner program and start earning today
          </p>
          <Button
            style={{ background: config.primaryColor }}
            className="text-white hover:opacity-90"
            asChild
          >
            <a href="mailto:partners@esimlaunch.io">Contact Partnership Team</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

