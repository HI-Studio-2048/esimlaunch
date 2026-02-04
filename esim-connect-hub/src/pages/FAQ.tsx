import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const categories = [
  { id: "getting-started", name: "Getting Started" },
  { id: "billing", name: "Billing" },
  { id: "providers", name: "Providers" },
  { id: "technical", name: "Technical" },
];

const faqs = {
  "getting-started": [
    {
      question: "How do I create my eSIM store?",
      answer: "Creating your store is simple! Sign up for an account, complete our quick onboarding wizard, connect your preferred eSIM providers, customize your branding, and you're ready to start selling. Most users are live within 1-2 hours."
    },
    {
      question: "Do I need any technical experience?",
      answer: "Absolutely not! eSIMLaunch is designed for non-technical users. Everything from store setup to order management is handled through our intuitive dashboard. No coding required whatsoever."
    },
    {
      question: "Can I use my own domain name?",
      answer: "Yes! With our Growth and Scale plans, you can connect your own custom domain. We provide easy DNS configuration instructions and handle SSL certificates automatically."
    },
    {
      question: "How long does the free trial last?",
      answer: "We offer a 14-day free trial on all paid plans. During this time, you have full access to all features with no restrictions. No credit card is required to start your trial."
    },
    {
      question: "What happens after the trial ends?",
      answer: "After your trial ends, you can choose to subscribe to any of our plans. Your data and settings will be preserved. If you decide not to subscribe, your account will be downgraded to a limited free tier."
    },
  ],
  "billing": [
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe."
    },
    {
      question: "Can I change my plan at any time?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the credit will be applied to your next billing cycle."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee on all plans. If you're not satisfied for any reason, contact our support team within 30 days of purchase for a full refund."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period. We don't believe in making cancellation difficult."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No hidden fees whatsoever. The price you see is the price you pay. Transaction fees from payment providers (Stripe, PayPal) are passed through at cost with no markup."
    },
  ],
  "providers": [
    {
      question: "Which eSIM providers are available?",
      answer: "We partner with multiple leading global eSIM providers including Airalo, eSIM Go, GigSky, and more. Combined, they offer coverage in 190+ countries with competitive rates."
    },
    {
      question: "Can I connect multiple providers?",
      answer: "Yes! Depending on your plan, you can connect multiple providers simultaneously. This gives you access to the best rates and coverage for different regions."
    },
    {
      question: "How do I add a new provider?",
      answer: "Adding a provider is easy. Go to Settings > Providers in your dashboard, select the provider you want to add, enter your API credentials, and you're connected within minutes."
    },
    {
      question: "Can I set different margins for different providers?",
      answer: "Absolutely! Our pricing engine allows you to set custom margins by provider, region, or even specific plans. You have full control over your retail pricing."
    },
    {
      question: "What if a provider has an outage?",
      answer: "Our system automatically monitors provider availability. If one provider experiences issues, orders can be automatically routed to backup providers to ensure your customers are never left without service."
    },
  ],
  "technical": [
    {
      question: "Do you have an API?",
      answer: "Yes! We offer a comprehensive REST API for all plans. The Starter plan includes basic API access, while Growth and Scale plans include full API access with webhooks and advanced features."
    },
    {
      question: "How is my data protected?",
      answer: "We take security seriously. All data is encrypted at rest and in transit using AES-256 encryption. We're compliant with GDPR, and all payments are PCI-DSS compliant through Stripe."
    },
    {
      question: "Do you offer webhooks?",
      answer: "Yes! Webhooks are available on Growth and Scale plans. You can receive real-time notifications for events like new orders, successful activations, and more."
    },
    {
      question: "What's your uptime guarantee?",
      answer: "We maintain 99.9% uptime across all our services. Scale plan customers receive an SLA guarantee with service credits if we fail to meet our uptime commitment."
    },
    {
      question: "Can I export my data?",
      answer: "Yes! You can export all your data (customers, orders, analytics) at any time in CSV or JSON format. Your data belongs to you, and we make it easy to take it with you."
    },
  ],
};

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = searchQuery
    ? Object.values(faqs).flat().filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs[activeCategory as keyof typeof faqs];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="FAQ"
            title="Frequently Asked Questions"
            description="Find answers to common questions about eSIMLaunch. Can't find what you're looking for? Contact our support team."
          />

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto mt-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-card"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Category Navigation */}
            {!searchQuery && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-28 space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        activeCategory === category.id
                          ? "gradient-bg text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FAQ Accordion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(searchQuery ? "lg:col-span-4" : "lg:col-span-3")}
            >
              {searchQuery && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
              )}

              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card rounded-2xl px-6 border-none shadow-card"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No results found for your search.</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-8">
              Our support team is here to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <Button variant="gradient" size="lg">
              Contact Support
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
