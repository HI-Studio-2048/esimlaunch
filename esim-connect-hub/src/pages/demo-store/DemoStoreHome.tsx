import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Check, Wifi, Globe, MapPin, Clock, Star, Zap, Smartphone, Shield, ArrowRight, Loader2 } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";
import { useStorePath } from "@/hooks/useStorePath";
import { Button } from "@/components/ui/button";

// Static lookup for country images and flags (fallback for unknown codes)
const COUNTRY_META: Record<string, { flag: string; image: string }> = {
  "FR": { flag: "🇫🇷", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80" },
  "TR": { flag: "🇹🇷", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80" },
  "GB": { flag: "🇬🇧", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80" },
  "GR": { flag: "🇬🇷", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&q=80" },
  "AE": { flag: "🇦🇪", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
  "ES": { flag: "🇪🇸", image: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&q=80" },
  "JP": { flag: "🇯🇵", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80" },
  "US": { flag: "🇺🇸", image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=80" },
  "AU": { flag: "🇦🇺", image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&q=80" },
  "DE": { flag: "🇩🇪", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80" },
  "IT": { flag: "🇮🇹", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80" },
  "TH": { flag: "🇹🇭", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
};

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80";

const staticDestinations = [
  { name: "France", flag: "🇫🇷", price: 9.00, image: COUNTRY_META.FR.image },
  { name: "Turkey", flag: "🇹🇷", price: 9.00, image: COUNTRY_META.TR.image },
  { name: "United Kingdom", flag: "🇬🇧", price: 10.00, image: COUNTRY_META.GB.image },
  { name: "Greece", flag: "🇬🇷", price: 10.00, image: COUNTRY_META.GR.image },
  { name: "United Arab Emirates", flag: "🇦🇪", price: 16.00, image: COUNTRY_META.AE.image },
  { name: "Spain", flag: "🇪🇸", price: 9.00, image: COUNTRY_META.ES.image },
  { name: "Japan", flag: "🇯🇵", price: 12.00, image: COUNTRY_META.JP.image },
  { name: "United States", flag: "🇺🇸", price: 9.00, image: COUNTRY_META.US.image },
];

const esimInfo = [
  {
    icon: Smartphone,
    title: "No local phone number",
    description: "This eSIM provides data access only. Making phone calls or sending SMS is not possible. You can use apps like WhatsApp or Skype for communication.",
    variant: "light"
  },
  {
    icon: Shield,
    title: "Your phone must support eSIM",
    description: "Ensure your phone is unlocked and supports eSIM technology.",
    variant: "dark"
  },
  {
    icon: Zap,
    title: "Install before you travel",
    description: "Install your eSIM before your trip, but don't activate the data plan until you reach your destination.",
    variant: "accent"
  }
];

type HomeLayoutProps = {
  config: { businessName: string; primaryColor: string; secondaryColor: string };
  popularDestinations: { name: string; flag: string; price: number; image: string }[];
  destinationType: "local" | "regional";
  setDestinationType: (t: "local" | "regional") => void;
  packagesLoading?: boolean;
  settings?: { heroHeadline?: string; heroSubheadline?: string };
  basePath: string;
};

function DefaultHomeLayout(props: HomeLayoutProps) {
  const { config, popularDestinations, destinationType, setDestinationType, basePath } = props;
  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
      >
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              Don't Get Stuck Offline Abroad! Connect Instantly with {config.businessName}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/90 text-lg mb-8"
            >
              Go Global Instantly! {config.businessName} Connects You in 190+ Countries.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-xl"
            >
              <input
                type="text"
                placeholder="Select your destination, connect instantly"
                className="w-full px-5 py-4 pr-14 rounded-full text-foreground bg-white shadow-lg"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: config.primaryColor }}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 mt-8"
            >
              {[
                { icon: Check, text: "190+ Countries" },
                { icon: Check, text: "Instant Activation" },
                { icon: Check, text: "24/7 Support" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-white">
                  <feature.icon className="h-5 w-5" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
          <div className="absolute right-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>
      <SharedSections {...props} />
    </div>
  );
}

// Shared sections (destinations, eSIM info, features, CTA) used by all templates
function SharedSections(props: HomeLayoutProps) {
  const { config, popularDestinations, destinationType, setDestinationType, basePath } = props;
  return (
    <>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Where are you traveling next?</h2>
          <p className="text-muted-foreground mb-8">
            First, pick your destination, then choose a data plan that fits your needs.
          </p>
          <div className="flex items-center gap-2 mb-8">
            <button
              onClick={() => setDestinationType("local")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${destinationType === "local" ? "text-white" : "bg-muted hover:bg-muted/80"}`}
              style={destinationType === "local" ? { background: config.primaryColor } : {}}
            >
              <MapPin className="h-4 w-4" /> Local
            </button>
            <button
              onClick={() => setDestinationType("regional")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${destinationType === "regional" ? "text-white" : "bg-muted hover:bg-muted/80"}`}
              style={destinationType === "regional" ? { background: config.primaryColor } : {}}
            >
              <Globe className="h-4 w-4" /> Regional
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((dest, i) => (
              <Link key={dest.name} to={`${basePath}/country/${dest.name.toLowerCase().replace(/\s+/g, "-")}`} className="block group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3">
                  <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-xl">{dest.flag}</div>
                </div>
                <h3 className="font-semibold text-lg">{dest.name}</h3>
                <div className="flex justify-between mt-1">
                  <span className="text-sm">FROM <span className="font-bold" style={{ color: config.primaryColor }}>${dest.price.toFixed(2)}</span></span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Wifi className="h-3 w-3" /> 4G</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Link to={`${basePath}/destinations`}>
              <Button size="lg" className="rounded-full text-white" style={{ background: config.primaryColor }}>
                View All Destinations <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Things to know about eSIM</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {esimInfo.map((info, i) => (
              <motion.div key={info.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl ${info.variant === "dark" ? "bg-foreground text-background" : info.variant === "accent" ? "text-foreground" : "bg-muted"}`}
                style={info.variant === "accent" ? { background: `${config.secondaryColor}30` } : {}}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${info.variant === "dark" ? "bg-background/10" : "bg-background"}`}>
                  <info.icon className={`h-6 w-6 ${info.variant === "dark" ? "text-background" : ""}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{info.title}</h3>
                <p className={`text-sm ${info.variant === "dark" ? "text-background/80" : "text-muted-foreground"}`}>{info.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ icon: Zap, title: "Instant Activation", desc: "Get connected in seconds" }, { icon: Wifi, title: "High-Speed Data", desc: "4G/LTE coverage worldwide" }, { icon: Globe, title: "190+ Countries", desc: "Travel without limits" }, { icon: Star, title: "24/7 Support", desc: "Always here to help" }].map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${config.primaryColor}15` }}>
                  <feature.icon className="h-8 w-8" style={{ color: config.primaryColor }} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16" style={{ background: `linear-gradient(135deg, ${config.primaryColor}10, ${config.secondaryColor}10)` }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to stay connected?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Get your eSIM in minutes and enjoy seamless connectivity wherever you travel.</p>
          <Link to={`${basePath}/destinations`}>
            <Button size="lg" className="rounded-full text-white" style={{ background: config.primaryColor }}>Browse All Plans <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </>
  );
}

function MinimalHomeLayout(props: HomeLayoutProps) {
  const { config, settings, basePath } = props;
  const headline = settings?.heroHeadline || `Stay connected with ${config.businessName}`;
  const subheadline = settings?.heroSubheadline || "eSIM plans for 190+ countries. No SIM card, instant activation.";
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-4xl font-bold text-foreground mb-3">{headline}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-muted-foreground">{subheadline}</motion.p>
            <Link to={`${basePath}/destinations`} className="inline-flex items-center gap-2 mt-6 text-sm font-medium" style={{ color: config.primaryColor }}>Browse plans <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
      <SharedSections {...props} />
    </div>
  );
}

function BoldHomeLayout(props: HomeLayoutProps) {
  const { config, settings, basePath } = props;
  const headline = settings?.heroHeadline || `Connect anywhere. ${config.businessName}.`;
  const subheadline = settings?.heroSubheadline || "190+ countries. Instant activation. No physical SIM.";
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-20 md:py-28" style={{ background: `linear-gradient(180deg, ${config.primaryColor}, ${config.secondaryColor})` }}>
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-4xl md:text-6xl font-extrabold text-white mb-6">{headline}</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl text-white/90 max-w-2xl mx-auto mb-10">{subheadline}</motion.p>
          <Link to={`${basePath}/destinations`}>
            <Button size="lg" className="rounded-full text-white bg-white/20 hover:bg-white/30 border border-white/40" style={{ color: 'white' }}>See all destinations</Button>
          </Link>
        </div>
      </section>
      <SharedSections {...props} />
    </div>
  );
}

function TravelHomeLayout(props: HomeLayoutProps) {
  const { config, basePath } = props;
  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 md:py-16 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Where are you going?</h1>
          <p className="text-muted-foreground mb-6">Choose your destination and get connected in minutes.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {props.popularDestinations.slice(0, 8).map((dest) => (
              <Link key={dest.name} to={`${basePath}/country/${dest.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex flex-col items-center p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors"
              >
                <span className="text-2xl mb-2">{dest.flag}</span>
                <span className="font-medium text-sm">{dest.name}</span>
                <span className="text-xs mt-1" style={{ color: config.primaryColor }}>From ${dest.price.toFixed(2)}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to={`${basePath}/destinations`}>
              <Button variant="outline" size="sm">View all destinations</Button>
            </Link>
          </div>
        </div>
      </section>
      <SharedSections {...props} />
    </div>
  );
}

export default function DemoStoreHome() {
  const { config, storeId } = useDemoStore();
  const { data: storeData, isLoading: packagesLoading } = usePublicStore(storeId);
  const basePath = useStorePath();
  const [destinationType, setDestinationType] = useState<"local" | "regional">("local");

  const popularDestinations = useMemo(() => {
    if (!storeData?.packages?.length) return staticDestinations;
    const byLocation: Record<string, { name: string; code: string; minPrice: number }> = {};
    for (const pkg of storeData.packages) {
      const code = pkg.locationCode;
      if (!code || code.length > 3) continue;
      if (!byLocation[code]) byLocation[code] = { name: pkg.location, code, minPrice: pkg.price };
      else if (pkg.price < byLocation[code].minPrice) byLocation[code].minPrice = pkg.price;
    }
    return Object.values(byLocation).slice(0, 8).map(loc => ({
      name: loc.name,
      flag: COUNTRY_META[loc.code]?.flag || countryCodeToFlag(loc.code),
      price: loc.minPrice,
      image: COUNTRY_META[loc.code]?.image || DEFAULT_IMAGE,
    }));
  }, [storeData]);

  const templateKey = (storeData?.templateKey || "default") as "default" | "minimal" | "bold" | "travel";
  const layoutProps: HomeLayoutProps = {
    config,
    popularDestinations,
    destinationType,
    setDestinationType,
    packagesLoading,
    settings: storeData?.templateSettings,
    basePath,
  };

  if (packagesLoading && !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templateKey === "minimal") return <MinimalHomeLayout {...layoutProps} />;
  if (templateKey === "bold") return <BoldHomeLayout {...layoutProps} />;
  if (templateKey === "travel") return <TravelHomeLayout {...layoutProps} />;
  return <DefaultHomeLayout {...layoutProps} />;
}
