import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Globe, Wifi, Zap, Shield, CreditCard, ArrowRight } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const allCountries = [
  { name: "Afghanistan", flag: "🇦🇫", price: 16.00, network: "3G", region: "Asia" },
  { name: "Albania", flag: "🇦🇱", price: 16.00, network: "4G", region: "Europe" },
  { name: "Algeria", flag: "🇩🇿", price: 19.00, network: "4G", region: "Africa" },
  { name: "Anguilla", flag: "🇦🇮", price: 19.00, network: "4G", region: "Americas" },
  { name: "Argentina", flag: "🇦🇷", price: 12.00, network: "4G", region: "Americas" },
  { name: "Armenia", flag: "🇦🇲", price: 14.00, network: "4G", region: "Asia" },
  { name: "Australia", flag: "🇦🇺", price: 10.00, network: "5G", region: "Oceania" },
  { name: "Austria", flag: "🇦🇹", price: 9.00, network: "5G", region: "Europe" },
  { name: "Azerbaijan", flag: "🇦🇿", price: 16.00, network: "4G", region: "Asia" },
  { name: "Bahamas", flag: "🇧🇸", price: 22.00, network: "4G", region: "Americas" },
  { name: "Belgium", flag: "🇧🇪", price: 9.00, network: "5G", region: "Europe" },
  { name: "Brazil", flag: "🇧🇷", price: 11.00, network: "4G", region: "Americas" },
  { name: "Canada", flag: "🇨🇦", price: 10.00, network: "5G", region: "Americas" },
  { name: "China", flag: "🇨🇳", price: 15.00, network: "5G", region: "Asia" },
  { name: "Denmark", flag: "🇩🇰", price: 9.00, network: "5G", region: "Europe" },
  { name: "Egypt", flag: "🇪🇬", price: 18.00, network: "4G", region: "Africa" },
  { name: "Finland", flag: "🇫🇮", price: 9.00, network: "5G", region: "Europe" },
  { name: "France", flag: "🇫🇷", price: 9.00, network: "5G", region: "Europe" },
  { name: "Germany", flag: "🇩🇪", price: 9.00, network: "5G", region: "Europe" },
  { name: "Greece", flag: "🇬🇷", price: 10.00, network: "4G", region: "Europe" },
  { name: "Hong Kong", flag: "🇭🇰", price: 8.00, network: "5G", region: "Asia" },
  { name: "Iceland", flag: "🇮🇸", price: 12.00, network: "4G", region: "Europe" },
  { name: "India", flag: "🇮🇳", price: 12.00, network: "4G", region: "Asia" },
  { name: "Indonesia", flag: "🇮🇩", price: 14.00, network: "4G", region: "Asia" },
  { name: "Ireland", flag: "🇮🇪", price: 9.00, network: "5G", region: "Europe" },
  { name: "Israel", flag: "🇮🇱", price: 15.00, network: "4G", region: "Asia" },
  { name: "Italy", flag: "🇮🇹", price: 9.00, network: "5G", region: "Europe" },
  { name: "Japan", flag: "🇯🇵", price: 12.00, network: "5G", region: "Asia" },
  { name: "Malaysia", flag: "🇲🇾", price: 10.00, network: "4G", region: "Asia" },
  { name: "Mexico", flag: "🇲🇽", price: 11.00, network: "4G", region: "Americas" },
  { name: "Netherlands", flag: "🇳🇱", price: 9.00, network: "5G", region: "Europe" },
  { name: "New Zealand", flag: "🇳🇿", price: 12.00, network: "4G", region: "Oceania" },
  { name: "Norway", flag: "🇳🇴", price: 10.00, network: "5G", region: "Europe" },
  { name: "Philippines", flag: "🇵🇭", price: 12.00, network: "4G", region: "Asia" },
  { name: "Poland", flag: "🇵🇱", price: 9.00, network: "4G", region: "Europe" },
  { name: "Portugal", flag: "🇵🇹", price: 9.00, network: "4G", region: "Europe" },
  { name: "Singapore", flag: "🇸🇬", price: 8.00, network: "5G", region: "Asia" },
  { name: "South Korea", flag: "🇰🇷", price: 10.00, network: "5G", region: "Asia" },
  { name: "Spain", flag: "🇪🇸", price: 9.00, network: "5G", region: "Europe" },
  { name: "Sweden", flag: "🇸🇪", price: 9.00, network: "5G", region: "Europe" },
  { name: "Switzerland", flag: "🇨🇭", price: 12.00, network: "5G", region: "Europe" },
  { name: "Thailand", flag: "🇹🇭", price: 9.00, network: "4G", region: "Asia" },
  { name: "Turkey", flag: "🇹🇷", price: 9.00, network: "4G", region: "Europe" },
  { name: "United Arab Emirates", flag: "🇦🇪", price: 16.00, network: "5G", region: "Asia" },
  { name: "United Kingdom", flag: "🇬🇧", price: 10.00, network: "5G", region: "Europe" },
  { name: "United States", flag: "🇺🇸", price: 9.00, network: "5G", region: "Americas" },
  { name: "Vietnam", flag: "🇻🇳", price: 10.00, network: "4G", region: "Asia" },
];

const regionalPlans = [
  { name: "Africa", icon: "🌍", price: 54.00, network: "5G", countries: 30 },
  { name: "Caribbean Islands", icon: "🏝️", price: 30.00, network: "4G", countries: 20 },
  { name: "Middle East and North Africa", icon: "🕌", price: 30.00, network: "4G", countries: 15 },
  { name: "World", icon: "🌐", price: 18.00, network: "4G", countries: 100 },
  { name: "Europe", icon: "🇪🇺", price: 15.00, network: "5G", countries: 40 },
  { name: "Asia Pacific", icon: "🌏", price: 20.00, network: "4G", countries: 25 },
  { name: "Americas", icon: "🌎", price: 25.00, network: "4G", countries: 30 },
];

const alphabetGroups = ["A-B", "C-E", "F-H", "I-Z"];

export default function DemoStoreDestinations() {
  const { config } = useDemoStore();
  const [search, setSearch] = useState("");
  const [destinationType, setDestinationType] = useState<"local" | "regional">("local");
  const [activeAlphabet, setActiveAlphabet] = useState("A-B");

  const filteredCountries = useMemo(() => {
    let filtered = allCountries;
    
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
  }, [search, activeAlphabet]);

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
                          to={`/demo-store/country/${c.name.toLowerCase().replace(/\s+/g, "-")}`}
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
                        to={`/demo-store/country/${country.name.toLowerCase().replace(/\s+/g, "-")}`}
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
