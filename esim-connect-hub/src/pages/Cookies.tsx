import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function Cookies() {
  return (
    <div className="pt-20">
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            title="Cookie Policy"
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
                <h2 className="font-display text-2xl font-bold mb-4">What Are Cookies</h2>
                <p className="text-muted-foreground">
                  Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">How We Use Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies for the following purposes:
                </p>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-muted/30">
                    <h3 className="font-semibold mb-2">Essential Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Required for the Service to function. These cannot be disabled. They include session cookies for authentication and security.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30">
                    <h3 className="font-semibold mb-2">Functional Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Remember your preferences like language settings and display options to provide a personalized experience.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30">
                    <h3 className="font-semibold mb-2">Analytics Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how visitors interact with the Service. We use this data to improve functionality and user experience.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30">
                    <h3 className="font-semibold mb-2">Marketing Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Used to track visitors across websites for advertising purposes. These are optional and can be declined.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">Third-Party Cookies</h2>
                <p className="text-muted-foreground">
                  We may use third-party services that set their own cookies, including Google Analytics for usage analytics and Stripe for payment processing. These parties have their own privacy policies.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">Managing Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  You can control cookies through:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Our cookie consent banner when you first visit</li>
                  <li>Your browser settings (instructions vary by browser)</li>
                  <li>Privacy settings in your account dashboard</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Note: Disabling essential cookies may prevent certain features from working properly.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">Cookie Retention</h2>
                <p className="text-muted-foreground">
                  Session cookies are deleted when you close your browser. Persistent cookies remain for varying periods, from 30 days to 2 years, depending on their purpose.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">Updates to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Cookie Policy periodically. Changes will be posted on this page with an updated revision date.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  Questions about our cookie practices? Contact us at privacy@esimlaunch.io.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
