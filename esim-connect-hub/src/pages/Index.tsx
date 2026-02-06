import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Zap, Globe, Shield, Code2, Palette, Users, 
  Building2, Plane, UserCircle, Rocket, TrendingUp,
  ArrowRight, CheckCircle2, Star, ChevronRight,
  BarChart3, CreditCard, Settings, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { TrustBadges } from "@/components/shared/TrustBadges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const valueProps = [
  { icon: Zap, title: "Launch in 1 Hour", description: "Get your eSIM store up and running faster than ever" },
  { icon: Code2, title: "No Coding Required", description: "Beautiful storefront ready out of the box" },
  { icon: Globe, title: "190+ Countries", description: "Global coverage with major carriers worldwide" },
  { icon: Settings, title: "Plug & Play Admin", description: "Intuitive dashboard to manage everything" },
  { icon: Palette, title: "White Label", description: "Full brand customization, your logo, your domain" },
  { icon: Shield, title: "Enterprise Security", description: "Bank-grade security protecting your business" },
];

const targetAudience = [
  { icon: Plane, title: "Travel Agencies", description: "Offer eSIMs as add-on services" },
  { icon: Building2, title: "Hotels & Resorts", description: "Enhance guest connectivity" },
  { icon: UserCircle, title: "Influencers", description: "Monetize your audience" },
  { icon: Rocket, title: "Entrepreneurs", description: "Start your telecom business" },
  { icon: Users, title: "Communities", description: "Group deals and referrals" },
];

const howItWorks = [
  { step: "01", title: "Sign Up", description: "Create your account in minutes with just an email" },
  { step: "02", title: "Connect Providers", description: "Choose from our network of global eSIM providers" },
  { step: "03", title: "Start Selling", description: "Launch your store and watch the sales roll in" },
];

const dashboardPreviews = [
  { icon: BarChart3, title: "Sales Analytics", description: "Real-time revenue tracking and insights" },
  { icon: Package, title: "eSIM Catalog", description: "Manage plans across all providers" },
  { icon: Users, title: "User Management", description: "Customer accounts and subscriptions" },
  { icon: CreditCard, title: "Payments", description: "Secure transactions and payouts" },
];

const testimonials = [
  { 
    quote: "We launched our eSIM store in under 2 hours. The dashboard is incredibly intuitive.", 
    author: "Daniel Philip", 
    role: "CEO, Voyo eSIMs",
    rating: 5
  },
  { 
    quote: "The margin controls let us optimize pricing across 50+ destinations. Revenue up 40%.", 
    author: "Marvs", 
    role: "Founder, Cheap eSIMs",
    rating: 5
  },
  { 
    quote: "i dont know man im just here for the shoutout.", 
    author: "lil_ran", 
    role: "some guy",
    rating: 5
  },
];

const faqs = [
  { 
    question: "How quickly can I get started?", 
    answer: "Most users have their store live within 1-2 hours. Our onboarding wizard guides you through setup, provider selection, and branding customization."
  },
  { 
    question: "Do I need technical experience?", 
    answer: "Not at all! eSIMLaunch is designed for non-technical users. Everything from store setup to order management is done through our intuitive dashboard."
  },
  { 
    question: "What providers are available?", 
    answer: "We partner with leading global eSIM providers covering 190+ countries. You can connect to multiple providers simultaneously for the best coverage and pricing."
  },
  { 
    question: "Can I set my own prices?", 
    answer: "Absolutely. Our pricing engine gives you full control over margins, allowing you to set retail prices, run promotions, and maximize profitability."
  },
];

const stats = [
  { value: 190, suffix: "+", label: "Countries" },
  { value: 50, suffix: "K+", label: "eSIMs Sold" },
  { value: 500, suffix: "+", label: "Active Stores" },
  { value: 99.9, suffix: "%", label: "Uptime" },
];

export default function Index() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20" style={{ background: 'var(--gradient-hero)' }}>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30 gradient-bg"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20 bg-accent"
            animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Zap className="w-4 h-4" />
                Launch your eSIM business today
              </motion.div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Build Your
                <span className="gradient-text"> eSIM Empire </span>
                in Minutes
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                The all-in-one platform to create, manage, and scale your eSIM reselling business. No coding required. Global coverage.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/pricing">
                    Create Your Store
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <Link to="/dashboard">View Demo</Link>
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-8 border-t border-border/50">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center lg:text-left"
                  >
                    <div className="font-display text-2xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hero Visual - Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative"
            >
              <div className="relative">
                {/* Main Dashboard Card */}
                <motion.div
                  className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  {/* Browser Header */}
                  <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                      <div className="w-3 h-3 rounded-full bg-green-400/60" />
                    </div>
                    <div className="flex-1 mx-4 h-6 rounded-lg bg-muted" />
                  </div>
                  {/* Dashboard Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-32 bg-muted rounded-lg" />
                      <div className="h-8 w-24 gradient-bg rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-xl">
                          <div className="h-4 w-16 bg-muted rounded mb-2" />
                          <div className="h-6 w-20 bg-primary/20 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="h-32 bg-muted/30 rounded-xl flex items-end p-4 gap-2">
                      {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 65, 90].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 gradient-bg rounded-t-sm opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg p-4 border border-border/50"
                  animate={{ y: [0, -5, 0], rotate: [0, 2, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Revenue</div>
                      <div className="text-lg font-bold gradient-text">+24.5%</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-lg p-4 border border-border/50"
                  animate={{ y: [0, 5, 0], rotate: [0, -2, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Active Countries</div>
                      <div className="text-lg font-bold">42</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <SectionHeader
            badge="Why Choose Us"
            title="Everything you need to launch and scale"
            description="From instant setup to enterprise-grade security, we've built the complete toolkit for eSIM resellers."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {valueProps.map((prop, index) => (
              <FeatureCard
                key={prop.title}
                icon={prop.icon}
                title={prop.title}
                description={prop.description}
                index={index}
                variant="gradient"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            badge="Perfect For"
            title="Built for ambitious businesses"
            description="Whether you're a solo entrepreneur or enterprise, eSIMLaunch scales with your vision."
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-16">
            {targetAudience.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <audience.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{audience.title}</h3>
                <p className="text-sm text-muted-foreground">{audience.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-foreground text-background">
        <div className="container-custom">
          <SectionHeader
            badge="Simple Process"
            title="Go live in 3 easy steps"
            description="No complex setup. No technical hurdles. Just results."
          />

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
                <div className="text-6xl font-display font-bold gradient-text mb-4">{step.step}</div>
                <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                <p className="text-background/70">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            badge="Powerful Dashboard"
            title="Everything at your fingertips"
            description="A beautiful, intuitive admin panel that makes managing your eSIM business a breeze."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {dashboardPreviews.map((preview, index) => (
              <motion.div
                key={preview.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 gradient-bg opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <preview.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{preview.title}</h3>
                <p className="text-muted-foreground text-sm">{preview.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/dashboard">
                Explore Dashboard Demo
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Testimonials */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <SectionHeader
            badge="Testimonials"
            title="Loved by businesses worldwide"
            description="See what our customers have to say about transforming their eSIM business."
          />

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-2xl p-8 shadow-card"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            badge="FAQ"
            title="Frequently asked questions"
            description="Got questions? We've got answers."
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-12"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-2xl px-6 border-none shadow-card"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/faq">
                View All FAQs
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative gradient-bg rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-background/10"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-background/10"
                animate={{ scale: [1.2, 1, 1.2] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </div>
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
                Ready to start your eSIM business?
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Join hundreds of successful resellers. Launch your store today and start earning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="xl"
                  className="bg-background text-foreground hover:bg-background/90"
                  asChild
                >
                  <Link to="/pricing">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/features">Learn More</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
