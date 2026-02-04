import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function Terms() {
  return (
    <div className="pt-20">
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            title="Terms of Service"
            description="Last updated: January 15, 2024"
          />
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert"
          >
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card space-y-8">
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using eSIMLaunch ("the Service"), you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to abide by these terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  eSIMLaunch provides a software-as-a-service platform that enables businesses to create and manage eSIM reselling stores. The Service includes dashboard access, provider integrations, customer management tools, and related features.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">3. Account Registration</h2>
                <p className="text-muted-foreground">
                  To use the Service, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">4. Payment Terms</h2>
                <p className="text-muted-foreground">
                  Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as expressly stated in our refund policy. We reserve the right to change pricing with 30 days notice.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">5. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon intellectual property rights</li>
                  <li>Transmit malicious code or interfere with the Service</li>
                  <li>Engage in fraudulent activities</li>
                  <li>Resell access to the Service without authorization</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">6. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  The Service and its original content, features, and functionality are owned by eSIMLaunch and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  In no event shall eSIMLaunch be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">8. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account at any time for violations of these Terms. Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Material changes will be communicated via email or through the Service. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">10. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms, please contact us at legal@esimlaunch.io.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
