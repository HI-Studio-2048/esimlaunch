import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
// ClerkProvider moved to main.tsx per Clerk's React (Vite) guidelines
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { CookieBanner } from "@/components/CookieBanner";
import { DemoStoreProvider } from "@/contexts/DemoStoreContext";
import { DemoStoreLayout } from "@/components/demo-store/DemoStoreLayout";
import { DemoStoreByIdLoader } from "@/components/demo-store/DemoStoreByIdLoader";
import { SubdomainStoreLoader } from "@/components/demo-store/SubdomainStoreLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClerkAuthSync } from "@/components/ClerkAuthSync";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index"; // eager: hero / first paint
import Login from "./pages/Login"; // eager: frequently the entry point
import Signup from "./pages/Signup"; // eager: referral deep-links land here
import NotFound from "./pages/NotFound"; // eager: tiny + default fallback

// All other routes are code-split via React.lazy so the main bundle only
// contains the landing/auth shell. Each lazy import becomes its own JS chunk
// that downloads on first navigation to that route.
const Pricing = lazy(() => import("./pages/Pricing"));
const Features = lazy(() => import("./pages/Features"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const APIDocs = lazy(() => import("./pages/APIDocs"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Status = lazy(() => import("./pages/Status"));
const ROICalculator = lazy(() => import("./pages/ROICalculator"));
const CurrentPrices = lazy(() => import("./pages/CurrentPrices"));
const Demo = lazy(() => import("./pages/Demo"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Changelog = lazy(() => import("./pages/Changelog"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const PackageSelector = lazy(() => import("./pages/PackageSelector"));
const PricingConfig = lazy(() => import("./pages/PricingConfig"));
const WebhookSettings = lazy(() => import("./pages/WebhookSettings"));
const DomainVerification = lazy(() => import("./pages/DomainVerification"));
const CustomerLogin = lazy(() => import("./pages/customer/Login"));
const CustomerSignup = lazy(() => import("./pages/customer/Signup"));
const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"));
const Billing = lazy(() => import("./pages/Billing"));
const CreateSupportTicket = lazy(() => import("./pages/CreateSupportTicket"));
const SupportTicket = lazy(() => import("./pages/SupportTicket"));
const SupportDashboard = lazy(() => import("./pages/SupportDashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CurrencySettings = lazy(() => import("./pages/CurrencySettings"));
const SEOSettings = lazy(() => import("./pages/SEOSettings"));
const EmailTemplates = lazy(() => import("./pages/EmailTemplates"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"));
const Settings = lazy(() => import("./pages/Settings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const SSOCallback = lazy(() => import("./pages/SSOCallback"));
const StorePreview = lazy(() => import("./pages/StorePreview"));
import { PublicStoreInvalidationProvider } from "@/contexts/PublicStoreInvalidationContext";
const PackageBrowser = lazy(() => import("./pages/PackageBrowser"));
const CreateOrder = lazy(() => import("./pages/CreateOrder"));
const ProfileManagement = lazy(() => import("./pages/ProfileManagement"));
const Balance = lazy(() => import("./pages/Balance"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const TopUpsPage = lazy(() => import("./pages/TopUpsPage"));
const PaymentSettings = lazy(() => import("./pages/PaymentSettings"));
const Developer = lazy(() => import("./pages/Developer"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMerchants = lazy(() => import("@/pages/AdminMerchants"));
const AdminMerchantDetail = lazy(() => import("@/pages/AdminMerchantDetail"));
const AdminStoreDetail = lazy(() => import("@/pages/AdminStoreDetail"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const TemplateGallery = lazy(() => import("./pages/TemplateGallery"));
const DemoStoreHome = lazy(() => import("./pages/demo-store/DemoStoreHome"));
const DemoStoreDestinations = lazy(() => import("./pages/demo-store/DemoStoreDestinations"));
const DemoStoreCountry = lazy(() => import("./pages/demo-store/DemoStoreCountry"));
const DemoStoreCheckout = lazy(() => import("./pages/demo-store/DemoStoreCheckout"));
const DemoStoreAbout = lazy(() => import("./pages/demo-store/DemoStoreAbout"));
const DemoStoreContact = lazy(() => import("./pages/demo-store/DemoStoreContact"));
const DemoStoreHelpCenter = lazy(() => import("./pages/demo-store/DemoStoreHelpCenter"));
const DemoStoreSetupGuide = lazy(() => import("./pages/demo-store/DemoStoreSetupGuide"));
const DemoStoreFAQ = lazy(() => import("./pages/demo-store/DemoStoreFAQ"));
const DemoStorePress = lazy(() => import("./pages/demo-store/DemoStorePress"));
const DemoStorePartners = lazy(() => import("./pages/demo-store/DemoStorePartners"));
const DemoStoreTerms = lazy(() => import("./pages/demo-store/DemoStoreTerms"));
const DemoStorePrivacy = lazy(() => import("./pages/demo-store/DemoStorePrivacy"));
const DemoStoreCookies = lazy(() => import("./pages/demo-store/DemoStoreCookies"));
const DemoStoreRefundPolicy = lazy(() => import("./pages/demo-store/DemoStoreRefundPolicy"));

// Minimal fallback while a route chunk is downloading. Keeps the viewport
// height so there's no layout collapse mid-navigation.
const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

// Determines whether the current path should show the dashboard sidebar
const isDashboardPath = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/settings") ||
  pathname === "/package-selector" ||
  pathname === "/pricing-config" ||
  pathname === "/store-preview" ||
  pathname === "/admin" ||
  pathname.startsWith("/admin/") ||
  pathname.startsWith("/stores/");

// Main shell – renders Navbar + optional sidebar + content + optional footer
const MainShell = () => {
  const location = useLocation();
  const inDashboard = isDashboardPath(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div
        className={cn(
          "flex-1 pt-16 md:pt-20",
          inDashboard ? "flex" : ""
        )}
      >
        {inDashboard && <DashboardSidebar />}
        <main className={cn(inDashboard ? "flex-1 min-w-0" : "flex-1")}>
          <Routes>
            {/* All main app routes */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/templates" element={<TemplateGallery />} />
                <Route path="/features" element={<Features />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/api-docs" element={<APIDocs />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/status" element={<Status />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/merchants"
                  element={
                    <ProtectedRoute>
                      <AdminMerchants />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/merchants/:merchantId"
                  element={
                    <ProtectedRoute>
                      <AdminMerchantDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/stores/:storeId"
                  element={
                    <ProtectedRoute>
                      <AdminStoreDetail />
                    </ProtectedRoute>
                  }
                />
                <Route path="/roi-calculator" element={<ROICalculator />} />
                <Route path="/current-prices" element={<CurrentPrices />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/case-studies" element={<CaseStudies />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/sso-callback" element={<SSOCallback />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-tracking" element={<OrderTracking />} />
                <Route path="/package-selector" element={<PackageSelector />} />
                <Route path="/pricing-config" element={<PricingConfig />} />
                <Route path="/customer/login" element={<CustomerLogin />} />
                <Route path="/customer/signup" element={<CustomerSignup />} />
                <Route path="/support/create" element={<CreateSupportTicket />} />
                <Route path="/support/tickets/:ticketId" element={<SupportTicket />} />
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route 
                  path="/2fa/setup" 
                  element={
                    <ProtectedRoute>
                      <TwoFactorSetup />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/webhooks" 
                  element={
                    <ProtectedRoute>
                      <WebhookSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/billing" 
                  element={
                    <ProtectedRoute>
                      <Billing />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/support" 
                  element={
                    <ProtectedRoute>
                      <SupportDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/support/tickets/:ticketId" 
                  element={
                    <ProtectedRoute>
                      <SupportTicket />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/analytics" 
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/stores/:storeId/currency" 
                  element={
                    <ProtectedRoute>
                      <CurrencySettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/stores/:storeId/seo" 
                  element={
                    <ProtectedRoute>
                      <SEOSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/email-templates" 
                  element={
                    <ProtectedRoute>
                      <EmailTemplates />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/affiliates" 
                  element={
                    <ProtectedRoute>
                      <AffiliateDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/packages" 
                  element={
                    <ProtectedRoute>
                      <PackageBrowser />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/create-order" 
                  element={
                    <ProtectedRoute>
                      <CreateOrder />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/profiles" 
                  element={
                    <ProtectedRoute>
                      <ProfileManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/balance" 
                  element={
                    <ProtectedRoute>
                      <Balance />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/orders" 
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/customers" 
                  element={
                    <ProtectedRoute>
                      <CustomersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/topups" 
                  element={
                    <ProtectedRoute>
                      <TopUpsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/payment-settings" 
                  element={
                    <ProtectedRoute>
                      <PaymentSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/developer" 
                  element={
                    <ProtectedRoute>
                      <Developer />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/stores/:storeId/domain" 
                  element={
                    <ProtectedRoute>
                      <DomainVerification />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/onboarding" 
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/store-preview" 
                  element={
                    <ProtectedRoute>
                      <StorePreview />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      {!inDashboard && <Footer />}
      <CookieBanner />
    </div>
  );
};

/**
 * If the user visits *.esimlaunch.com (a merchant subdomain), redirect to /store/:subdomain/*
 * so the SubdomainStoreLoader can pick up the correct store.
 * This is a no-op in local dev (localhost) and on www.esimlaunch.com.
 */
function SubdomainRedirect() {
  const hostname = window.location.hostname;
  const isEsimlaunchSubdomain =
    hostname.endsWith(".esimlaunch.com") &&
    hostname !== "esimlaunch.com" &&
    !hostname.startsWith("www.");

  if (!isEsimlaunchSubdomain) return null;

  const sub = hostname.replace(/\.esimlaunch\.com$/, "");
  const path = window.location.pathname;
  // Avoid redirect loop if already under /store/:sub
  if (path.startsWith(`/store/${sub}`)) return null;

  // Strip any leading slash and reconstruct under /store/:sub
  const rest = path === "/" ? "" : path;
  const search = window.location.search;
  return <Navigate to={`/store/${sub}${rest}${search}`} replace />;
}

// Shared routes component
const AppRoutes = () => (
  <>
    <SubdomainRedirect />
    <ScrollToTop />
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Demo Store Routes - load store from API when storeId exists, then show layout */}
      <Route path="/demo-store" element={<DemoStoreByIdLoader />}>
        <Route index element={<DemoStoreHome />} />
        <Route path="destinations" element={<DemoStoreDestinations />} />
        <Route path="country/:countrySlug" element={<DemoStoreCountry />} />
        <Route path="checkout" element={<DemoStoreCheckout />} />
        <Route path="about" element={<DemoStoreAbout />} />
        <Route path="contact" element={<DemoStoreContact />} />
        <Route path="help-center" element={<DemoStoreHelpCenter />} />
        <Route path="esim-setup-guide" element={<DemoStoreSetupGuide />} />
        <Route path="faq" element={<DemoStoreFAQ />} />
        <Route path="press" element={<DemoStorePress />} />
        <Route path="partners" element={<DemoStorePartners />} />
        <Route path="terms" element={<DemoStoreTerms />} />
        <Route path="privacy" element={<DemoStorePrivacy />} />
        <Route path="cookies" element={<DemoStoreCookies />} />
        <Route path="refund-policy" element={<DemoStoreRefundPolicy />} />
      </Route>

      {/* Live Store Routes — /store/:subdomain/* loads the store by subdomain */}
      <Route path="/store/:subdomain" element={<SubdomainStoreLoader />}>
        <Route index element={<DemoStoreHome />} />
        <Route path="destinations" element={<DemoStoreDestinations />} />
        <Route path="country/:countrySlug" element={<DemoStoreCountry />} />
        <Route path="checkout" element={<DemoStoreCheckout />} />
        <Route path="about" element={<DemoStoreAbout />} />
        <Route path="contact" element={<DemoStoreContact />} />
        <Route path="help-center" element={<DemoStoreHelpCenter />} />
        <Route path="esim-setup-guide" element={<DemoStoreSetupGuide />} />
        <Route path="faq" element={<DemoStoreFAQ />} />
        <Route path="press" element={<DemoStorePress />} />
        <Route path="partners" element={<DemoStorePartners />} />
        <Route path="terms" element={<DemoStoreTerms />} />
        <Route path="privacy" element={<DemoStorePrivacy />} />
        <Route path="cookies" element={<DemoStoreCookies />} />
        <Route path="refund-policy" element={<DemoStoreRefundPolicy />} />
      </Route>

      {/* Main App Routes (with Navbar, optional sidebar, optional footer) */}
      <Route path="*" element={<MainShell />} />
    </Routes>
    </Suspense>
  </>
);

const App = () => {
  // Check if Clerk is configured (ClerkProvider is in main.tsx)
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AuthProvider>
                {clerkPubKey && <ClerkAuthSync />}
                <CustomerAuthProvider>
                  <DemoStoreProvider>
                    <PublicStoreInvalidationProvider>
                      <Toaster />
                      <Sonner />
                      <AppRoutes />
                    </PublicStoreInvalidationProvider>
                  </DemoStoreProvider>
                </CustomerAuthProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
