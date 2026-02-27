import { motion } from "framer-motion";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";

export default function DemoStorePrivacy() {
  const { config, storeId } = useDemoStore();
  const { data: storeData } = usePublicStore(storeId);
  const ts = storeData?.templateSettings || {};
  const companyName = ts.legalCompanyName || config.businessName;
  const contactEmail = ts.contactEmail || `privacy@${config.businessName.toLowerCase().replace(/\s+/g, '')}.com`;
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
            Privacy Policy
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
                title: "1. Information We Collect",
                content: `When you purchase an eSIM from ${companyName}, we collect the information necessary to process and fulfill your order — including your name, email address, and payment details. We also collect usage data to improve our services and your experience.`,
              },
              {
                title: "2. How We Use Your Information",
                content: `We use your personal information to process orders, deliver eSIM QR codes, provide customer support, and send order-related communications. ${companyName} does not sell or rent your personal data to third parties.`,
              },
              {
                title: "3. Data Security",
                content: "We implement industry-standard security measures to protect your data, including TLS encryption for all data in transit and secure storage for data at rest. All payment information is processed through PCI-DSS compliant payment processors.",
              },
              {
                title: "4. Third-Party Services",
                content: "We work with trusted third-party providers for payment processing and eSIM provisioning. These providers are contractually required to handle your data in accordance with applicable privacy laws and our data processing agreements.",
              },
              {
                title: "5. Your Rights",
                content: `You have the right to access, correct, or delete your personal information at any time. To exercise these rights, please contact us at ${contactEmail}.`,
              },
              {
                title: "6. Cookies",
                content: "We use essential cookies to operate our website and optional analytics cookies to understand how visitors use our site. You can manage your cookie preferences at any time. See our Cookie Policy for details.",
              },
              {
                title: "7. Contact Us",
                content: `If you have any questions about this Privacy Policy or how ${companyName} handles your data, please contact us at ${contactEmail}.`,
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
