import { motion } from "framer-motion";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";

export default function DemoStoreTerms() {
  const { config, storeId } = useDemoStore();
  const { data: storeData } = usePublicStore(storeId);
  const ts = storeData?.templateSettings || {};
  const companyName = ts.legalCompanyName || config.businessName;
  const lastUpdated = ts.legalLastUpdated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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
            Last updated: {lastUpdated}
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
                content: `By purchasing and using the eSIM services provided by ${companyName}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.`,
              },
              {
                title: "2. Service Description",
                content: `${companyName} provides eSIM connectivity services for international travel. Service availability, coverage, and speeds may vary by location and carrier partner. We do not guarantee uninterrupted service in all locations.`,
              },
              {
                title: "3. Purchase and Payment",
                content: "All purchases are processed securely. Prices are displayed in your selected currency. Full payment is required before your eSIM is activated and delivered. We reserve the right to modify pricing at any time.",
              },
              {
                title: "4. Activation and Usage",
                content: "Your eSIM will be delivered via email as a QR code. You are responsible for ensuring your device supports eSIM technology and is carrier-unlocked. Data plans activate upon first connection to a local network at your destination.",
              },
              {
                title: "5. Refund Policy",
                content: "Refunds may be requested within 30 days of purchase, provided the eSIM has not been activated or used. Once an eSIM has been activated or any data has been consumed, no refund will be issued. Please contact our support team to initiate a refund request.",
              },
              {
                title: "6. Limitation of Liability",
                content: `${companyName} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, our services. Our total liability shall not exceed the amount you paid for the affected service.`,
              },
              {
                title: "7. Contact",
                content: `If you have questions about these Terms of Service, please contact our support team through the Contact page on our website.`,
              },
            ].map((section) => (
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
