import { motion } from "framer-motion";
import { Shield, Lock, Award, CheckCircle, CreditCard, Globe } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

const certifications = [
  { icon: Shield, label: "PCI-DSS Compliant", description: "Payment card security" },
  { icon: Lock, label: "GDPR Ready", description: "Data protection" },
  { icon: Award, label: "SOC 2 Type II", description: "Security certified" },
  { icon: CheckCircle, label: "ISO 27001", description: "Information security" },
];

const partners = [
  { name: "Stripe", logo: "💳" },
  { name: "Airalo", logo: "📶" },
  { name: "eSIM Go", logo: "🌐" },
  { name: "Truphone", logo: "📱" },
  { name: "GigSky", logo: "✈️" },
];

const pressLogos = [
  "TechCrunch",
  "Forbes",
  "Wired",
  "The Verge",
];

export function TrustBadges() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Trusted & Secure
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Enterprise-Grade Security & Trust
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of businesses who trust eSIMLaunch with their eSIM operations
          </p>
        </motion.div>

        {/* Trust Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16"
        >
          <div className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
              <AnimatedCounter value={2500} suffix="+" />
            </div>
            <p className="text-muted-foreground mt-1">Businesses Trust Us</p>
          </div>
          <div className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
              <AnimatedCounter value={99.9} suffix="%" decimals={1} />
            </div>
            <p className="text-muted-foreground mt-1">Uptime SLA</p>
          </div>
          <div className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
              <AnimatedCounter value={10} suffix="M+" />
            </div>
            <p className="text-muted-foreground mt-1">eSIMs Processed</p>
          </div>
        </motion.div>

        {/* Security Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <cert.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{cert.label}</h3>
              <p className="text-xs text-muted-foreground">{cert.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-center text-sm text-muted-foreground mb-6">Integrated with leading providers</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 px-6 py-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <span className="text-2xl">{partner.logo}</span>
                <span className="font-medium text-sm">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Press Mentions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-center text-sm text-muted-foreground mb-6">As seen in</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {pressLogos.map((press, index) => (
              <motion.span
                key={press}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-xl md:text-2xl font-display font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {press}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
