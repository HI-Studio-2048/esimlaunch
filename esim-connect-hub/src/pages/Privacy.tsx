import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function Privacy() {
  return (
    <div className="pt-20">
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            title="Privacy Policy"
            description="Last updated: January 15, 2024"
          />
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card space-y-8">
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Account information (name, email, password)</li>
                  <li>Payment information (processed securely by Stripe)</li>
                  <li>Business information (store name, branding assets)</li>
                  <li>Communication data (support tickets, feedback)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use collected information to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide and maintain the Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to comments and questions</li>
                  <li>Analyze usage patterns to improve the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">3. Data Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share data with service providers who assist in operating our Service (e.g., payment processors, hosting providers), and when required by law.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including encryption at rest and in transit (AES-256), regular security audits, and access controls. While we strive to protect your data, no method of transmission is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">5. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time, subject to legal retention requirements.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">6. Your Rights (GDPR)</h2>
                <p className="text-muted-foreground mb-4">
                  If you're in the EU, you have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">7. Cookies</h2>
                <p className="text-muted-foreground">
                  We use essential cookies to operate the Service and analytics cookies to understand usage. You can manage cookie preferences through your browser settings. See our Cookie Policy for details.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  The Service is not directed to individuals under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete it promptly.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@esimlaunch.com.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
