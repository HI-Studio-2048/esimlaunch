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
import { useToast } from "@/hooks/use-toast";
import { DNSInstructions } from "@/components/shared/DNSInstructions";
import { markStepCompleted, getOnboardingProgress } from "@/lib/onboardingProgress";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
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

// Steps for Easy Way (store builder)
const easyWaySteps = [
  { id: 0, name: "Service Type", icon: Sparkles },
  { id: 1, name: "Profile", icon: User },
  { id: 2, name: "Branding", icon: Palette },
  { id: 3, name: "Provider", icon: Wifi },
  { id: 4, name: "Payment", icon: CreditCard },
  { id: 5, name: "Launch", icon: Rocket },
];

// Steps for Advanced (just service type selection)
const advancedSteps = [
  { id: 0, name: "Service Type", icon: Sparkles },
];

const providers = [
  { 
    id: "esimaccess", 
    name: "eSIMAccess", 
    description: "Your eSIM provider", 
    popular: false,
    logo: "https://i0.wp.com/esimaccess.com/wp-content/uploads/2023/05/esimaccess.png?fit=768%2C215&ssl=1"
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setConfig } = useDemoStore();
  const { user, setUser } = useAuth();

  // Check if onboarding is already completed
  useEffect(() => {
    const progress = getOnboardingProgress();
    if (progress.store) {
      // Store setup is already completed, redirect to store preview
      navigate("/store-preview", { replace: true });
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

  const [branding, setBranding] = useState({
    primaryColor: "#6366f1",
    logo: null as File | null,
    tagline: "",
    customDomain: "",
  });

  const [selectedProvider, setSelectedProvider] = useState("");
  
  const [payment, setPayment] = useState({
    plan: "growth", // Default to Growth plan
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

  const [serviceType, setServiceType] = useState<'EASY' | 'ADVANCED' | null>(null);

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
        const updatedMerchant = await apiClient.updateProfile(undefined, undefined, serviceType);
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
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLaunch = async () => {
    setIsLoading(true);
    
    try {
      // Convert logo file to data URL if present
      let logoDataUrl: string | null = null;
      if (branding.logo) {
        logoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(branding.logo!);
        });
      }

      // Create store via API
      const storeData = {
        name: profile.businessName || "My Store",
        businessName: profile.businessName,
        domain: branding.customDomain || undefined,
        subdomain: branding.customDomain ? undefined : profile.businessName.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
        primaryColor: branding.primaryColor,
        secondaryColor: "#8b5cf6",
        accentColor: "#22c55e",
        logoUrl: logoDataUrl || undefined,
        selectedPackages: [], // Will be populated when package selection is implemented
        pricingMarkup: {}, // Will be populated when pricing config is implemented
      };

      // Call API to create store
      const createdStore = await apiClient.createStore(storeData);

      // Mark onboarding steps as completed
      const completionDate = new Date().toISOString();
      markStepCompleted('store', completionDate);
      
      // Save selected plan to localStorage
      localStorage.setItem('user_plan', payment.plan);
      
      // Store the created store ID
      if (createdStore?.id) {
        localStorage.setItem('current_store_id', createdStore.id);
      }
      
      if (branding.customDomain) {
        markStepCompleted('domain', completionDate);
      }

      // Save branding to DemoStoreContext for store preview
      const storeConfig = {
        businessName: profile.businessName || "Your eSIM Store",
        primaryColor: branding.primaryColor,
        secondaryColor: createdStore.secondaryColor || "#8b5cf6",
        accentColor: createdStore.accentColor || "#22c55e",
        logo: logoDataUrl || createdStore.logoUrl || null,
      };
      setConfig(storeConfig);
      
      // Also save to localStorage for persistence
      try {
        localStorage.setItem('esimlaunch_store_config', JSON.stringify(storeConfig));
      } catch (error) {
        console.error('Failed to save store config to localStorage:', error);
      }
      
      setIsLoading(false);
      toast({
        title: "🚀 Congratulations!",
        description: `Your eSIM store "${createdStore?.name || profile.businessName}" has been created successfully!`,
      });
      navigate("/store-preview");
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error?.message || error?.errorMessage || "Failed to create store. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Store creation error:", error);
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
        return <BrandingStep branding={branding} setBranding={setBranding} selectedPlan={payment.plan} businessName={profile.businessName} />;
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
                animate={{ 
                  width: serviceType === 'ADVANCED' 
                    ? "100%" // Advanced only has one step
                    : `${(currentStep / (easyWaySteps.length - 1)) * 100}%`
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
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 5 ? (
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
                Fully managed store builder - perfect for getting started quickly
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Visual store builder with drag-and-drop</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Pre-built templates and themes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Automatic order processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Built-in analytics dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No coding required</span>
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
          ? "Easy Way includes the store builder feature. You'll be able to create and customize your store in the next steps."
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
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center p-2">
                {provider.logo ? (
                  <img 
                    src={provider.logo} 
                    alt={provider.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Wifi className="w-6 h-6 text-muted-foreground" />
                )}
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
          { id: "starter", name: "Starter", price: "$29", features: ["Up to 100 orders/month", "Basic analytics"] },
          { id: "growth", name: "Growth", price: "$79", features: ["Up to 1,000 orders/month", "Advanced analytics"], recommended: true },
          { id: "scale", name: "Scale", price: "$199", features: ["Unlimited orders", "Custom domains"] },
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
