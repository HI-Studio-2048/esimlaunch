import { motion } from "framer-motion";
import { useDemoStore } from "@/contexts/DemoStoreContext";

export default function DemoStoreRefundPolicy() {
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
            Refund Policy
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
                title: "1. Refund Eligibility",
                content: "Refunds are available within 30 days of purchase if the eSIM has not been activated. Once activated, eSIMs are non-refundable.",
              },
              {
                title: "2. How to Request a Refund",
                content: "Contact our support team at support@esimlaunch.com with your order number. We'll process your refund within 5-7 business days.",
              },
              {
                title: "3. Refund Processing",
                content: "Refunds will be issued to the original payment method. Processing times vary by payment provider but typically take 5-10 business days.",
              },
              {
                title: "4. Non-Refundable Items",
                content: "Activated eSIMs, used data plans, and promotional items are non-refundable. Partial refunds are not available for partially used plans.",
              },
              {
                title: "5. Technical Issues",
                content: "If you experience technical issues preventing activation, contact support immediately. We'll work to resolve the issue or provide a refund if resolution isn't possible.",
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



