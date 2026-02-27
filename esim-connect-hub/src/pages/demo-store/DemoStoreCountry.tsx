import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wifi, Clock, Check, Star, Shield, Zap, Globe, Loader2 } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";
import { useStorePath } from "@/hooks/useStorePath";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const countryImages: Record<string, string> = {
  "france": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  "turkey": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80",
  "united-kingdom": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  "greece": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
  "united-arab-emirates": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  "spain": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80",
  "japan": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  "united-states": "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80",
};

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80";

export default function DemoStoreCountry() {
  const { config, storeId } = useDemoStore();
  const { data: storeData, isLoading } = usePublicStore(storeId);
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const basePath = useStorePath();
  const navigate = useNavigate();

  // Find matching packages for this country slug
  const { countryName, countryFlag, countryImage, plans } = useMemo(() => {
    const slug = countrySlug || "";
    if (storeData?.packages?.length) {
      const matchingPkgs = storeData.packages.filter(pkg => {
        const pkgSlug = pkg.location.toLowerCase().replace(/\s+/g, "-");
        return pkgSlug === slug;
      });
      if (matchingPkgs.length > 0) {
        const firstPkg = matchingPkgs[0];
        const sortedPlans = matchingPkgs
          .map((pkg, idx) => ({
            id: idx + 1,
            packageCode: pkg.packageCode,
            slug: pkg.slug,
            data: pkg.data,
            validity: pkg.validity,
            price: pkg.price,
            popular: false,
          }))
          .sort((a, b) => a.price - b.price);
        // Mark the middle plan as popular
        if (sortedPlans.length >= 3) {
          sortedPlans[Math.floor(sortedPlans.length / 2)].popular = true;
        }
        return {
          countryName: firstPkg.location,
          countryFlag: countryCodeToFlag(firstPkg.locationCode),
          countryImage: countryImages[slug] || DEFAULT_IMAGE,
          plans: sortedPlans,
        };
      }
    }
    // Fallback static data
    const staticName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      countryName: staticName,
      countryFlag: "🌍",
      countryImage: countryImages[slug] || DEFAULT_IMAGE,
      plans: [
        { id: 1, packageCode: '', slug: '', data: "1GB", validity: "7 days", price: 4.50, popular: false },
        { id: 2, packageCode: '', slug: '', data: "3GB", validity: "30 days", price: 9.00, popular: false },
        { id: 3, packageCode: '', slug: '', data: "5GB", validity: "30 days", price: 14.00, popular: true },
        { id: 4, packageCode: '', slug: '', data: "10GB", validity: "30 days", price: 24.00, popular: false },
        { id: 5, packageCode: '', slug: '', data: "20GB", validity: "30 days", price: 42.00, popular: false },
      ],
    };
  }, [countrySlug, storeData]);

  const handleBuyNow = (plan: typeof plans[0]) => {
    navigate(`${basePath}/checkout`, {
      state: {
        package: {
          ...plan,
          packageCode: plan.packageCode,
        },
        country: countryName,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={countryImage}
          alt={countryName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container mx-auto">
            <Link
              to={`${basePath}/destinations`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Destinations
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{countryFlag}</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{countryName} eSIM</h1>
                <p className="text-white/80">Stay connected with high-speed data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr,320px] gap-8">
            {/* Plans Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative bg-card border rounded-2xl p-5 hover:shadow-lg transition-all ${
                      plan.popular ? "border-2" : "border-border"
                    }`}
                    style={{ borderColor: plan.popular ? config.primaryColor : undefined }}
                  >
                    {plan.popular && (
                      <Badge
                        className="absolute -top-3 left-4 text-white"
                        style={{ background: config.primaryColor }}
                      >
                        <Star className="h-3 w-3 mr-1" fill="currentColor" />
                        Popular
                      </Badge>
                    )}

                    <div className="mb-4">
                      <div className="text-2xl font-bold mb-1">{plan.data}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {plan.validity}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Wifi className="h-4 w-4" />
                      4G/LTE Speed
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">${plan.price.toFixed(2)}</div>
                      <Button
                        size="sm"
                        className="text-white"
                        style={{ background: config.primaryColor }}
                        onClick={() => handleBuyNow(plan)}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Plan Features</h3>
                <ul className="space-y-3">
                  {[
                    "Instant digital delivery",
                    "No physical SIM needed",
                    "Keep your number via eSIM",
                    "Hotspot/tethering allowed",
                    "24/7 customer support",
                    "Valid from activation",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4" style={{ color: config.accentColor }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-muted/50 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Network Coverage</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network Type</span>
                    <span className="font-medium">4G/LTE</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">99%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Carriers</span>
                    <span className="font-medium">Multiple</span>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-6 text-white"
                style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
              >
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Our support team is available 24/7 to assist you.
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, icon: Globe, title: "Choose Your Plan", desc: "Select the data plan that fits your needs" },
              { step: 2, icon: Zap, title: "Get Your eSIM", desc: "Receive instant delivery via email or QR code" },
              { step: 3, icon: Wifi, title: "Stay Connected", desc: "Scan, install, and connect in minutes" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${config.primaryColor}15` }}
                >
                  <item.icon className="h-8 w-8" style={{ color: config.primaryColor }} />
                </div>
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-2"
                  style={{ background: config.primaryColor }}
                >
                  Step {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
