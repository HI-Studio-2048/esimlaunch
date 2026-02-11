import { motion } from "framer-motion";
import { useDemoStore } from "@/contexts/DemoStoreContext";

export default function DemoStoreCookies() {
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
            Cookie Policy
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
                title: "What Are Cookies?",
                content: "Cookies are small text files stored on your device when you visit our website. They help us provide a better experience and understand how you use our services.",
              },
              {
                title: "How We Use Cookies",
                content: "We use cookies for essential functions like maintaining your session, remembering your preferences, and analyzing website traffic to improve our services.",
              },
              {
                title: "Types of Cookies",
                content: "We use essential cookies (required for site functionality), analytics cookies (to understand usage), and preference cookies (to remember your settings).",
              },
              {
                title: "Managing Cookies",
                content: "You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.",
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







