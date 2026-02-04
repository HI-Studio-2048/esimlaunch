import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Upload, 
  Palette, 
  Store, 
  Smartphone, 
  Monitor, 
  Globe, 
  ShoppingCart, 
  User, 
  Search,
  Wifi,
  Clock,
  Check,
  Star,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useDemoStore, BrandConfig, defaultBrandConfig } from "@/contexts/DemoStoreContext";

const defaultConfig: BrandConfig = defaultBrandConfig;

const samplePlans = [
  { name: "Europe 5GB", data: "5GB", validity: "30 days", price: 14.99, popular: false },
  { name: "Europe 10GB", data: "10GB", validity: "30 days", price: 24.99, popular: true },
  { name: "Europe 20GB", data: "20GB", validity: "30 days", price: 39.99, popular: false },
];

export default function StorePreview() {
  const [config, setConfigState] = useState<BrandConfig>(defaultConfig);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setConfig: setDemoStoreConfig } = useDemoStore();

  const handleLaunchDemo = () => {
    setDemoStoreConfig(config);
    navigate("/demo-store");
  };

  const setConfig = (updater: BrandConfig | ((prev: BrandConfig) => BrandConfig)) => {
    if (typeof updater === "function") {
      setConfigState(updater);
    } else {
      setConfigState(updater);
    }
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (key: keyof BrandConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="Store Preview"
          title="See Your eSIM Store Come to Life"
          description="Customize your brand colors, upload your logo, and preview exactly how your white-label eSIM store will look."
        />

        <div className="grid lg:grid-cols-[400px,1fr] gap-8 mt-12">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Customize Your Store</h3>
                </div>

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    value={config.businessName}
                    onChange={(e) => handleColorChange("businessName", e.target.value)}
                    placeholder="Enter your business name"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Logo
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {config.logo ? (
                      <img 
                        src={config.logo} 
                        alt="Uploaded logo" 
                        className="h-16 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Click to upload your logo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Brand Colors
                  </Label>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Primary</span>
                      <div className="relative">
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                          className="w-full h-12 rounded-lg cursor-pointer border-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Secondary</span>
                      <div className="relative">
                        <input
                          type="color"
                          value={config.secondaryColor}
                          onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                          className="w-full h-12 rounded-lg cursor-pointer border-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Accent</span>
                      <div className="relative">
                        <input
                          type="color"
                          value={config.accentColor}
                          onChange={(e) => handleColorChange("accentColor", e.target.value)}
                          className="w-full h-12 rounded-lg cursor-pointer border-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset Themes */}
                <div className="space-y-2">
                  <Label className="text-sm">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Ocean", primary: "#0ea5e9", secondary: "#06b6d4", accent: "#22c55e" },
                      { name: "Sunset", primary: "#f97316", secondary: "#ef4444", accent: "#eab308" },
                      { name: "Forest", primary: "#22c55e", secondary: "#14b8a6", accent: "#84cc16" },
                      { name: "Royal", primary: "#8b5cf6", secondary: "#6366f1", accent: "#ec4899" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          accentColor: preset.accent,
                        }))}
                        className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary/50 transition-colors flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setConfig(defaultConfig)}
                >
                  Reset to Default
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Live Preview</h3>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "desktop" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "mobile" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Store Preview */}
            <div 
              className={`bg-card border border-border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                viewMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full"
              }`}
            >
              {/* Browser Chrome */}
              <div className="bg-muted/50 px-4 py-3 flex items-center gap-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-background rounded-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  {config.businessName.toLowerCase().replace(/\s+/g, '')}.esimlaunch.io
                </div>
              </div>

              {/* Store Content */}
              <div className="bg-background">
                {/* Navigation */}
                <nav 
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor}15, ${config.secondaryColor}10)` }}
                >
                  <div className="flex items-center gap-3">
                    {config.logo ? (
                      <img src={config.logo} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: config.primaryColor }}
                      >
                        {config.businessName.charAt(0)}
                      </div>
                    )}
                    <span className="font-semibold">{config.businessName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                </nav>

                {/* Hero Section */}
                <div 
                  className="px-6 py-12 text-center text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` 
                  }}
                >
                  <h1 className={`font-bold mb-3 ${viewMode === "mobile" ? "text-2xl" : "text-3xl"}`}>
                    Stay Connected Globally
                  </h1>
                  <p className={`opacity-90 mb-6 ${viewMode === "mobile" ? "text-sm" : "text-base"}`}>
                    Instant eSIM activation for 200+ destinations
                  </p>
                  <div className="relative max-w-md mx-auto">
                    <input
                      type="text"
                      placeholder="Where are you traveling?"
                      className="w-full px-4 py-3 rounded-xl text-foreground bg-background/95 shadow-lg"
                    />
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                      style={{ background: config.accentColor }}
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Popular Plans */}
                <div className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Popular Plans</h2>
                  <div className={`grid gap-4 ${viewMode === "mobile" ? "grid-cols-1" : "grid-cols-3"}`}>
                    {samplePlans.map((plan) => (
                      <div 
                        key={plan.name}
                        className={`relative rounded-xl border p-4 transition-all hover:shadow-lg ${
                          plan.popular ? "border-2" : "border-border"
                        }`}
                        style={{ 
                          borderColor: plan.popular ? config.primaryColor : undefined,
                        }}
                      >
                        {plan.popular && (
                          <div 
                            className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-white text-xs font-medium flex items-center gap-1"
                            style={{ background: config.primaryColor }}
                          >
                            <Star className="h-3 w-3" fill="currentColor" />
                            Popular
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: `${config.primaryColor}20` }}
                          >
                            <Wifi className="h-5 w-5" style={{ color: config.primaryColor }} />
                          </div>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-xs text-muted-foreground">{plan.data} Data</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Clock className="h-3 w-3" />
                          {plan.validity}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-lg">${plan.price}</div>
                          <button 
                            className="px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                            style={{ background: config.primaryColor }}
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div 
                  className="p-6 mx-6 mb-6 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor}10, ${config.secondaryColor}05)` }}
                >
                  <div className={`grid gap-4 ${viewMode === "mobile" ? "grid-cols-2" : "grid-cols-4"}`}>
                    {[
                      { icon: Wifi, text: "Instant Activation" },
                      { icon: Globe, text: "200+ Countries" },
                      { icon: Check, text: "24/7 Support" },
                      { icon: Star, text: "Best Rates" },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <feature.icon className="h-4 w-4" style={{ color: config.accentColor }} />
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Love what you see?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Launch the full demo store to experience your branded eSIM store in action.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  variant="gradient" 
                  size="lg"
                  onClick={handleLaunchDemo}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Launch Demo Store
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
