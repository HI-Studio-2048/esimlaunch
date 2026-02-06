import { motion } from "framer-motion";
import { FileText, Download, Mail } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pressReleases = [
  {
    title: "Company Launches Global eSIM Service",
    date: "January 15, 2024",
    excerpt: "We're excited to announce the launch of our global eSIM service, connecting travelers in 190+ countries.",
  },
  {
    title: "Partnership with Major Carriers",
    date: "December 10, 2023",
    excerpt: "New partnerships expand coverage and improve service quality for customers worldwide.",
  },
];

export default function DemoStorePress() {
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
            Press & Media
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            Latest news, press releases, and media resources
          </motion.p>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release, i) => (
              <motion.div
                key={release.title}
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
                        <FileText className="h-6 w-6" style={{ color: config.primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{release.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{release.date}</p>
                        <p className="text-muted-foreground">{release.excerpt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Media Kit</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { name: "Company Logo Pack", icon: Download },
              { name: "Brand Guidelines", icon: FileText },
              { name: "Product Screenshots", icon: Download },
              { name: "Press Contact", icon: Mail },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${config.primaryColor}15` }}
                      >
                        <item.icon className="h-6 w-6" style={{ color: config.primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ borderColor: config.primaryColor, color: config.primaryColor }}
                      >
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Press Inquiries</h2>
          <p className="text-muted-foreground mb-6">
            For media inquiries, please contact our press team
          </p>
          <Button
            style={{ background: config.primaryColor }}
            className="text-white hover:opacity-90"
            asChild
          >
            <a href="mailto:press@esimlaunch.com">Contact Press Team</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

