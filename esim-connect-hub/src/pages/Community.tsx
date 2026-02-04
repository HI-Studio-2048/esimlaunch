import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, Star, Mail, Twitter, Github, Linkedin, Youtube } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const successStories = [
  {
    name: "TravelConnect",
    quote: "eSIMLaunch helped us launch our eSIM service in just 2 hours. Revenue is up 40%!",
    author: "Sarah Chen, CEO",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
  },
  {
    name: "GlobalSIM",
    quote: "The margin controls let us optimize pricing across 50+ destinations. Game changer!",
    author: "Marcus Rodriguez, Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  },
  {
    name: "StayConnected",
    quote: "White label options meant we could brand everything as our own. Customers love it.",
    author: "Emma Thompson, Head of Digital",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
  },
];

const communityLinks = [
  { icon: MessageSquare, name: "Discord Community", href: "#", members: "2.5k+ members" },
  { icon: Github, name: "GitHub", href: "#", members: "Open source projects" },
  { icon: Twitter, name: "Twitter", href: "#", members: "Follow for updates" },
  { icon: Linkedin, name: "LinkedIn", href: "#", members: "Professional network" },
];

export default function Community() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Community"
            title="Join the eSIMLaunch Community"
            description="Connect with other businesses, share experiences, and learn from each other"
          />
        </div>
      </section>

      {/* Community Links */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {communityLinks.map((link, i) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-4">
                      <link.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{link.name}</h3>
                    <p className="text-sm text-muted-foreground">{link.members}</p>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <a href={link.href}>Join</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            title="Success Stories"
            description="See how businesses are growing with eSIMLaunch"
            align="center"
          />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {successStories.map((story, i) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={story.image}
                        alt={story.author}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">{story.name}</h3>
                        <p className="text-sm text-muted-foreground">{story.author}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">"{story.quote}"</p>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center gradient-border max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Subscribe to our newsletter for product updates, tips, and community highlights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button variant="gradient">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

