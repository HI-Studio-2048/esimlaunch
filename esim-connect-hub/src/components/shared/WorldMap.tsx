import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Wifi, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CountryData {
  name: string;
  region: string;
  plans: {
    provider: string;
    data: string;
    validity: string;
    price: string;
  }[];
  coverage: "full" | "partial" | "none";
}

const countriesData: Record<string, CountryData> = {
  US: {
    name: "United States",
    region: "North America",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$26" },
      { provider: "eSIM Go", data: "5GB", validity: "14 days", price: "$15" },
      { provider: "Truphone", data: "20GB", validity: "30 days", price: "$45" },
    ],
  },
  CA: {
    name: "Canada",
    region: "North America",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$18" },
      { provider: "GigSky", data: "10GB", validity: "30 days", price: "$35" },
    ],
  },
  MX: {
    name: "Mexico",
    region: "North America",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "3GB", validity: "30 days", price: "$11" },
      { provider: "eSIM Go", data: "5GB", validity: "14 days", price: "$14" },
    ],
  },
  GB: {
    name: "United Kingdom",
    region: "Europe",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$22" },
      { provider: "Truphone", data: "15GB", validity: "30 days", price: "$38" },
      { provider: "eSIM Go", data: "5GB", validity: "7 days", price: "$12" },
    ],
  },
  FR: {
    name: "France",
    region: "Europe",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$20" },
      { provider: "GigSky", data: "5GB", validity: "15 days", price: "$18" },
    ],
  },
  DE: {
    name: "Germany",
    region: "Europe",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$21" },
      { provider: "Truphone", data: "20GB", validity: "30 days", price: "$42" },
    ],
  },
  ES: {
    name: "Spain",
    region: "Europe",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$16" },
      { provider: "eSIM Go", data: "10GB", validity: "30 days", price: "$25" },
    ],
  },
  IT: {
    name: "Italy",
    region: "Europe",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$17" },
      { provider: "GigSky", data: "10GB", validity: "30 days", price: "$32" },
    ],
  },
  JP: {
    name: "Japan",
    region: "Asia",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$28" },
      { provider: "Truphone", data: "5GB", validity: "14 days", price: "$18" },
      { provider: "eSIM Go", data: "3GB", validity: "7 days", price: "$12" },
    ],
  },
  KR: {
    name: "South Korea",
    region: "Asia",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$25" },
      { provider: "GigSky", data: "5GB", validity: "15 days", price: "$16" },
    ],
  },
  CN: {
    name: "China",
    region: "Asia",
    coverage: "partial",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$22" },
      { provider: "Truphone", data: "10GB", validity: "30 days", price: "$38" },
    ],
  },
  TH: {
    name: "Thailand",
    region: "Asia",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$18" },
      { provider: "eSIM Go", data: "5GB", validity: "14 days", price: "$10" },
    ],
  },
  AU: {
    name: "Australia",
    region: "Oceania",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$24" },
      { provider: "Truphone", data: "15GB", validity: "30 days", price: "$38" },
      { provider: "GigSky", data: "5GB", validity: "14 days", price: "$16" },
    ],
  },
  NZ: {
    name: "New Zealand",
    region: "Oceania",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$18" },
      { provider: "eSIM Go", data: "10GB", validity: "30 days", price: "$28" },
    ],
  },
  BR: {
    name: "Brazil",
    region: "South America",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$16" },
      { provider: "GigSky", data: "10GB", validity: "30 days", price: "$28" },
    ],
  },
  AR: {
    name: "Argentina",
    region: "South America",
    coverage: "partial",
    plans: [
      { provider: "Airalo", data: "3GB", validity: "30 days", price: "$12" },
    ],
  },
  ZA: {
    name: "South Africa",
    region: "Africa",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$15" },
      { provider: "Truphone", data: "10GB", validity: "30 days", price: "$28" },
    ],
  },
  EG: {
    name: "Egypt",
    region: "Africa",
    coverage: "partial",
    plans: [
      { provider: "Airalo", data: "3GB", validity: "30 days", price: "$10" },
    ],
  },
  AE: {
    name: "United Arab Emirates",
    region: "Middle East",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$18" },
      { provider: "eSIM Go", data: "10GB", validity: "30 days", price: "$32" },
    ],
  },
  IN: {
    name: "India",
    region: "Asia",
    coverage: "partial",
    plans: [
      { provider: "Airalo", data: "5GB", validity: "30 days", price: "$14" },
    ],
  },
  SG: {
    name: "Singapore",
    region: "Asia",
    coverage: "full",
    plans: [
      { provider: "Airalo", data: "10GB", validity: "30 days", price: "$20" },
      { provider: "Truphone", data: "5GB", validity: "14 days", price: "$14" },
    ],
  },
};

// Helper function to get coverage color based on coverage status
const getCoverageFill = (coverage: "full" | "partial" | "none"): string => {
  switch (coverage) {
    case "full":
      return "hsl(var(--primary) / 0.8)";
    case "partial":
      return "hsl(var(--primary) / 0.4)";
    default:
      return "hsl(var(--muted))";
  }
};

const getCoverageHoverFill = (coverage: "full" | "partial" | "none"): string => {
  switch (coverage) {
    case "full":
      return "hsl(var(--primary))";
    case "partial":
      return "hsl(var(--primary) / 0.6)";
    default:
      return "hsl(var(--muted-foreground) / 0.2)";
  }
};

export function WorldMap() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const svgRef = useRef<HTMLDivElement>(null);

  const selectedData = selectedCountry ? countriesData[selectedCountry] : null;

  // Load SVG content from public folder
  useEffect(() => {
    fetch('/world-map.svg')
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
      })
      .catch((err) => {
        console.error('Failed to load world map SVG:', err);
        // Fallback: create a simple SVG structure
        setSvgContent('<svg viewBox="0 0 1009 652"><g></g></svg>');
      });
  }, []);

  // Apply coverage colors to SVG paths based on country codes
  useEffect(() => {
    if (!svgRef.current || !svgContent) return;

    const svgElement = svgRef.current.querySelector("svg");
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll("path");
    paths.forEach((path) => {
      const countryCode = path.getAttribute("class");
      if (!countryCode) return;

      const country = countriesData[countryCode];
      const coverage = country?.coverage || "none";
      
      // Set base fill color
      path.setAttribute("fill", getCoverageFill(coverage));
      path.setAttribute("stroke", "hsl(var(--border))");
      path.setAttribute("stroke-width", "0.5");
      path.setAttribute("data-coverage", coverage);
      path.setAttribute("data-country-code", countryCode);
      
      // Add cursor pointer for countries with data
      if (country) {
        path.style.cursor = "pointer";
        path.style.transition = "fill 0.2s ease";
      }

      // Add hover effect
      path.addEventListener("mouseenter", () => {
        if (country) {
          path.setAttribute("fill", getCoverageHoverFill(coverage));
          setHoveredCountry(countryCode);
        }
      });

      path.addEventListener("mouseleave", () => {
        path.setAttribute("fill", getCoverageFill(coverage));
        setHoveredCountry(null);
      });

      path.addEventListener("click", () => {
        if (country) {
          setSelectedCountry(countryCode);
        }
      });
    });
  }, [svgContent]);

  return (
    <div className="relative w-full">
      {/* Map Container */}
      <div className="relative bg-card/50 rounded-3xl border border-border/50 p-4 md:p-8 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/80" />
            <span className="text-sm text-muted-foreground">Full Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/40" />
            <span className="text-sm text-muted-foreground">Partial Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm text-muted-foreground">No Coverage</span>
          </div>
        </div>

        {/* SVG Map - Using the provided design with viewBox 0 0 1009 652 */}
        <div className="relative w-full overflow-hidden rounded-lg">
          <div
            ref={svgRef}
            className="world-map-container"
            style={{ 
              maxHeight: '600px',
              backgroundColor: 'hsl(var(--muted) / 0.3)'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          {/* Hover Tooltip */}
          {hoveredCountry && countriesData[hoveredCountry] && !selectedCountry && (
            <div className="absolute pointer-events-none z-20">
              <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-sm font-medium text-foreground">
                  {countriesData[hoveredCountry].name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {countriesData[hoveredCountry].plans.length} plans available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-6 mt-6 relative z-10">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">190+</p>
            <p className="text-sm text-muted-foreground">Countries Covered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">500+</p>
            <p className="text-sm text-muted-foreground">eSIM Plans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">50+</p>
            <p className="text-sm text-muted-foreground">Network Partners</p>
          </div>
        </div>
      </div>

      {/* Country Detail Modal */}
      <AnimatePresence>
        {selectedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSelectedCountry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-5 h-5 text-primary" />
                      <Badge variant={selectedData.coverage === "full" ? "default" : "secondary"}>
                        {selectedData.coverage === "full" ? "Full Coverage" : "Partial Coverage"}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{selectedData.name}</h3>
                    <p className="text-muted-foreground">{selectedData.region}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Plans */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                  Available Plans ({selectedData.plans.length})
                </h4>
                <div className="space-y-3">
                  {selectedData.plans.map((plan, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted/50 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="font-medium">
                          {plan.provider}
                        </Badge>
                        <span className="text-xl font-bold text-primary">{plan.price}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wifi className="w-4 h-4" />
                          <span>{plan.data}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{plan.validity}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border bg-muted/30">
                <Button variant="gradient" className="w-full" size="lg">
                  View All {selectedData.name} Plans
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
