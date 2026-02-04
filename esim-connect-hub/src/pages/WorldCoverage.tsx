import { motion } from "framer-motion";
import { Globe, Search, MapPin } from "lucide-react";
import { WorldMap } from "@/components/shared/WorldMap";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function WorldCoverage() {
  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Global eSIM Coverage
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Explore Our{" "}
              <span className="text-gradient">Worldwide Coverage</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Click on any country to discover available eSIM plans. We cover 190+ countries
              with 500+ plans from leading providers.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <Link to="/coverage">
              <Button variant="outline" size="lg" className="gap-2">
                <Search className="w-4 h-4" />
                Search by Country
              </Button>
            </Link>
            <Button variant="gradient" size="lg" className="gap-2">
              <MapPin className="w-4 h-4" />
              Find Best Plan for Me
            </Button>
          </motion.div>

          {/* World Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <WorldMap />
          </motion.div>
        </div>
      </section>

      {/* Regional Highlights */}
      <section className="py-16 bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            badge="Regional Coverage"
            title="Popular Regions"
            description="Explore eSIM coverage by region with our most popular destinations"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              {
                region: "Europe",
                countries: 40,
                plans: 120,
                popular: ["UK", "France", "Germany", "Spain", "Italy"],
                color: "from-blue-500 to-purple-500",
              },
              {
                region: "Asia Pacific",
                countries: 35,
                plans: 95,
                popular: ["Japan", "South Korea", "Thailand", "Singapore", "Australia"],
                color: "from-orange-500 to-red-500",
              },
              {
                region: "North America",
                countries: 3,
                plans: 45,
                popular: ["United States", "Canada", "Mexico"],
                color: "from-green-500 to-teal-500",
              },
              {
                region: "South America",
                countries: 12,
                plans: 35,
                popular: ["Brazil", "Argentina", "Chile", "Colombia", "Peru"],
                color: "from-yellow-500 to-orange-500",
              },
              {
                region: "Middle East",
                countries: 15,
                plans: 40,
                popular: ["UAE", "Saudi Arabia", "Qatar", "Israel", "Turkey"],
                color: "from-amber-500 to-red-500",
              },
              {
                region: "Africa",
                countries: 25,
                plans: 30,
                popular: ["South Africa", "Egypt", "Morocco", "Kenya", "Nigeria"],
                color: "from-emerald-500 to-green-500",
              },
            ].map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${region.color}`} />
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{region.region}</h3>
                  
                  <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                    <span>{region.countries} Countries</span>
                    <span>•</span>
                    <span>{region.plans}+ Plans</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {region.popular.slice(0, 3).map((country) => (
                      <span
                        key={country}
                        className="px-2 py-1 bg-muted rounded-md text-xs"
                      >
                        {country}
                      </span>
                    ))}
                    {region.popular.length > 3 && (
                      <span className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                        +{region.popular.length - 3} more
                      </span>
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Explore {region.region}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Can't Find Your Destination?
            </h2>
            <p className="text-muted-foreground mb-8">
              Use our detailed coverage checker to search for any country and compare
              all available eSIM plans from our partner providers.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/coverage">
                <Button variant="gradient" size="lg">
                  Open Coverage Checker
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Request New Coverage
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
