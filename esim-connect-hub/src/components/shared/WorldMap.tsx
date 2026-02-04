import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Wifi, Clock, DollarSign } from "lucide-react";
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

// Simplified world map SVG paths for major regions/countries
const mapPaths: Record<string, { d: string; transform?: string }> = {
  US: { d: "M 55 95 L 130 95 L 135 120 L 120 140 L 50 140 L 40 120 Z" },
  CA: { d: "M 50 40 L 140 40 L 145 80 L 130 95 L 55 95 L 40 80 Z" },
  MX: { d: "M 50 140 L 90 140 L 95 180 L 70 190 L 45 170 Z" },
  BR: { d: "M 115 200 L 160 180 L 180 220 L 160 280 L 110 270 L 100 230 Z" },
  AR: { d: "M 100 280 L 130 280 L 135 350 L 110 370 L 90 340 Z" },
  GB: { d: "M 210 75 L 220 70 L 225 85 L 215 90 Z" },
  FR: { d: "M 210 95 L 235 90 L 240 115 L 220 125 L 205 110 Z" },
  DE: { d: "M 235 80 L 260 75 L 265 100 L 245 105 L 230 95 Z" },
  ES: { d: "M 195 115 L 220 110 L 225 140 L 200 145 L 190 130 Z" },
  IT: { d: "M 245 105 L 260 100 L 270 145 L 255 155 L 240 130 Z" },
  ZA: { d: "M 265 290 L 295 275 L 310 310 L 285 335 L 260 315 Z" },
  EG: { d: "M 280 160 L 310 150 L 320 185 L 295 195 L 275 180 Z" },
  AE: { d: "M 330 170 L 355 165 L 360 185 L 340 190 L 325 180 Z" },
  IN: { d: "M 350 150 L 395 130 L 410 195 L 380 230 L 345 200 Z" },
  CN: { d: "M 395 80 L 480 60 L 500 140 L 450 170 L 390 150 Z" },
  JP: { d: "M 500 100 L 520 90 L 530 130 L 515 145 L 495 130 Z" },
  KR: { d: "M 485 115 L 500 110 L 505 135 L 490 140 Z" },
  TH: { d: "M 420 175 L 440 170 L 450 210 L 430 225 L 415 200 Z" },
  SG: { d: "M 430 235 L 445 230 L 450 245 L 435 250 Z" },
  AU: { d: "M 440 280 L 520 260 L 540 320 L 500 360 L 440 340 Z" },
  NZ: { d: "M 545 340 L 560 335 L 565 370 L 550 380 L 540 360 Z" },
};

export function WorldMap() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const getCoverageColor = (coverage: "full" | "partial" | "none") => {
    switch (coverage) {
      case "full":
        return "fill-primary/80 hover:fill-primary";
      case "partial":
        return "fill-primary/40 hover:fill-primary/60";
      default:
        return "fill-muted hover:fill-muted-foreground/20";
    }
  };

  const selectedData = selectedCountry ? countriesData[selectedCountry] : null;

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

        {/* SVG Map */}
        <svg
          viewBox="0 0 600 400"
          className="w-full h-auto min-h-[300px] md:min-h-[400px]"
          style={{ maxHeight: '500px' }}
        >
          {/* Ocean background */}
          <rect x="0" y="0" width="600" height="400" className="fill-muted/30" rx="12" />
          
          {/* Countries */}
          {Object.entries(mapPaths).map(([code, path]) => {
            const country = countriesData[code];
            const isHovered = hoveredCountry === code;
            const isSelected = selectedCountry === code;
            
            return (
              <motion.path
                key={code}
                d={path.d}
                transform={path.transform}
                className={cn(
                  "cursor-pointer transition-all duration-200 stroke-background stroke-1",
                  country ? getCoverageColor(country.coverage) : "fill-muted"
                )}
                initial={false}
                animate={{
                  scale: isHovered || isSelected ? 1.02 : 1,
                  filter: isSelected ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" : "none"
                }}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
                onMouseEnter={() => setHoveredCountry(code)}
                onMouseLeave={() => setHoveredCountry(null)}
                onClick={() => country && setSelectedCountry(code)}
              />
            );
          })}

          {/* Hover Tooltip */}
          {hoveredCountry && countriesData[hoveredCountry] && !selectedCountry && (
            <g>
              <foreignObject
                x="0"
                y="0"
                width="200"
                height="60"
                style={{
                  transform: `translate(${mapPaths[hoveredCountry]?.d.match(/M\s*(\d+)/)?.[1] || 0}px, ${(parseInt(mapPaths[hoveredCountry]?.d.match(/M\s*\d+\s+(\d+)/)?.[1] || "0") - 50)}px)`
                }}
              >
                <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-sm font-medium text-foreground">
                    {countriesData[hoveredCountry].name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {countriesData[hoveredCountry].plans.length} plans available
                  </p>
                </div>
              </foreignObject>
            </g>
          )}
        </svg>

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
