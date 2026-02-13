import { motion } from "framer-motion";
import { Globe, Users, Award, Heart, Zap, Shield, Clock, MapPin } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";

const stats = [
  { value: "190+", label: "Countries Covered" },
  { value: "2M+", label: "Happy Customers" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "24/7", label: "Customer Support" },
];

const values = [
  { icon: Globe, title: "Global Connectivity", desc: "We believe everyone deserves seamless connectivity, no matter where they travel." },
  { icon: Users, title: "Customer First", desc: "Your satisfaction is our top priority. We're here to help you stay connected." },
  { icon: Award, title: "Quality Service", desc: "We partner with the best carriers worldwide to deliver exceptional service." },
  { icon: Heart, title: "Passion for Travel", desc: "We're travelers too. We understand the joy of exploring new places." },
];

const team = [
  { name: "Sarah Chen", role: "CEO & Founder", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80" },
  { name: "Michael Park", role: "CTO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
  { name: "Emily Rodriguez", role: "Head of Operations", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80" },
  { name: "David Kim", role: "Head of Partnerships", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" },
];

export default function DemoStoreAbout() {
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
            About {config.businessName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg max-w-2xl mx-auto"
          >
            We're on a mission to keep the world connected. Our eSIM technology makes it easy to stay online wherever your adventures take you.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 -mt-8">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-xl p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: config.primaryColor }}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in 2020, {config.businessName} was born from a simple frustration: why is it so hard to stay connected when traveling abroad?
                </p>
                <p>
                  Our founders, seasoned travelers themselves, experienced the pain of expensive roaming charges, unreliable local SIMs, and the hassle of swapping physical cards. They knew there had to be a better way.
                </p>
                <p>
                  Today, we've helped millions of travelers stay connected across 190+ countries. Our eSIM technology provides instant, affordable connectivity without the hassle of physical SIM cards.
                </p>
              </div>
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl"
                style={{ background: `linear-gradient(135deg, ${config.primaryColor}20, ${config.secondaryColor}20)` }}
              />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
                alt="Team working"
                className="relative rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${config.primaryColor}15` }}
                >
                  <value.icon className="h-7 w-7" style={{ color: config.primaryColor }} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team - Hidden */}
      {/* <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Meet Our Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features */}
      <section
        className="py-16"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}10, ${config.secondaryColor}10)` }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Choose Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Instant Setup", desc: "Get connected in minutes" },
              { icon: Shield, title: "Secure & Reliable", desc: "Your data is always protected" },
              { icon: Clock, title: "24/7 Support", desc: "We're always here to help" },
              { icon: MapPin, title: "Global Coverage", desc: "Works in 190+ countries" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: config.primaryColor }}
                >
                  <feature.icon className="h-6 w-6 text-white" />
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
    </div>
  );
}
