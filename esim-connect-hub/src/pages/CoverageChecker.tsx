import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Globe, Wifi, Clock, DollarSign, 
  ChevronDown, ChevronRight, Filter, X, Star,
  MapPin, Zap, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

// Mock data for countries and plans
const countries = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    region: "North America",
    popular: true,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.50, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "3GB", validity: "30 days", price: 11.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 15.00, type: "Data Only" },
      { id: 4, provider: "eSIM Go", data: "10GB", validity: "30 days", price: 26.00, type: "Data Only" },
      { id: 5, provider: "Truphone", data: "Unlimited", validity: "7 days", price: 35.00, type: "Data + Calls" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    region: "Europe",
    popular: true,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.00, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "5GB", validity: "30 days", price: 14.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "10GB", validity: "30 days", price: 22.00, type: "Data Only" },
      { id: 4, provider: "GigSky", data: "3GB", validity: "15 days", price: 12.00, type: "Data Only" },
    ],
  },
  {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    region: "Asia",
    popular: true,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.50, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "3GB", validity: "30 days", price: 9.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 16.00, type: "Data Only" },
      { id: 4, provider: "Truphone", data: "10GB", validity: "30 days", price: 28.00, type: "Data Only" },
    ],
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    region: "Europe",
    popular: true,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.00, type: "Data Only" },
      { id: 2, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 13.00, type: "Data Only" },
      { id: 3, provider: "GigSky", data: "10GB", validity: "30 days", price: 24.00, type: "Data Only" },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    region: "Europe",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.00, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "3GB", validity: "30 days", price: 10.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 14.00, type: "Data Only" },
    ],
  },
  {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    region: "Europe",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.00, type: "Data Only" },
      { id: 2, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 13.00, type: "Data Only" },
    ],
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    region: "Europe",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.00, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "5GB", validity: "30 days", price: 12.00, type: "Data Only" },
      { id: 3, provider: "GigSky", data: "3GB", validity: "15 days", price: 11.00, type: "Data Only" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    region: "Oceania",
    popular: true,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 5.00, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "5GB", validity: "30 days", price: 16.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "10GB", validity: "30 days", price: 28.00, type: "Data Only" },
      { id: 4, provider: "Truphone", data: "Unlimited", validity: "7 days", price: 40.00, type: "Data + Calls" },
    ],
  },
  {
    code: "TH",
    name: "Thailand",
    flag: "🇹🇭",
    region: "Asia",
    popular: true,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.00, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "3GB", validity: "30 days", price: 8.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 12.00, type: "Data Only" },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    region: "Asia",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.50, type: "Data Only" },
      { id: 2, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 15.00, type: "Data Only" },
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    region: "Middle East",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 5.50, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "3GB", validity: "30 days", price: 13.00, type: "Data Only" },
      { id: 3, provider: "GigSky", data: "5GB", validity: "30 days", price: 18.00, type: "Data Only" },
    ],
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    region: "South America",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 5.00, type: "Data Only" },
      { id: 2, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 16.00, type: "Data Only" },
    ],
  },
  {
    code: "MX",
    name: "Mexico",
    flag: "🇲🇽",
    region: "North America",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.50, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "3GB", validity: "30 days", price: 10.00, type: "Data Only" },
      { id: 3, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 14.00, type: "Data Only" },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    region: "North America",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 5.00, type: "Data Only" },
      { id: 2, provider: "Airalo", data: "5GB", validity: "30 days", price: 18.00, type: "Data Only" },
      { id: 3, provider: "Truphone", data: "10GB", validity: "30 days", price: 32.00, type: "Data Only" },
    ],
  },
  {
    code: "KR",
    name: "South Korea",
    flag: "🇰🇷",
    region: "Asia",
    popular: false,
    plans: [
      { id: 1, provider: "Airalo", data: "1GB", validity: "7 days", price: 4.50, type: "Data Only" },
      { id: 2, provider: "eSIM Go", data: "5GB", validity: "30 days", price: 15.00, type: "Data Only" },
      { id: 3, provider: "Truphone", data: "Unlimited", validity: "7 days", price: 38.00, type: "Data + Calls" },
    ],
  },
];

const regions = ["All Regions", "North America", "Europe", "Asia", "Oceania", "Middle East", "South America"];
const providers = ["All Providers", "Airalo", "eSIM Go", "Truphone", "GigSky"];
const dataFilters = ["All Data", "1GB", "3GB", "5GB", "10GB", "Unlimited"];

export default function CoverageChecker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [selectedData, setSelectedData] = useState("All Data");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredCountries = useMemo(() => {
    return countries.filter((country) => {
      // Search filter
      const matchesSearch = 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Region filter
      const matchesRegion = selectedRegion === "All Regions" || country.region === selectedRegion;
      
      // Provider filter
      const matchesProvider = selectedProvider === "All Providers" || 
        country.plans.some(plan => plan.provider === selectedProvider);
      
      // Data filter
      const matchesData = selectedData === "All Data" || 
        country.plans.some(plan => plan.data === selectedData);
      
      return matchesSearch && matchesRegion && matchesProvider && matchesData;
    });
  }, [searchQuery, selectedRegion, selectedProvider, selectedData]);

  const popularCountries = filteredCountries.filter(c => c.popular);
  const otherCountries = filteredCountries.filter(c => !c.popular);

  const clearFilters = () => {
    setSelectedRegion("All Regions");
    setSelectedProvider("All Providers");
    setSelectedData("All Data");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedRegion !== "All Regions" || 
    selectedProvider !== "All Providers" || 
    selectedData !== "All Data" ||
    searchQuery !== "";

  const getFilteredPlans = (plans: typeof countries[0]["plans"]) => {
    return plans.filter(plan => {
      const matchesProvider = selectedProvider === "All Providers" || plan.provider === selectedProvider;
      const matchesData = selectedData === "All Data" || plan.data === selectedData;
      return matchesProvider && matchesData;
    });
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-b from-primary/5 to-background">
        <div className="container-custom">
          <SectionHeader
            badge="Coverage Checker"
            title="Find eSIM Plans for Any Destination"
            description="Search our database of 190+ countries and compare plans from top providers"
          />

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by country name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg rounded-2xl border-2 focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filter Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-4"
          >
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </motion.div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-4xl mx-auto mt-4 overflow-hidden"
              >
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Region</label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Provider</label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map(provider => (
                            <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Amount</label>
                      <Select value={selectedData} onValueChange={setSelectedData}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataFilters.map(data => (
                            <SelectItem key={data} value={data}>{data}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1" />
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results Section */}
      <section className="section-padding pt-8">
        <div className="container-custom">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredCountries.length}</span> countries
            </p>
            {hasActiveFilters && (
              <div className="flex gap-2 flex-wrap">
                {selectedRegion !== "All Regions" && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedRegion}
                  </Badge>
                )}
                {selectedProvider !== "All Providers" && (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    {selectedProvider}
                  </Badge>
                )}
                {selectedData !== "All Data" && (
                  <Badge variant="secondary" className="gap-1">
                    <Wifi className="w-3 h-3" />
                    {selectedData}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Popular Destinations */}
          {popularCountries.length > 0 && !hasActiveFilters && (
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Popular Destinations
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {popularCountries.slice(0, 4).map((country, index) => (
                  <motion.button
                    key={country.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setExpandedCountry(expandedCountry === country.code ? null : country.code)}
                    className="bg-card rounded-2xl p-6 text-left border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{country.flag}</span>
                      <div>
                        <h4 className="font-semibold">{country.name}</h4>
                        <p className="text-sm text-muted-foreground">{country.plans.length} plans available</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        From <span className="font-semibold text-primary">${Math.min(...country.plans.map(p => p.price)).toFixed(2)}</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* All Countries List */}
          <div className="space-y-3">
            {(hasActiveFilters ? filteredCountries : otherCountries).length === 0 && popularCountries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Globe className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No countries found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
              </motion.div>
            ) : (
              <>
                {!hasActiveFilters && otherCountries.length > 0 && (
                  <h3 className="text-lg font-semibold mb-4">All Countries</h3>
                )}
                {(hasActiveFilters ? filteredCountries : [...popularCountries.slice(4), ...otherCountries]).map((country, index) => (
                  <motion.div
                    key={country.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div
                      className={`bg-card rounded-2xl border transition-all ${
                        expandedCountry === country.code 
                          ? "border-primary shadow-lg" 
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {/* Country Header */}
                      <button
                        onClick={() => setExpandedCountry(expandedCountry === country.code ? null : country.code)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{country.flag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{country.name}</h4>
                              {country.popular && (
                                <Badge variant="secondary" className="text-xs">Popular</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{country.region}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground">{getFilteredPlans(country.plans).length} plans</p>
                            <p className="font-semibold">
                              From <span className="text-primary">${Math.min(...getFilteredPlans(country.plans).map(p => p.price)).toFixed(2)}</span>
                            </p>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              expandedCountry === country.code ? "rotate-180" : ""
                            }`} 
                          />
                        </div>
                      </button>

                      {/* Plans Grid */}
                      <AnimatePresence>
                        {expandedCountry === country.code && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-2 border-t border-border">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                {getFilteredPlans(country.plans).map((plan) => (
                                  <div
                                    key={plan.id}
                                    className="bg-muted/50 rounded-xl p-4 hover:bg-muted transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <Badge variant="outline" className="text-xs">{plan.provider}</Badge>
                                      <span className="text-lg font-bold text-primary">${plan.price.toFixed(2)}</span>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Wifi className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{plan.data}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>{plan.validity}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Zap className="w-4 h-4 text-muted-foreground" />
                                        <span>{plan.type}</span>
                                      </div>
                                    </div>
                                    <Button variant="gradient" size="sm" className="w-full mt-4">
                                      Select Plan
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 md:p-12 border border-border text-center"
          >
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-bg flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Ready to start selling eSIMs?
              </h2>
              <p className="text-muted-foreground mb-6">
                Access all these plans and more through your own branded eSIM store. Launch in minutes with eSIMLaunch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gradient" size="lg" asChild>
                  <Link to="/pricing">Start Your Store</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/demo">Request Demo</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
