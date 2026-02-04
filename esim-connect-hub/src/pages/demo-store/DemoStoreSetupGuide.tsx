import { motion } from "framer-motion";
import { Smartphone, Download, Scan, CheckCircle } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Download,
    title: "Purchase Your eSIM",
    description: "Select and purchase an eSIM plan that matches your travel destination.",
  },
  {
    icon: Scan,
    title: "Receive QR Code",
    description: "You'll receive a QR code via email immediately after purchase.",
  },
  {
    icon: Smartphone,
    title: "Scan & Install",
    description: "Open your phone settings, scan the QR code, and follow the prompts.",
  },
  {
    icon: CheckCircle,
    title: "Activate & Connect",
    description: "Once you arrive at your destination, your eSIM will automatically activate.",
  },
];

export default function DemoStoreSetupGuide() {
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
            eSIM Setup Guide
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            Get connected in minutes with our simple step-by-step guide
          </motion.p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div
                    className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4"
                    style={{ background: `${config.primaryColor}15` }}
                  >
                    <step.icon className="h-10 w-10" style={{ color: config.primaryColor }} />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: config.primaryColor }}
                  >
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Instructions */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Detailed Instructions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                title: "For iPhone Users",
                steps: [
                  "Go to Settings > Cellular",
                  "Tap 'Add Cellular Plan'",
                  "Scan the QR code from your email",
                  "Follow the on-screen instructions",
                ],
              },
              {
                title: "For Android Users",
                steps: [
                  "Go to Settings > Connections > SIM card manager",
                  "Tap 'Add mobile plan'",
                  "Scan the QR code from your email",
                  "Follow the on-screen instructions",
                ],
              },
            ].map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-card rounded-2xl p-6"
              >
                <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
                <ol className="space-y-2">
                  {section.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5"
                        style={{ background: config.primaryColor }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is available 24/7 to assist you
          </p>
          <Button
            style={{ background: config.primaryColor }}
            className="text-white hover:opacity-90"
            asChild
          >
            <a href="/demo-store/contact">Contact Support</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

