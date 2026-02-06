import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DNSInstructions } from "@/components/shared/DNSInstructions";
import { markStepCompleted } from "@/lib/onboardingProgress";
import { cn } from "@/lib/utils";
import {
  User,
  Palette,
  Wifi,
  CreditCard,
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  Globe,
  AlertCircle,
} from "lucide-react";

const steps = [
  { id: 1, name: "Profile", icon: User },
  { id: 2, name: "Branding", icon: Palette },
  { id: 3, name: "Provider", icon: Wifi },
  { id: 4, name: "Payment", icon: CreditCard },
  { id: 5, name: "Launch", icon: Rocket },
];

const providers = [
  { id: "airalo", name: "Airalo", description: "Global eSIM marketplace", popular: true },
  { id: "esimgo", name: "eSIM Go", description: "Enterprise-grade solutions" },
  { id: "gigsky", name: "GigSky", description: "Premium travel eSIMs" },
  { id: "truphone", name: "Truphone", description: "Business connectivity" },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form states
  const [profile, setProfile] = useState({
    businessName: "",
    website: "",
    phone: "",
    country: "",
    description: "",
  });

  const [branding, setBranding] = useState({
    primaryColor: "#6366f1",
    logo: null as File | null,
    tagline: "",
    customDomain: "",
  });

  const [selectedProvider, setSelectedProvider] = useState("");
  
  const [payment, setPayment] = useState({
    plan: "professional",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    billingEmail: "",
  });

  const [launchOptions, setLaunchOptions] = useState({
    enableAnalytics: true,
    enableNotifications: true,
    goLiveNow: false,
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLaunch = async () => {
    setIsLoading(true);
    
    try {
      // Create store via API
      // Note: This is a placeholder - you may need to adjust based on your actual store creation flow
      const storeData = {
        name: profile.businessName || "My Store",
        businessName: profile.businessName,
        domain: branding.customDomain || undefined,
        subdomain: branding.customDomain ? undefined : profile.businessName.toLowerCase().replace(/\s+/g, ''),
        primaryColor: branding.primaryColor,
        tagline: branding.tagline,
      };

      // Mark onboarding steps as completed
      const completionDate = new Date().toISOString();
      markStepCompleted('store', completionDate);
      
      if (branding.customDomain) {
        markStepCompleted('domain', completionDate);
      }

      // Simulate store creation (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsLoading(false);
      toast({
        title: "🚀 Congratulations!",
        description: "Your eSIM store is now live. Welcome to eSIMLaunch!",
      });
      navigate("/dashboard");
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to create store. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ProfileStep profile={profile} setProfile={setProfile} />;
      case 2:
        return <BrandingStep branding={branding} setBranding={setBranding} />;
      case 3:
        return (
          <ProviderStep
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
          />
        );
      case 4:
        return <PaymentStep payment={payment} setPayment={setPayment} />;
      case 5:
        return (
          <LaunchStep
            launchOptions={launchOptions}
            setLaunchOptions={setLaunchOptions}
            profile={profile}
            branding={branding}
            selectedProvider={selectedProvider}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-24 pb-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">eSIMLaunch</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Set up your eSIM store</h1>
          <p className="text-muted-foreground">
            Complete these steps to launch your business
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-12">
              <motion.div
                className="h-full gradient-bg"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step Indicators */}
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center relative z-10"
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "gradient-bg text-primary-foreground"
                        : isCurrent
                        ? "gradient-bg text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-8 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button variant="gradient" onClick={handleNext} className="gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={handleLaunch}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Launch My Store
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Type definitions
interface ProfileData {
  businessName: string;
  website: string;
  phone: string;
  country: string;
  description: string;
}

// Step 1: Profile
const ProfileStep = ({
  profile,
  setProfile,
}: {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
      <p className="text-muted-foreground">
        This information will be used to set up your eSIM store.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          placeholder="Your Company"
          value={profile.businessName}
          onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          placeholder="https://yourcompany.com"
          value={profile.website}
          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          placeholder="+1 (555) 123-4567"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          placeholder="United States"
          value={profile.country}
          onChange={(e) => setProfile({ ...profile, country: e.target.value })}
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Business Description</Label>
      <Textarea
        id="description"
        placeholder="Tell us about your business and target customers..."
        rows={3}
        value={profile.description}
        onChange={(e) => setProfile({ ...profile, description: e.target.value })}
      />
    </div>
  </div>
);

interface BrandingData {
  primaryColor: string;
  logo: File | null;
  tagline: string;
  customDomain: string;
}

// Step 2: Branding
const BrandingStep = ({
  branding,
  setBranding,
}: {
  branding: BrandingData;
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>;
}) => {
  const [dnsExpanded, setDnsExpanded] = useState(false);

  const validateDomain = (domain: string): boolean => {
    if (!domain) return true; // Empty is valid (optional)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  };

  const isDomainValid = validateDomain(branding.customDomain);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customize your brand</h2>
        <p className="text-muted-foreground">
          Make your store reflect your unique identity.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Brand Color</Label>
            <div className="flex gap-3">
              <input
                type="color"
                id="primaryColor"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <Input
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              placeholder="Your catchy tagline..."
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDomain">
              Custom Domain <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="customDomain"
              placeholder="esim.yourcompany.com"
              value={branding.customDomain}
              onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
              className={cn(
                branding.customDomain && !isDomainValid && "border-destructive"
              )}
            />
            {branding.customDomain && !isDomainValid && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please enter a valid domain name (e.g., esim.yourcompany.com)
              </p>
            )}
            {branding.customDomain && isDomainValid && (
              <p className="text-xs text-muted-foreground">
                Enter your domain without http:// or https://
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo Upload</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop your logo here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
            <input type="file" className="hidden" accept="image/*" />
          </div>
        </div>
      </div>

    {/* DNS Instructions */}
    {branding.customDomain && isDomainValid && (
      <DNSInstructions
        domain={branding.customDomain}
        targetDomain="yourstore.esimlaunch.com"
        isExpanded={dnsExpanded}
        onToggle={() => setDnsExpanded(!dnsExpanded)}
      />
    )}

    {/* Preview */}
    <div className="p-6 rounded-xl bg-card border">
      <p className="text-sm text-muted-foreground mb-3">Preview</p>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: branding.primaryColor }}
        >
          {branding.tagline?.[0] || "E"}
        </div>
        <div>
          <p className="font-bold">Your eSIM Store</p>
          <p className="text-sm text-muted-foreground">
            {branding.tagline || "Your tagline appears here"}
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

// Step 3: Provider
const ProviderStep = ({
  selectedProvider,
  setSelectedProvider,
}: {
  selectedProvider: string;
  setSelectedProvider: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose your eSIM provider</h2>
      <p className="text-muted-foreground">
        Select the provider that best fits your business needs.
      </p>
    </div>

    <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
      <div className="grid md:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
              selectedProvider === provider.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedProvider(provider.id)}
          >
            {provider.popular && (
              <span className="absolute -top-2 right-4 px-2 py-0.5 text-xs font-medium rounded-full gradient-bg text-primary-foreground">
                Popular
              </span>
            )}
            <div className="flex items-start gap-3">
              <RadioGroupItem value={provider.id} id={provider.id} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={provider.id} className="text-base font-semibold cursor-pointer">
                  {provider.name}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {provider.description}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Wifi className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </RadioGroup>

    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
      <p className="text-sm">
        <span className="font-medium">💡 Pro tip:</span> You can connect multiple providers
        later from your dashboard settings.
      </p>
    </div>
  </div>
);

interface PaymentData {
  plan: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingEmail: string;
}

// Step 4: Payment
const PaymentStep = ({
  payment,
  setPayment,
}: {
  payment: PaymentData;
  setPayment: React.Dispatch<React.SetStateAction<PaymentData>>;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">Set up payment</h2>
      <p className="text-muted-foreground">
        Start your 14-day free trial. No charges until the trial ends.
      </p>
    </div>

    {/* Plan Selection */}
    <RadioGroup value={payment.plan} onValueChange={(val) => setPayment({ ...payment, plan: val })}>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { id: "starter", name: "Starter", price: "$49", features: ["1,000 eSIMs/mo", "Basic analytics"] },
          { id: "professional", name: "Professional", price: "$99", features: ["10,000 eSIMs/mo", "Advanced analytics"], recommended: true },
          { id: "enterprise", name: "Enterprise", price: "$299", features: ["Unlimited eSIMs", "Priority support"] },
        ].map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
              payment.plan === plan.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setPayment({ ...payment, plan: plan.id })}
          >
            {plan.recommended && (
              <span className="absolute -top-2 left-4 px-2 py-0.5 text-xs font-medium rounded-full gradient-bg text-primary-foreground">
                Recommended
              </span>
            )}
            <div className="flex items-start gap-3">
              <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
              <div>
                <Label htmlFor={plan.id} className="text-base font-semibold cursor-pointer">
                  {plan.name}
                </Label>
                <p className="text-2xl font-bold gradient-text mt-1">{plan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                <ul className="mt-2 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3 text-primary" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </RadioGroup>

    {/* Payment Details */}
    <div className="space-y-4">
      <h3 className="font-semibold">Payment Details</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            placeholder="4242 4242 4242 4242"
            value={payment.cardNumber}
            onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            placeholder="MM/YY"
            value={payment.expiryDate}
            onChange={(e) => setPayment({ ...payment, expiryDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            placeholder="123"
            value={payment.cvv}
            onChange={(e) => setPayment({ ...payment, cvv: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="billingEmail">Billing Email</Label>
          <Input
            id="billingEmail"
            placeholder="billing@company.com"
            value={payment.billingEmail}
            onChange={(e) => setPayment({ ...payment, billingEmail: e.target.value })}
          />
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CreditCard className="w-4 h-4" />
      <span>Secured by Stripe. Your payment information is encrypted.</span>
    </div>
  </div>
);

interface LaunchOptionsData {
  enableAnalytics: boolean;
  enableNotifications: boolean;
  goLiveNow: boolean;
}

// Step 5: Launch
const LaunchStep = ({
  launchOptions,
  setLaunchOptions,
  profile,
  branding,
  selectedProvider,
}: {
  launchOptions: LaunchOptionsData;
  setLaunchOptions: React.Dispatch<React.SetStateAction<LaunchOptionsData>>;
  profile: ProfileData;
  branding: BrandingData;
  selectedProvider: string;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">Ready to launch! 🚀</h2>
      <p className="text-muted-foreground">
        Review your settings and launch your eSIM store.
      </p>
    </div>

    {/* Summary */}
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-card border">
        <p className="text-sm text-muted-foreground mb-2">Business</p>
        <p className="font-semibold">{profile.businessName || "Not set"}</p>
        <p className="text-sm text-muted-foreground">{profile.country}</p>
      </div>
      <div className="p-4 rounded-xl bg-card border">
        <p className="text-sm text-muted-foreground mb-2">Brand</p>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: branding.primaryColor }}
          />
          <span className="font-semibold">{branding.tagline || "No tagline"}</span>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-card border">
        <p className="text-sm text-muted-foreground mb-2">Provider</p>
        <p className="font-semibold capitalize">{selectedProvider || "Not selected"}</p>
      </div>
      <div className="p-4 rounded-xl bg-card border">
        <p className="text-sm text-muted-foreground mb-2">Plan</p>
        <p className="font-semibold">14-day free trial</p>
      </div>
    </div>

    {/* Launch Options */}
    <div className="space-y-4">
      <h3 className="font-semibold">Launch Options</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div>
            <p className="font-medium">Enable Analytics</p>
            <p className="text-sm text-muted-foreground">Track sales and customer behavior</p>
          </div>
          <Checkbox
            checked={launchOptions.enableAnalytics}
            onCheckedChange={(checked) =>
              setLaunchOptions({ ...launchOptions, enableAnalytics: checked === true })
            }
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Get notified about new orders</p>
          </div>
          <Checkbox
            checked={launchOptions.enableNotifications}
            onCheckedChange={(checked) =>
              setLaunchOptions({ ...launchOptions, enableNotifications: checked === true })
            }
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div>
            <p className="font-medium">Go Live Immediately</p>
            <p className="text-sm text-muted-foreground">Make your store public right away</p>
          </div>
          <Checkbox
            checked={launchOptions.goLiveNow}
            onCheckedChange={(checked) =>
              setLaunchOptions({ ...launchOptions, goLiveNow: checked === true })
            }
          />
        </div>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-center">
      <Rocket className="w-8 h-8 mx-auto mb-2 text-primary" />
      <p className="font-semibold">You're all set!</p>
      <p className="text-sm text-muted-foreground">
        Click "Launch My Store" to start your journey.
      </p>
    </div>
  </div>
);

export default Onboarding;
