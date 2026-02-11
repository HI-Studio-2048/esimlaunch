import { motion } from "framer-motion";
import { useDemoStore } from "@/contexts/DemoStoreContext";

export default function DemoStoreTerms() {
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
            Terms of Service
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg"
          >
            Last updated: January 15, 2024
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 md:p-12 shadow-xl space-y-8"
          >
            {[
              {
                title: "1. Acceptance of Terms",
                content: "By purchasing and using our eSIM services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.",
              },
              {
                title: "2. Service Description",
                content: "We provide eSIM connectivity services for travel. Service availability, coverage, and speeds may vary by location and carrier.",
              },
              {
                title: "3. Purchase and Payment",
                content: "All purchases are final. Prices are displayed in your local currency. Payment is required before eSIM activation.",
              },
              {
                title: "4. Activation and Usage",
                content: "eSIMs activate automatically upon arrival at your destination. You are responsible for ensuring your device is eSIM-compatible.",
              },
              {
                title: "5. Refund Policy",
                content: "Refunds are available within 30 days of purchase if the eSIM has not been activated. See our Refund Policy for details.",
              },
              {
                title: "6. Limitation of Liability",
                content: "We are not liable for any indirect damages resulting from service interruptions or connectivity issues.",
              },
            ].map((section, i) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold mb-3" style={{ color: config.primaryColor }}>
                  {section.title}
                </h2>
                <p className="text-muted-foreground">{section.content}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}







