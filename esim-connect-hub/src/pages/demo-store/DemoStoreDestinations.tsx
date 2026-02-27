import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Globe, Wifi, Zap, Shield, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";
import { useStorePath } from "@/hooks/useStorePath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

const alphabetGroups = ["A-B", "C-E", "F-H", "I-Z"];

export default function DemoStoreDestinations() {
  const { config, storeId } = useDemoStore();
  const { data: storeData, isLoading: packagesLoading } = usePublicStore(storeId);
  const basePath = useStorePath();
  const [search, setSearch] = useState("");
  const [destinationType, setDestinationType] = useState<"local" | "regional">("local");
  const [activeAlphabet, setActiveAlphabet] = useState("A-B");

  // Derive country list from live packages
  const allCountries = useMemo(() => {
    if (!storeData?.packages?.length) return [];
    const byLocation: Record<string, { name: string; code: string; minPrice: number }> = {};
    for (const pkg of storeData.packages) {
      const code = pkg.locationCode;
      if (!code || code.length > 3) continue;
      if (!byLocation[code]) {
        byLocation[code] = { name: pkg.location, code, minPrice: pkg.price };
      } else if (pkg.price < byLocation[code].minPrice) {
        byLocation[code].minPrice = pkg.price;
      }
    }
    return Object.values(byLocation)
      .map(loc => ({
        name: loc.name,
        flag: countryCodeToFlag(loc.code),
        price: loc.minPrice,
        network: "4G",
        region: "International",
        locationCode: loc.code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [storeData]);

  // Derive regional plans (packages with locationCode length > 2 or containing multi-country location names)
  const regionalPlans = useMemo(() => {
    if (!storeData?.packages?.length) return [];
    const seen = new Set<string>();
    return storeData.packages
      .filter(pkg => pkg.locationCode && pkg.locationCode.length > 2)
      .reduce<Array<{ name: string; icon: string; price: number; network: string; countries: number }>>((acc, pkg) => {
        if (!seen.has(pkg.location)) {
          seen.add(pkg.location);
          acc.push({ name: pkg.location, icon: "🌐", price: pkg.price, network: "4G", countries: 0 });
        }
        return acc;
      }, []);
  }, [storeData]);

  const filteredCountries = useMemo(() => {
    let filtered = [...allCountries];
    
    if (search) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      // Filter by alphabet
      filtered = filtered.filter(c => {
        const firstLetter = c.name.charAt(0).toUpperCase();
        switch (activeAlphabet) {
          case "A-B": return firstLetter >= "A" && firstLetter <= "B";
          case "C-E": return firstLetter >= "C" && firstLetter <= "E";
          case "F-H": return firstLetter >= "F" && firstLetter <= "H";
          case "I-Z": return firstLetter >= "I" && firstLetter <= "Z";
          default: return true;
        }
      });
    }

    return filtered;
  }, [search, activeAlphabet, allCountries]);

  const popularCountries = allCountries.slice(0, 5);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Where are you traveling next?</h1>
          <p className="text-muted-foreground">
            First, pick your destination, then choose a data plan that fits your needs.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setDestinationType("local")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              destinationType === "local"
                ? "text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
            style={destinationType === "local" ? { background: config.primaryColor } : {}}
          >
            <MapPin className="h-4 w-4" />
            Local
          </button>
          <button
            onClick={() => setDestinationType("regional")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              destinationType === "regional"
                ? "text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
            style={destinationType === "regional" ? { background: config.primaryColor } : {}}
          >
            <Globe className="h-4 w-4" />
            Regional
          </button>
        </div>

        <AnimatePresence mode="wait">
          {destinationType === "local" ? (
            <motion.div
              key="local"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-[280px,1fr,280px] gap-8"
            >
              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5" />
                    <span className="font-semibold">Local</span>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm text-muted-foreground mb-3">Popular Destinations</h4>
                    <div className="space-y-2">
                      {popularCountries.map(c => (
                        <Link
                          key={c.name}
                          to={`${basePath}/country/${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <span>{c.flag}</span>
                          <span className="text-sm">{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5" />
                    <span className="font-semibold">Regional</span>
                  </div>
                  <div className="space-y-2">
                    {regionalPlans.slice(0, 4).map(r => (
                      <button
                        key={r.name}
                        onClick={() => setDestinationType("regional")}
                        className="block text-sm text-left hover:text-primary transition-colors"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div>
                {/* Alphabet Filter */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm text-muted-foreground">Country</span>
                  <div className="flex items-center gap-2">
                    {alphabetGroups.map(group => (
                      <button
                        key={group}
                        onClick={() => setActiveAlphabet(group)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          activeAlphabet === group
                            ? "text-white"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        style={activeAlphabet === group ? { background: config.primaryColor } : {}}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Countries Grid */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredCountries.map((country, i) => (
                    <motion.div
                      key={country.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Link
                        to={`${basePath}/country/${country.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <span className="font-medium truncate">{country.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* See All Button */}
                <div className="flex justify-center mt-8">
                  <Button
                    size="lg"
                    className="rounded-full text-white"
                    style={{ background: config.primaryColor }}
                  >
                    See All Destinations
                    <Globe className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right Sidebar - Features */}
              <div className="space-y-4 hidden lg:block">
                {[
                  { icon: Zap, title: "Instant Activation" },
                  { icon: Wifi, title: "High Internet Speeds" },
                  { icon: Shield, title: "Hotspot Sharing" },
                  { icon: CreditCard, title: "No Hidden Charges" },
                ].map((feature, i) => (
                  <div
                    key={feature.title}
                    className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.primaryColor}15` }}
                    >
                      <feature.icon className="h-5 w-5" style={{ color: config.primaryColor }} />
                    </div>
                    <span className="font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="regional"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {regionalPlans.map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-muted/30 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-4xl mb-4">{plan.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm">
                        FROM <span className="font-bold" style={{ color: config.primaryColor }}>${plan.price.toFixed(2)}</span>
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wifi className="h-3 w-3" />
                        {plan.network}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.countries}+ countries included</p>
                    <Button
                      className="w-full text-white"
                      style={{ background: config.primaryColor }}
                    >
                      Select Plan
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
