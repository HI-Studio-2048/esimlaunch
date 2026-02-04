import { motion } from "framer-motion";
import { Briefcase, MapPin } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const positions = [
  {
    title: "Customer Support Specialist",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Marketing Manager",
    location: "San Francisco, CA",
    type: "Full-time",
  },
];

export default function DemoStoreCareers() {
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
            Careers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            Join our team and help connect the world
          </motion.p>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((position, i) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{position.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {position.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {position.type}
                          </span>
                        </div>
                      </div>
                      <Button
                        style={{ background: config.primaryColor }}
                        className="text-white hover:opacity-90"
                        asChild
                      >
                        <a href={`mailto:careers@esimlaunch.io?subject=Application: ${position.title}`}>
                          Apply Now
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Don't See a Role That Fits?</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented people. Send us your resume!
          </p>
          <Button
            style={{ background: config.primaryColor }}
            className="text-white hover:opacity-90"
            asChild
          >
            <a href="mailto:careers@esimlaunch.io">Send Your Resume</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

