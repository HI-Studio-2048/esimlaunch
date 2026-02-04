import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Globe, 
  CreditCard, 
  BarChart3, 
  Users, 
  Zap, 
  Shield,
  ArrowRight,
  Handshake
} from "lucide-react";
import { Link } from "react-router-dom";

const esimProviders = [
  { name: "Airalo", description: "Global eSIM marketplace" },
  { name: "eSIM Go", description: "Enterprise eSIM solutions" },
  { name: "GigSky", description: "Travel connectivity" },
  { name: "Truphone", description: "IoT & consumer eSIMs" },
  { name: "Ubigi", description: "Worldwide data plans" },
  { name: "Holafly", description: "Tourist eSIM specialist" },
  { name: "Nomad", description: "Digital nomad plans" },
  { name: "Flexiroam", description: "Flexible data bundles" },
];

const integrationCategories = [
  {
    icon: CreditCard,
    title: "Payment Gateways",
    description: "Accept payments globally with seamless integrations",
    partners: ["Stripe", "PayPal", "Square", "Adyen"],
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Track performance with powerful analytics tools",
    partners: ["Google Analytics", "Mixpanel", "Amplitude", "Segment"],
  },
  {
    icon: Users,
    title: "CRM & Support",
    description: "Manage customers and provide excellent support",
    partners: ["Salesforce", "HubSpot", "Zendesk", "Intercom"],
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate workflows and boost productivity",
    partners: ["Zapier", "Make", "n8n", "Pipedream"],
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Keep your business secure and compliant",
    partners: ["Auth0", "Okta", "1Password", "Vanta"],
  },
  {
    icon: Globe,
    title: "Communication",
    description: "Stay connected with your customers",
    partners: ["Twilio", "SendGrid", "Mailchimp", "Postmark"],
  },
];

const benefits = [
  {
    title: "Revenue Share",
    description: "Earn competitive commissions on every referral",
  },
  {
    title: "Co-Marketing",
    description: "Joint marketing campaigns and case studies",
  },
  {
    title: "Technical Support",
    description: "Dedicated integration and API support",
  },
  {
    title: "Priority Access",
    description: "Early access to new features and beta programs",
  },
];

export default function Partners() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium gradient-bg text-primary-foreground mb-6">
              Ecosystem
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Powered by{" "}
              <span className="gradient-text">Leading Providers</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We partner with the best eSIM providers and technology platforms 
              to deliver a seamless experience for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/contact">
                  Become a Partner <Handshake className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/demo">
                  Schedule a Call <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* eSIM Providers Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            badge="eSIM Providers"
            title="Global Connectivity Partners"
            description="Access the world's top eSIM providers through a single integration"
            align="center"
          />
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {esimProviders.map((provider, index) => (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full card-hover text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-20">
        <div className="container-custom">
          <SectionHeader
            badge="Integrations"
            title="Connect Your Favorite Tools"
            description="Seamlessly integrate with the platforms you already use"
            align="center"
          />
          
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrationCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                      <category.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{category.title}</h3>
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.partners.map((partner) => (
                        <span
                          key={partner}
                          className="px-3 py-1 bg-muted rounded-full text-sm font-medium"
                        >
                          {partner}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium gradient-bg text-primary-foreground mb-4">
                Partner Program
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Grow Together with Our Partner Program
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join our ecosystem of technology partners and unlock new revenue 
                streams while helping businesses succeed with eSIM technology.
              </p>
              <Button variant="gradient" size="lg" asChild>
                <Link to="/contact">
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 gradient-bg opacity-90" />
            <div className="relative p-12 md:p-20 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
                Ready to Partner with Us?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join our growing network of partners and help shape the future of 
                global connectivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-background text-foreground hover:bg-background/90"
                  asChild
                >
                  <Link to="/contact">
                    Get in Touch <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/features">
                    View Platform Features
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
