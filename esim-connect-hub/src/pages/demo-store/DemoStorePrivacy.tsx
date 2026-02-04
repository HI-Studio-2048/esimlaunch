import { motion } from "framer-motion";
import { useDemoStore } from "@/contexts/DemoStoreContext";

export default function DemoStorePrivacy() {
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
            Privacy Policy
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
                title: "1. Information We Collect",
                content: "We collect information you provide when purchasing eSIMs, including name, email, and payment details. We also collect usage data to improve our services.",
              },
              {
                title: "2. How We Use Your Information",
                content: "We use your information to process orders, provide customer support, send service updates, and improve our platform. We do not sell your personal data.",
              },
              {
                title: "3. Data Security",
                content: "We implement industry-standard security measures to protect your data. All payment information is processed securely through encrypted channels.",
              },
              {
                title: "4. Third-Party Services",
                content: "We work with trusted partners for payment processing and eSIM provisioning. These partners are bound by strict privacy agreements.",
              },
              {
                title: "5. Your Rights",
                content: "You have the right to access, update, or delete your personal information. Contact us at privacy@esimlaunch.io to exercise these rights.",
              },
              {
                title: "6. Cookies",
                content: "We use cookies to enhance your experience. See our Cookie Policy for more information about how we use cookies.",
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



