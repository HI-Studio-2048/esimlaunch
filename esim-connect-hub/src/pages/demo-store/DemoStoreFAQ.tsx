import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I activate my eSIM?",
    answer: "After purchase, you'll receive a QR code via email. Open your phone settings, go to Cellular/Mobile Data, tap Add Cellular Plan, and scan the QR code. Follow the on-screen instructions to complete activation.",
  },
  {
    question: "When should I activate my eSIM?",
    answer: "You can install the eSIM anytime, but it will only activate when you arrive at your destination and connect to a local network. We recommend installing it before you travel.",
  },
  {
    question: "Can I use my regular SIM and eSIM at the same time?",
    answer: "Yes! Most modern phones support dual SIM functionality. You can keep your regular SIM active for calls and use the eSIM for data while traveling.",
  },
  {
    question: "What happens if I don't use all my data?",
    answer: "Unused data from your plan cannot be carried over to the next billing period. However, you can purchase additional data top-ups if needed.",
  },
  {
    question: "How do I know if my phone supports eSIM?",
    answer: "Most iPhone XS and newer, and many recent Android phones support eSIM. Check your phone's specifications or contact our support team for assistance.",
  },
  {
    question: "What if I have connection issues?",
    answer: "First, ensure you've activated the eSIM and selected it for cellular data. Check that you're in a covered area. If problems persist, contact our 24/7 support team for immediate assistance.",
  },
];

export default function DemoStoreFAQ() {
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
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            Find answers to common questions about our eSIM service
          </motion.p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <AccordionItem value={`item-${i}`} className="bg-card rounded-2xl px-6 border-none shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 shrink-0" style={{ color: config.primaryColor }} />
                      <span className="text-left font-semibold">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help 24/7
          </p>
          <a
            href="/demo-store/contact"
            className="inline-block px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: config.primaryColor }}
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}

