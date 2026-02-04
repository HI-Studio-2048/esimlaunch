import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// ClerkProvider moved to main.tsx per Clerk's React (Vite) guidelines
import { ReactNode, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { DemoStoreProvider } from "@/contexts/DemoStoreContext";
import { DemoStoreLayout } from "@/components/demo-store/DemoStoreLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClerkAuthSync } from "@/components/ClerkAuthSync";
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
import Careers from "./pages/Careers";
import HelpCenter from "./pages/HelpCenter";
import Community from "./pages/Community";
import Status from "./pages/Status";
import ROICalculator from "./pages/ROICalculator";
import Demo from "./pages/Demo";
import Partners from "./pages/Partners";
import CaseStudies from "./pages/CaseStudies";
import Changelog from "./pages/Changelog";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import CoverageChecker from "./pages/CoverageChecker";
import StorePreview from "./pages/StorePreview";
import WorldCoverage from "./pages/WorldCoverage";
import NotFound from "./pages/NotFound";
import DemoStoreHome from "./pages/demo-store/DemoStoreHome";
import DemoStoreDestinations from "./pages/demo-store/DemoStoreDestinations";
import DemoStoreCountry from "./pages/demo-store/DemoStoreCountry";
import DemoStoreAbout from "./pages/demo-store/DemoStoreAbout";
import DemoStoreContact from "./pages/demo-store/DemoStoreContact";
import DemoStoreHelpCenter from "./pages/demo-store/DemoStoreHelpCenter";
import DemoStoreSetupGuide from "./pages/demo-store/DemoStoreSetupGuide";
import DemoStoreFAQ from "./pages/demo-store/DemoStoreFAQ";
import DemoStoreCareers from "./pages/demo-store/DemoStoreCareers";
import DemoStorePress from "./pages/demo-store/DemoStorePress";
import DemoStorePartners from "./pages/demo-store/DemoStorePartners";
import DemoStoreTerms from "./pages/demo-store/DemoStoreTerms";
import DemoStorePrivacy from "./pages/demo-store/DemoStorePrivacy";
import DemoStoreCookies from "./pages/demo-store/DemoStoreCookies";
import DemoStoreRefundPolicy from "./pages/demo-store/DemoStoreRefundPolicy";

const queryClient = new QueryClient();

// Shared routes component
const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Demo Store Routes - separate layout, no main navbar/footer */}
      <Route path="/demo-store" element={<DemoStoreLayout />}>
        <Route index element={<DemoStoreHome />} />
        <Route path="destinations" element={<DemoStoreDestinations />} />
        <Route path="country/:countrySlug" element={<DemoStoreCountry />} />
        <Route path="about" element={<DemoStoreAbout />} />
        <Route path="contact" element={<DemoStoreContact />} />
        <Route path="help-center" element={<DemoStoreHelpCenter />} />
        <Route path="esim-setup-guide" element={<DemoStoreSetupGuide />} />
        <Route path="faq" element={<DemoStoreFAQ />} />
        <Route path="careers" element={<DemoStoreCareers />} />
        <Route path="press" element={<DemoStorePress />} />
        <Route path="partners" element={<DemoStorePartners />} />
        <Route path="terms" element={<DemoStoreTerms />} />
        <Route path="privacy" element={<DemoStorePrivacy />} />
        <Route path="cookies" element={<DemoStoreCookies />} />
        <Route path="refund-policy" element={<DemoStoreRefundPolicy />} />
      </Route>

      {/* Main App Routes */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
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
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route 
                  path="/api-docs" 
                  element={
                    <ProtectedRoute>
                      <APIDocs />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/careers" element={<Careers />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/community" element={<Community />} />
                <Route path="/status" element={<Status />} />
                <Route path="/roi-calculator" element={<ROICalculator />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/case-studies" element={<CaseStudies />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                  path="/onboarding" 
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/coverage" element={<CoverageChecker />} />
                <Route 
                  path="/store-preview" 
                  element={
                    <ProtectedRoute>
                      <StorePreview />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/world-coverage" element={<WorldCoverage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <CookieBanner />
          </div>
        }
      />
    </Routes>
  </BrowserRouter>
);

const App = () => {
  // Check if Clerk is configured (ClerkProvider is in main.tsx)
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            {clerkPubKey && <ClerkAuthSync />}
            <DemoStoreProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </DemoStoreProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
