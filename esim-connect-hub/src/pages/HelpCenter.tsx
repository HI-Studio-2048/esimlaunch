import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Book, CreditCard, Settings, Globe, MessageCircle, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const categories = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of eSIMLaunch",
    articles: [
      "How to create your first store",
      "Setting up your account",
      "Connecting your first provider",
      "Customizing your storefront",
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Manage your subscription and payments",
    articles: [
      "Understanding pricing plans",
      "Payment methods",
      "Billing cycles",
      "Refund policy",
    ],
  },
  {
    icon: Settings,
    title: "Technical",
    description: "API, integrations, and technical guides",
    articles: [
      "API documentation",
      "Webhook setup",
      "Custom integrations",
      "Troubleshooting",
    ],
  },
  {
    icon: Globe,
    title: "Providers & Coverage",
    description: "Learn about eSIM providers and coverage",
    articles: [
      "Available providers",
      "Coverage maps",
      "Adding new providers",
      "Provider management",
    ],
  },
];

const popularArticles = [
  {
    title: "How do I get started with eSIMLaunch?",
    category: "Getting Started",
    views: "12.5k",
  },
  {
    title: "How to set up webhooks",
    category: "Technical",
    views: "8.2k",
  },
  {
    title: "Understanding pricing and margins",
    category: "Billing & Payments",
    views: "6.7k",
  },
  {
    title: "Which providers are available?",
    category: "Providers & Coverage",
    views: "5.9k",
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Support"
            title="How Can We Help?"
            description="Find answers to common questions or get in touch with our support team"
          />
          
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {popularArticles.map((article, i) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{article.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{article.category}</span>
                          <span>•</span>
                          <span>{article.views} views</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            title="Browse by Category"
            description="Find help articles organized by topic"
            align="center"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {categories.map((category, i) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                      <category.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    <ul className="space-y-2">
                      {category.articles.map((article, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {article}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center gradient-border">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our support team is here to help. Get in touch and we'll respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:support@esimlaunch.io">Email Us</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

