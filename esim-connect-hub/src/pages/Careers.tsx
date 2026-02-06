import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, Users, Heart, Zap, Globe, DollarSign } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const openPositions = [
  {
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build and scale our eSIM platform using modern technologies.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "San Francisco, CA",
    type: "Full-time",
    description: "Design beautiful and intuitive experiences for our users.",
  },
  {
    title: "Customer Success Manager",
    department: "Support",
    location: "Remote",
    type: "Full-time",
    description: "Help our customers succeed with eSIMLaunch.",
  },
  {
    title: "Sales Development Representative",
    department: "Sales",
    location: "New York, NY",
    type: "Full-time",
    description: "Drive growth by connecting with potential customers.",
  },
];

const benefits = [
  { icon: DollarSign, title: "Competitive Salary", desc: "Top-tier compensation packages" },
  { icon: Heart, title: "Health & Wellness", desc: "Comprehensive health insurance" },
  { icon: Zap, title: "Flexible Hours", desc: "Work when you're most productive" },
  { icon: Globe, title: "Remote First", desc: "Work from anywhere in the world" },
  { icon: Users, title: "Team Events", desc: "Regular team building activities" },
  { icon: Briefcase, title: "Learning Budget", desc: "$2,000/year for professional development" },
];

export default function Careers() {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Join Our Team"
            title="Build the Future of Connectivity"
            description="We're looking for talented individuals who are passionate about technology and want to make a global impact."
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            title="Why Work at eSIMLaunch"
            description="We offer competitive benefits and a culture that values growth and innovation"
            align="center"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            title="Open Positions"
            description="Explore current opportunities to join our team"
            align="center"
          />
          <div className="mt-12 space-y-4">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{position.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {position.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {position.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {position.type}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{position.description}</p>
                      </div>
                      <Button variant="gradient" asChild>
                        <a href={`mailto:careers@esimlaunch.com?subject=Application: ${position.title}`}>
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

      {/* Culture Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Culture</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  At eSIMLaunch, we believe in empowering our team members to do their best work. We foster a culture of innovation, collaboration, and continuous learning.
                </p>
                <p>
                  We're a remote-first company, which means you can work from anywhere while still being part of a tight-knit team. We value diversity, inclusion, and different perspectives.
                </p>
                <p>
                  Whether you're an engineer, designer, or marketer, you'll have the opportunity to make a real impact on how businesses connect with travelers worldwide.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-3xl gradient-bg opacity-10" />
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
                alt="Team collaboration"
                className="relative rounded-3xl shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Don't See a Role That Fits?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button variant="gradient" size="lg" asChild>
              <a href="mailto:careers@esimlaunch.com">Send Your Resume</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

