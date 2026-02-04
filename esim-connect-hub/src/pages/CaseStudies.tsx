import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Globe,
  Building2,
  Plane,
  ShoppingBag,
  Briefcase,
  Quote
} from "lucide-react";
import { Link } from "react-router-dom";

const featuredCaseStudy = {
  company: "TravelMax Agency",
  industry: "Travel & Tourism",
  logo: Plane,
  title: "How TravelMax 10x'd Their eSIM Revenue in 6 Months",
  description: "TravelMax Agency transformed their business by adding eSIM sales to their travel packages, creating a new recurring revenue stream while improving customer satisfaction.",
  metrics: [
    { label: "Revenue Increase", value: "847%" },
    { label: "Customer Satisfaction", value: "98%" },
    { label: "Time to Launch", value: "2 weeks" },
  ],
  quote: "eSIMLaunch allowed us to launch our eSIM offering in just two weeks. The white-label solution fits perfectly with our brand, and our customers love the convenience.",
  author: "Sarah Chen",
  role: "CEO, TravelMax Agency",
};

const caseStudies = [
  {
    company: "GlobalTech Solutions",
    industry: "Technology",
    logo: Building2,
    metric: "500%",
    metricLabel: "ROI in 3 months",
    excerpt: "Enterprise software company added eSIM management to their IoT platform.",
    tags: ["Enterprise", "IoT", "B2B"],
  },
  {
    company: "Nomad Lifestyle Co",
    industry: "E-commerce",
    logo: ShoppingBag,
    metric: "12K+",
    metricLabel: "Monthly customers",
    excerpt: "Digital nomad brand created a seamless travel connectivity solution.",
    tags: ["D2C", "Subscription", "Global"],
  },
  {
    company: "CorporateConnect",
    industry: "Business Services",
    logo: Briefcase,
    metric: "€2.3M",
    metricLabel: "Annual savings",
    excerpt: "HR platform reduced corporate roaming costs with eSIM management.",
    tags: ["Enterprise", "Cost Reduction", "HR Tech"],
  },
  {
    company: "Wanderlust Tours",
    industry: "Travel",
    logo: Plane,
    metric: "4.9★",
    metricLabel: "Customer rating",
    excerpt: "Tour operator differentiated with included connectivity packages.",
    tags: ["Tourism", "Package Deals", "B2C"],
  },
  {
    company: "RemoteFirst Inc",
    industry: "Technology",
    logo: Globe,
    metric: "89%",
    metricLabel: "Adoption rate",
    excerpt: "Remote work platform integrated eSIM for their distributed teams.",
    tags: ["SaaS", "Remote Work", "Integration"],
  },
  {
    company: "TelecomPlus",
    industry: "Telecommunications",
    logo: Users,
    metric: "150K",
    metricLabel: "eSIMs activated",
    excerpt: "MVNO expanded globally without infrastructure investment.",
    tags: ["MVNO", "Telecom", "Expansion"],
  },
];

const industries = [
  { name: "All", count: 24 },
  { name: "Travel & Tourism", count: 8 },
  { name: "Technology", count: 6 },
  { name: "E-commerce", count: 5 },
  { name: "Telecommunications", count: 3 },
  { name: "Enterprise", count: 2 },
];

export default function CaseStudies() {
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
              Success Stories
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              See How Businesses <span className="gradient-text">Thrive</span> with eSIMLaunch
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover how companies across industries are transforming their business 
              with our white-label eSIM platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="py-12 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2">
                  {/* Left: Visual */}
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 flex flex-col justify-between min-h-[400px]">
                    <div>
                      <Badge className="bg-primary-foreground/20 text-primary-foreground mb-4">
                        Featured Story
                      </Badge>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                          <featuredCaseStudy.logo className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-foreground">
                            {featuredCaseStudy.company}
                          </h3>
                          <p className="text-sm text-primary-foreground/70">
                            {featuredCaseStudy.industry}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {featuredCaseStudy.metrics.map((metric) => (
                        <div key={metric.label}>
                          <div className="text-3xl font-bold text-primary-foreground">
                            {metric.value}
                          </div>
                          <div className="text-sm text-primary-foreground/70">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right: Content */}
                  <div className="p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                        {featuredCaseStudy.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {featuredCaseStudy.description}
                      </p>
                      
                      <div className="relative pl-6 border-l-2 border-primary/20 mb-6">
                        <Quote className="absolute -left-3 -top-1 h-6 w-6 text-primary bg-background" />
                        <p className="italic text-muted-foreground">
                          "{featuredCaseStudy.quote}"
                        </p>
                        <div className="mt-4">
                          <p className="font-semibold">{featuredCaseStudy.author}</p>
                          <p className="text-sm text-muted-foreground">{featuredCaseStudy.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="gradient" className="w-fit">
                      Read Full Case Study <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-20">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-24">
                <h3 className="font-semibold mb-4">Filter by Industry</h3>
                <div className="space-y-2">
                  {industries.map((industry) => (
                    <button
                      key={industry.name}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-left transition-colors ${
                        industry.name === "All" 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <span>{industry.name}</span>
                      <span className="text-sm opacity-70">{industry.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
            
            {/* Grid */}
            <div className="flex-1">
              <div className="grid md:grid-cols-2 gap-6">
                {caseStudies.map((study, index) => (
                  <motion.div
                    key={study.company}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full card-hover group cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                              <study.logo className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{study.company}</h3>
                              <p className="text-sm text-muted-foreground">{study.industry}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold gradient-text">{study.metric}</span>
                            <span className="text-sm text-muted-foreground">{study.metricLabel}</span>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{study.excerpt}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {study.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <Button variant="outline" size="lg">
                  Load More Case Studies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            badge="Impact"
            title="Our Customers' Success"
            description="The numbers speak for themselves"
            align="center"
          />
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Businesses Powered" },
              { value: "$12M+", label: "Revenue Generated" },
              { value: "180+", label: "Countries Covered" },
              { value: "4.9/5", label: "Average Rating" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
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
              <TrendingUp className="h-16 w-16 text-primary-foreground/80 mx-auto mb-6" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
                Ready to Write Your Success Story?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join hundreds of businesses that have transformed their revenue 
                with eSIMLaunch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-background text-foreground hover:bg-background/90"
                  asChild
                >
                  <Link to="/demo">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/contact">
                    Talk to Sales
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
