import { motion } from "framer-motion";
import { Globe, Users, Award, Heart, Zap, Shield, Code2, Rocket } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { value: 190, suffix: "+", label: "Countries Supported" },
  { value: 500, suffix: "+", label: "Active Stores" },
  { value: 50, suffix: "K+", label: "eSIMs Sold" },
  { value: 99.9, suffix: "%", label: "Uptime" },
];

const values = [
  { icon: Globe, title: "Global Reach", desc: "Empowering businesses worldwide to connect travelers across 190+ countries." },
  { icon: Users, title: "Customer Success", desc: "Your success is our mission. We're here to help you grow your eSIM business." },
  { icon: Award, title: "Excellence", desc: "Powered by eSIM Access to deliver 190+ country coverage with real-time eSIM provisioning." },
  { icon: Heart, title: "Innovation", desc: "Constantly evolving our platform to meet the needs of modern businesses." },
];

const team = [
  { name: "Sarah Chen", role: "CEO & Founder", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80" },
  { name: "Michael Park", role: "CTO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
  { name: "Emily Rodriguez", role: "Head of Operations", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80" },
  { name: "David Kim", role: "Head of Partnerships", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="About Us"
            title="Empowering Global Connectivity"
            description="We're building the future of eSIM distribution, making it easier than ever for businesses to offer connectivity solutions worldwide."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding -mt-8">
        <div className="container-custom">
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in 2020, eSIMLaunch was born from a vision to democratize global connectivity. We recognized that businesses wanted to offer eSIM services but were held back by technical complexity and high barriers to entry.
                </p>
                <p>
                  Our team of engineers, entrepreneurs, and travel enthusiasts came together to build a platform that makes it possible for anyone to launch an eSIM business in minutes, not months.
                </p>
                <p>
                  Today, we power hundreds of businesses worldwide, from travel agencies to tech startups, helping them generate millions in revenue while providing seamless connectivity to travelers everywhere.
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
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
                alt="Team working"
                className="relative rounded-3xl shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            title="Our Values"
            description="The principles that guide everything we do"
            align="center"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center card-hover"
              >
                <div className="w-14 h-14 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center">
                  <value.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Hidden */}
      {/* <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            title="Meet Our Team"
            description="The passionate people behind eSIMLaunch"
            align="center"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-border"
                />
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Why Choose Us Section */}
      <section className="section-padding bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container-custom">
          <SectionHeader
            title="Why Choose eSIMLaunch"
            description="Everything you need to succeed in the eSIM business"
            align="center"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { icon: Zap, title: "Launch in Minutes", desc: "Get your store up and running faster than ever" },
              { icon: Shield, title: "Enterprise Security", desc: "Bank-grade security protecting your business" },
              { icon: Code2, title: "Developer Friendly", desc: "Powerful API and webhooks for integration" },
              { icon: Rocket, title: "Scale Globally", desc: "Grow your business without limits" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 bg-card rounded-2xl p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center gradient-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses already using eSIMLaunch to power their connectivity solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

