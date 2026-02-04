import { motion } from "framer-motion";
import { Search, Book, MessageCircle } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const articles = [
  { title: "How to activate your eSIM", category: "Setup" },
  { title: "Troubleshooting connection issues", category: "Technical" },
  { title: "Understanding data plans", category: "Plans" },
  { title: "Managing your account", category: "Account" },
];

export default function DemoStoreHelpCenter() {
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
            Help Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto mb-8"
          >
            Find answers to common questions and get support
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help..."
                className="pl-12 h-12"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {articles.map((article, i) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${config.primaryColor}15` }}
                      >
                        <Book className="h-6 w-6" style={{ color: config.primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{article.title}</h3>
                        <p className="text-sm text-muted-foreground">{article.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl p-12 text-center max-w-2xl mx-auto">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: config.primaryColor }}
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you 24/7
            </p>
            <Button
              style={{ background: config.primaryColor }}
              className="text-white hover:opacity-90"
              asChild
            >
              <a href="/demo-store/contact">Contact Support</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

