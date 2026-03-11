import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Contact from "./pages/Contact";
import About from "./pages/About";
import APIDocs from "./pages/APIDocs";
import HelpCenter from "./pages/HelpCenter";
import Status from "./pages/Status";
import ROICalculator from "./pages/ROICalculator";
import CurrentPrices from "./pages/CurrentPrices";
import Demo from "./pages/Demo";
import CaseStudies from "./pages/CaseStudies";
import Changelog from "./pages/Changelog";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import PackageSelector from "./pages/PackageSelector";
import PricingConfig from "./pages/PricingConfig";
import WebhookSettings from "./pages/WebhookSettings";
import DomainVerification from "./pages/DomainVerification";
import CustomerLogin from "./pages/customer/Login";
import CustomerSignup from "./pages/customer/Signup";
import CustomerDashboard from "./pages/customer/Dashboard";
import Billing from "./pages/Billing";
import CreateSupportTicket from "./pages/CreateSupportTicket";
import SupportTicket from "./pages/SupportTicket";
import SupportDashboard from "./pages/SupportDashboard";
import Analytics from "./pages/Analytics";
import CurrencySettings from "./pages/CurrencySettings";
import SEOSettings from "./pages/SEOSettings";
import EmailTemplates from "./pages/EmailTemplates";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import SSOCallback from "./pages/SSOCallback";
import StorePreview from "./pages/StorePreview";
import { PublicStoreInvalidationProvider } from "@/contexts/PublicStoreInvalidationContext";
import PackageBrowser from "./pages/PackageBrowser";
import CreateOrder from "./pages/CreateOrder";
import ProfileManagement from "./pages/ProfileManagement";
import Balance from "./pages/Balance";
import OrderHistory from "./pages/OrderHistory";
import CustomersPage from "./pages/CustomersPage";
import TopUpsPage from "./pages/TopUpsPage";
import PaymentSettings from "./pages/PaymentSettings";
import Developer from "./pages/Developer";
import Admin from "./pages/Admin";
import AdminMerchants from "@/pages/AdminMerchants";
import AdminMerchantDetail from "@/pages/AdminMerchantDetail";
import AdminStoreDetail from "@/pages/AdminStoreDetail";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";
import DemoStoreHome from "./pages/demo-store/DemoStoreHome";
import DemoStoreDestinations from "./pages/demo-store/DemoStoreDestinations";
import DemoStoreCountry from "./pages/demo-store/DemoStoreCountry";
import DemoStoreCheckout from "./pages/demo-store/DemoStoreCheckout";
import DemoStoreAbout from "./pages/demo-store/DemoStoreAbout";
import DemoStoreContact from "./pages/demo-store/DemoStoreContact";
import DemoStoreHelpCenter from "./pages/demo-store/DemoStoreHelpCenter";
import DemoStoreSetupGuide from "./pages/demo-store/DemoStoreSetupGuide";
import DemoStoreFAQ from "./pages/demo-store/DemoStoreFAQ";
import DemoStorePress from "./pages/demo-store/DemoStorePress";
import DemoStorePartners from "./pages/demo-store/DemoStorePartners";
import DemoStoreTerms from "./pages/demo-store/DemoStoreTerms";
import DemoStorePrivacy from "./pages/demo-store/DemoStorePrivacy";
import DemoStoreCookies from "./pages/demo-store/DemoStoreCookies";
import DemoStoreRefundPolicy from "./pages/demo-store/DemoStoreRefundPolicy";

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
                <Route 
                  path="/customer/dashboard" 
                  element={
                    <ProtectedRoute>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  } 
                />
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
  </>
);

const App = () => {
  // Check if Clerk is configured (ClerkProvider is in main.tsx)
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  return (
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
  );
};

export default App;
