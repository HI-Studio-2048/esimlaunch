import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DNSInstructions } from "@/components/shared/DNSInstructions";
import { markStepCompleted, getOnboardingProgress, updateOnboardingProgress } from "@/lib/onboardingProgress";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
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
  Sparkles,
  Code2,
} from "lucide-react";
import { TemplatePicker, ColorPicker } from "@/components/store/TemplatePicker";
import { COLOR_PRESETS, STORE_TEMPLATES, type ColorPreset } from "@/lib/storeTemplates";
import type { TemplateKey } from "@/hooks/usePublicStore";

// Steps for Easy Way (done-for-you store)
const easyWaySteps = [
  { id: 0, name: "Service Type", icon: Sparkles },
  { id: 1, name: "Business Info", icon: User },
  { id: 2, name: "Design", icon: Palette },
  { id: 3, name: "Choose Plan", icon: CreditCard },
  { id: 4, name: "All Set!", icon: Rocket },
];

// Steps for Advanced (just service type selection)
const advancedSteps = [
  { id: 0, name: "Service Type", icon: Sparkles },
];


const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setConfig } = useDemoStore();
  const { user, setUser } = useAuth();

  // Check if onboarding is already completed; allow resuming from last step if skipped
  useEffect(() => {
    const progress = getOnboardingProgress();
    if (progress.store) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (progress.lastStepReached != null && progress.lastStepReached > 0) {
      setCurrentStep(progress.lastStepReached);
    }
  }, [navigate]);

  // Form states
  const [profile, setProfile] = useState({
    businessName: "",
    website: "",
    phone: "",
    country: "",
    description: "",
  });

  const [payment, setPayment] = useState<PaymentData>({
    plan: "growth",
    billingPeriod: "monthly",
    paymentMethodId: undefined,
    billingEmail: "",
  });

  const [serviceType, setServiceType] = useState<'EASY' | 'ADVANCED' | null>(null);

  // Design step state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>('default');
  const [selectedColorPreset, setSelectedColorPreset] = useState<ColorPreset | null>(COLOR_PRESETS[0]);
  const [customColors, setCustomColors] = useState({
    primary: COLOR_PRESETS[0].primary,
    secondary: COLOR_PRESETS[0].secondary,
    accent: COLOR_PRESETS[0].accent,
  });

  // Load current service type from user
  useEffect(() => {
    if (user?.serviceType) {
      setServiceType(user.serviceType);
    }
  }, [user]);

  const handleNext = async () => {
    // If on step 0 (service type selection), update the merchant's service type
    if (currentStep === 0 && serviceType) {
      try {
        setIsLoading(true);
        const updatedMerchant = await apiClient.updateProfile(undefined, undefined, { serviceType });
        // Update user context with new service type
        if (setUser && updatedMerchant && user) {
          setUser({ ...user, serviceType: updatedMerchant.serviceType || serviceType });
        }
        setIsLoading(false);
        
        // If Advanced is selected, redirect to dashboard (no store builder needed)
        if (serviceType === 'ADVANCED') {
          toast({
            title: "Welcome to Advanced Mode!",
            description: "You now have full API access. Redirecting to your dashboard...",
          });
          navigate("/dashboard", { replace: true });
          return;
        }
        
        // If Easy Way is selected, continue to store builder steps
        setCurrentStep(1);
        return;
      } catch (error: any) {
        setIsLoading(false);
        toast({
          title: "Error",
          description: error?.errorMessage || error?.message || "Failed to update service type. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    updateOnboardingProgress({ lastStepReached: currentStep });
    toast({
      title: "Onboarding paused",
      description: "You can complete setup anytime by visiting the onboarding page again.",
    });
    navigate("/dashboard", { replace: true });
  };

  const handleLaunch = async () => {
    setIsLoading(true);

    try {
      // Create a basic store record so the merchant has an account to manage
      const subdomain = profile.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
      const storeData = {
        name: profile.businessName || "My Store",
        businessName: profile.businessName,
        subdomain: subdomain || undefined,
        primaryColor: customColors.primary,
        secondaryColor: customColors.secondary,
        accentColor: customColors.accent,
        selectedPackages: [],
        pricingMarkup: {},
        templateKey: (selectedTemplate || "default") as "bold" | "default" | "minimal" | "travel",
      };

      // Create Stripe subscription for the selected plan
      try {
        await apiClient.createSubscription({
          plan: (payment.plan as 'starter' | 'growth' | 'scale') || 'growth',
          billingPeriod: payment.billingPeriod || 'monthly',
          paymentMethodId: payment.paymentMethodId,
        });
        markStepCompleted('subscription', new Date().toISOString());
      } catch (subError: any) {
        console.warn('Subscription creation skipped:', subError?.message);
      }

      // Call API to create store record
      const createdStore = await apiClient.createStore(storeData);

      const completionDate = new Date().toISOString();
      markStepCompleted('store', completionDate);
      localStorage.setItem('user_plan', payment.plan);

      if (createdStore?.id) {
        localStorage.setItem('current_store_id', createdStore.id);
      }

      // Save basic config to context
      setConfig({
        businessName: profile.businessName || "Your eSIM Store",
        primaryColor: customColors.primary,
        secondaryColor: customColors.secondary,
        accentColor: customColors.accent,
        logo: null,
      });

      setIsLoading(false);
      setCurrentStep(4); // Go to confirmation step
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error?.message || error?.errorMessage || "Failed to submit. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Store request error:", error);
    }
  };

  const renderStepContent = () => {
    // Only show store builder steps if user selected Easy Way
    // If they're on step 0, they're selecting service type
    // If they selected Advanced, they should have been redirected already
    if (serviceType === 'ADVANCED' && currentStep > 0) {
      // This shouldn't happen, but just in case, redirect
      navigate("/dashboard", { replace: true });
      return null;
    }

    switch (currentStep) {
      case 0:
        return <ServiceTypeStep serviceType={serviceType} setServiceType={setServiceType} />;
      case 1:
        return <ProfileStep profile={profile} setProfile={setProfile} />;
      case 2:
        return (
          <DesignStep
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            selectedColorPreset={selectedColorPreset}
            setSelectedColorPreset={setSelectedColorPreset}
            customColors={customColors}
            setCustomColors={setCustomColors}
          />
        );
      case 3:
        return <PaymentStep payment={payment} setPayment={setPayment} isLoading={isLoading} setIsLoading={setIsLoading} />;
      case 4:
        return <ConfirmationStep businessName={profile.businessName} selectedTemplate={selectedTemplate} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-4 pb-12">
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
                animate={{
                  width: serviceType === 'ADVANCED'
                    ? "100%"
                    : `${(Math.min(currentStep, 3) / 3) * 100}%`
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step Indicators */}
            {(serviceType === 'ADVANCED' ? advancedSteps : easyWaySteps).map((step, index) => {
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
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || currentStep === 4}
            className={cn("gap-2", currentStep === 4 && "invisible")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Skip button - only on Easy Way steps 1-3 */}
          {serviceType === "EASY" && currentStep >= 1 && currentStep <= 3 && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              variant="gradient"
              onClick={handleNext}
              className="gap-2"
              disabled={isLoading || (currentStep === 0 && !serviceType)}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  {currentStep === 0 && serviceType === 'ADVANCED' ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </>
              )}
            </Button>
          ) : currentStep === 3 ? (
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
                  Submit Request
                </>
              )}
            </Button>
          ) : (
            // Step 4: confirmation — "Go to Dashboard" button
            <Button
              variant="gradient"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
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

// Step 0: Service Type Selection
const ServiceTypeStep = ({
  serviceType,
  setServiceType,
}: {
  serviceType: 'EASY' | 'ADVANCED' | null;
  setServiceType: React.Dispatch<React.SetStateAction<'EASY' | 'ADVANCED' | null>>;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose your service type</h2>
      <p className="text-muted-foreground">
        Select how you want to use eSIMLaunch. You can change this later.
      </p>
    </div>

    <RadioGroup value={serviceType || ''} onValueChange={(val) => setServiceType(val as 'EASY' | 'ADVANCED')}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Easy Way Option */}
        <div
          className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
            serviceType === 'EASY'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => setServiceType('EASY')}
        >
          <div className="flex items-start gap-4">
            <RadioGroupItem value="EASY" id="easy" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <Label htmlFor="easy" className="text-xl font-semibold cursor-pointer">
                  Easy Way
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Done-for-you — our team builds and deploys your store, you just manage it
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Store built and deployed by our team</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Custom branding and domain setup included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>You control pricing, packages and support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Automatic order processing and eSIM delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No coding or technical setup needed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Advanced Option */}
        <div
          className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
            serviceType === 'ADVANCED'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => setServiceType('ADVANCED')}
        >
          <div className="flex items-start gap-4">
            <RadioGroupItem value="ADVANCED" id="advanced" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-5 h-5 text-primary" />
                <Label htmlFor="advanced" className="text-xl font-semibold cursor-pointer">
                  Advanced
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Full API access for custom integrations and workflows
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>RESTful API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Webhook support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Full control over order flow</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Developer-friendly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RadioGroup>

    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
      <p className="text-sm">
        <span className="font-medium">💡 Note:</span>{" "}
        {serviceType === 'EASY'
          ? "Easy Way is done-for-you. After you complete these steps, our team will build and deploy your store. You'll manage pricing, packages, and support from your dashboard."
          : serviceType === 'ADVANCED'
          ? "Advanced mode gives you full API access. After selecting this, you'll be redirected to your dashboard where you can set up API keys and start building custom integrations."
          : "Select a service type to continue."}
      </p>
    </div>
  </div>
);

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
  selectedPlan,
  businessName,
}: {
  branding: BrandingData;
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>;
  selectedPlan?: string;
  businessName?: string;
}) => {
  const [dnsExpanded, setDnsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateDomain = (domain: string): boolean => {
    if (!domain) return true; // Empty is valid (optional)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  };

  const isDomainValid = validateDomain(branding.customDomain);
  
  // Check if custom domain is allowed (only for Scale plan)
  const isCustomDomainAllowed = selectedPlan === "scale" || selectedPlan === "enterprise";
  const planName = selectedPlan === "scale" || selectedPlan === "enterprise" ? "Scale" : 
                   selectedPlan === "growth" || selectedPlan === "professional" ? "Growth" : "Starter";

  const handleFileSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setBranding({ ...branding, logo: file });
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

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
            {!isCustomDomainAllowed ? (
              <div className="space-y-2">
                <Input
                  id="customDomain"
                  placeholder="esim.yourcompany.com"
                  value=""
                  disabled
                  className="opacity-50 cursor-not-allowed"
                />
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Custom domains are only available on the <strong>Scale</strong> plan. 
                      Your {planName} plan includes a free subdomain: <strong>{(businessName?.toLowerCase().replace(/\s+/g, '') || 'yourstore')}.esimlaunch.com</strong>
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo Upload</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileInputChange}
            />
            {logoPreview || branding.logo ? (
              <div className="space-y-2">
                <img
                  src={logoPreview || (branding.logo ? URL.createObjectURL(branding.logo) : "")}
                  alt="Logo preview"
                  className="h-20 mx-auto object-contain"
                />
                <p className="text-xs text-muted-foreground">
                  {branding.logo?.name || "Logo uploaded"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBranding({ ...branding, logo: null });
                    setLogoPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop your logo here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </>
            )}
          </div>
        </div>
      </div>

    {/* DNS Instructions */}
    {branding.customDomain && isDomainValid && (
      <DNSInstructions
        domain={branding.customDomain}
        targetDomain="esimlaunch.com" // Custom domains point to esimlaunch.com (where stores are hosted)
        isExpanded={dnsExpanded}
        onToggle={() => setDnsExpanded(!dnsExpanded)}
      />
    )}

    {/* Preview */}
    <div className="p-6 rounded-xl bg-card border">
      <p className="text-sm text-muted-foreground mb-3">Preview</p>
      <div className="flex items-center gap-3">
        {logoPreview || branding.logo ? (
          <img
            src={logoPreview || (branding.logo ? URL.createObjectURL(branding.logo) : "")}
            alt="Logo"
            className="w-12 h-12 rounded-xl object-contain"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.tagline?.[0] || "E"}
          </div>
        )}
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

// Step 3: Provider Info (informational only — eSIMAccess is the only provider)
const ProviderStep = ({
  selectedProvider,
  setSelectedProvider,
}: {
  selectedProvider: string;
  setSelectedProvider: React.Dispatch<React.SetStateAction<string>>;
}) => {
  useEffect(() => {
    if (selectedProvider !== "esimaccess") {
      setSelectedProvider("esimaccess");
    }
  }, [selectedProvider, setSelectedProvider]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Powered by eSIMAccess</h2>
        <p className="text-muted-foreground">
          Your store is fully connected to eSIMAccess — a leading global eSIM provider.
        </p>
      </div>

      <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-white shadow flex items-center justify-center p-2">
            <Wifi className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">eSIMAccess</h3>
            <p className="text-sm text-muted-foreground">Your eSIM backend provider</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "Countries covered", value: "150+" },
            { label: "Networks", value: "600+" },
            { label: "Activation", value: "Instant" },
          ].map(item => (
            <div key={item.label} className="bg-white/60 dark:bg-background/40 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-primary">{item.value}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted border border-border">
        <p className="text-sm">
          <span className="font-medium">✅ All set:</span> Your store automatically uses eSIMAccess for all eSIM orders. No additional configuration needed.
        </p>
      </div>
    </div>
  );
};

interface PaymentData {
  plan: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethodId?: string;
  billingEmail: string;
}

// Inner payment form using Stripe CardElement
const StripeCardForm = ({
  onPaymentMethodCreated,
  isLoading,
  setIsLoading,
}: {
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setIsLoading(true);
    try {
      const siData = await apiClient.createSetupIntent();
      const clientSecret = siData.clientSecret;

      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (error) {
        toast({ title: "Card error", description: error.message, variant: "destructive" });
      } else if (setupIntent?.payment_method) {
        onPaymentMethodCreated(setupIntent.payment_method as string);
        toast({ title: "Card saved", description: "Your payment method has been saved." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save card", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg p-3 bg-background">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#374151' } } }} />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleConfirm} disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Card"}
      </Button>
    </div>
  );
};

// Step 4: Payment
const PaymentStep = ({
  payment,
  setPayment,
  isLoading,
  setIsLoading,
}: {
  payment: PaymentData;
  setPayment: React.Dispatch<React.SetStateAction<PaymentData>>;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}) => {
  const isYearly = payment.billingPeriod === 'yearly';
  const samplePlan = PLANS[0];
  const annualCost = samplePlan.monthlyPrice * 12;
  const savingsPercent = Math.round(((annualCost - samplePlan.yearlyPrice) / annualCost) * 100);

  return (
  <Elements stripe={getStripe()}>
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
          7-day free trial · No charges until it ends
        </div>
        <h2 className="text-2xl font-bold mb-2">Set up payment to start your free trial</h2>
        <p className="text-muted-foreground">
          Choose your plan and add a card now so your store can stay live after the trial. You won&apos;t be billed today.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={cn("text-sm font-medium", !isYearly && "text-foreground", isYearly && "text-muted-foreground")}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={(checked) => setPayment({ ...payment, billingPeriod: checked ? 'yearly' : 'monthly' })}
        />
        <span className={cn("text-sm font-medium", isYearly && "text-foreground", !isYearly && "text-muted-foreground")}>
          Yearly
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full gradient-bg text-primary-foreground">
            Save {savingsPercent}%
          </span>
        </span>
      </div>

      {/* Plan Selection */}
      <RadioGroup value={payment.plan} onValueChange={(val) => setPayment({ ...payment, plan: val })}>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.filter((plan) => !plan.hiddenFromPublic).map((plan) => (
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
                  <p className="text-2xl font-bold gradient-text mt-1">
                    ${isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                    <span className="text-sm text-muted-foreground font-normal">/mo</span>
                  </p>
                  {isYearly && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Billed annually (${plan.yearlyPrice}/year)
                    </p>
                  )}
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

        <div className="space-y-2">
          <Label htmlFor="billingEmail">Billing Email</Label>
          <Input
            id="billingEmail"
            type="email"
            placeholder="billing@company.com"
            value={payment.billingEmail}
            onChange={(e) => setPayment({ ...payment, billingEmail: e.target.value })}
          />
        </div>

        {payment.paymentMethodId ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
            <Check className="h-4 w-4" />
            Payment method saved. You can proceed.
          </div>
        ) : (
          <StripeCardForm
            onPaymentMethodCreated={(id) => setPayment({ ...payment, paymentMethodId: id })}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CreditCard className="w-4 h-4" />
        <span>Secured by Stripe. Your payment information is encrypted.</span>
      </div>
    </div>
  </Elements>
  );
};

interface LaunchOptionsData {
  enableAnalytics: boolean;
  enableNotifications: boolean;
  goLiveNow: boolean;
}

// Step 6: Launch (template already chosen in previous step)
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
        <p className="font-semibold">7-day free trial</p>
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

// Step 2: Design — template + color selection
const DesignStep = ({
  selectedTemplate,
  setSelectedTemplate,
  selectedColorPreset,
  setSelectedColorPreset,
  customColors,
  setCustomColors,
}: {
  selectedTemplate: TemplateKey | null;
  setSelectedTemplate: (key: TemplateKey) => void;
  selectedColorPreset: ColorPreset | null;
  setSelectedColorPreset: (preset: ColorPreset | null) => void;
  customColors: { primary: string; secondary: string; accent: string };
  setCustomColors: React.Dispatch<React.SetStateAction<{ primary: string; secondary: string; accent: string }>>;
}) => (
  <div className="space-y-8">
    <TemplatePicker
      value={selectedTemplate}
      onChange={setSelectedTemplate}
      showScheduleCall={false}
    />

    <div className="border-t pt-6">
      <ColorPicker
        selectedPreset={selectedColorPreset}
        customPrimary={customColors.primary}
        customSecondary={customColors.secondary}
        customAccent={customColors.accent}
        onPresetSelect={(preset) => {
          setSelectedColorPreset(preset);
          setCustomColors({ primary: preset.primary, secondary: preset.secondary, accent: preset.accent });
        }}
        onCustomChange={(field, value) => {
          setSelectedColorPreset(null);
          setCustomColors((prev) => ({ ...prev, [field]: value }));
        }}
      />
    </div>
  </div>
);

// Step 4: Confirmation — shown after request submitted
const ConfirmationStep = ({ businessName, selectedTemplate }: { businessName: string; selectedTemplate: TemplateKey | null }) => {
  const templateName = STORE_TEMPLATES.find(t => t.key === selectedTemplate)?.name ?? 'Classic';
  return (
  <div className="space-y-6 text-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center">
        <Rocket className="w-10 h-10 text-primary-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Request submitted!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thanks{businessName ? `, ${businessName}` : ""}! Our team has received your request and will build your store using the <strong>{templateName}</strong> template with your chosen colors. We'll reach out via email within <strong>1–2 business days</strong> to confirm details and provide your store link.
        </p>
      </div>
    </div>

    <div className="grid sm:grid-cols-3 gap-4 text-left">
      {[
        {
          step: "1",
          title: "Team review",
          desc: "We review your business info and plan selection",
        },
        {
          step: "2",
          title: "Store built",
          desc: "We build, brand, and deploy your store on esimlaunch.com",
        },
        {
          step: "3",
          title: "You go live",
          desc: "We hand over your store link — you manage everything from the dashboard",
        },
      ].map((item) => (
        <div key={item.step} className="p-4 rounded-xl border bg-card text-left">
          <div className="w-8 h-8 rounded-full gradient-bg text-primary-foreground text-sm font-bold flex items-center justify-center mb-3">
            {item.step}
          </div>
          <p className="font-semibold text-sm mb-1">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.desc}</p>
        </div>
      ))}
    </div>

    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-left">
      <p className="text-sm">
        <span className="font-medium">While you wait:</span> Head to your dashboard to select the eSIM packages you want to sell and configure your pricing. This helps us set up your store faster.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href="mailto:support@esimlaunch.com?subject=Easy Way Store Build"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
      >
        Questions? Email us at support@esimlaunch.com
      </a>
    </div>
  </div>
);
};

export default Onboarding;
