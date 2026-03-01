import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const faqItems = [
  { q: "How do I install my eSIM?", a: "After purchase, you'll receive a QR code via email. Simply scan it with your phone's camera in the eSIM settings." },
  { q: "Is my phone compatible?", a: "Most modern phones support eSIM, including iPhone XS and newer, Samsung Galaxy S20 and newer, and Google Pixel 3 and newer." },
  { q: "When does my data plan start?", a: "Your data plan activates when you first connect to a network at your destination, not when you install the eSIM." },
  { q: "Can I get a refund?", a: "Yes, unused eSIMs can be refunded within 30 days of purchase. Please contact our support team." },
];

export default function DemoStoreContact() {
  const { config, storeId } = useDemoStore();
  const { data: storeData } = usePublicStore(storeId);
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const ts = storeData?.templateSettings || {};
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: ts.contactEmail || `support@${config.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
      href: `mailto:${ts.contactEmail || ''}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: ts.contactPhone || null,
      href: ts.contactPhone ? `tel:${ts.contactPhone.replace(/\s/g, '')}` : null,
    },
    {
      icon: MapPin,
      label: "Address",
      value: ts.contactAddress || null,
      href: null,
    },
    {
      icon: Clock,
      label: "Hours",
      value: ts.contactHours || "24/7 Support Available",
      href: null,
    },
  ].filter(item => item.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const name = (form.querySelector('#name') as HTMLInputElement)?.value;
    const email = (form.querySelector('#email') as HTMLInputElement)?.value;
    const message = (form.querySelector('#message') as HTMLTextAreaElement)?.value;
    const subjectSelect = form.querySelector('[data-value]') as HTMLElement;
    const subject = subjectSelect?.getAttribute('data-value') || 'General Inquiry';

    if (!name || !email || !message) return;

    setIsSubmitting(true);
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        'http://localhost:3000';
      const body: any = {
        customerEmail: email,
        customerName: name,
        subject: subject,
        description: message,
        category: 'general',
      };
      if (storeId) body.storeId = storeId;

      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSubmitted(true);
        toast({ title: "Message sent", description: "We'll get back to you soon." });
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Could not send message",
          description: errData.errorMessage || "Please try again or email us directly.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not send message",
        description: "Network error. Please try again or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            Have questions? We're here to help. Reach out to us anytime.
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

                {submitted ? (
                  <div className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: `${config.accentColor}20` }}
                    >
                      <Send className="h-8 w-8" style={{ color: config.accentColor }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <Button
                      className="mt-6"
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        rows={5}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full text-white"
                      style={{ background: config.primaryColor }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Contact Details */}
              <div className="bg-muted/50 rounded-2xl p-8">
                <h3 className="text-xl font-semibold mb-6">Get in Touch</h3>
                <div className="space-y-6">
                  {contactInfo.map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${config.primaryColor}15` }}
                      >
                        <item.icon className="h-6 w-6" style={{ color: config.primaryColor }} />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                        {item.href ? (
                          <a href={item.href} className="font-medium hover:underline">
                            {item.value}
                          </a>
                        ) : (
                          <div className="font-medium">{item.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-6 text-white"
                  style={{ background: config.primaryColor }}
                >
                  <MessageSquare className="h-8 w-8 mb-3" />
                  <h4 className="font-semibold mb-1">Live Chat</h4>
                  <p className="text-sm text-white/80">Chat with our support team</p>
                </div>
                <div className="bg-muted/50 rounded-2xl p-6">
                  <HelpCircle className="h-8 w-8 mb-3" style={{ color: config.primaryColor }} />
                  <h4 className="font-semibold mb-1">Help Center</h4>
                  <p className="text-sm text-muted-foreground">Browse our FAQ & guides</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
