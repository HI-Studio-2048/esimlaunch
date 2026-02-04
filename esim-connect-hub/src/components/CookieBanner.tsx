import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="container-custom">
            <div className="bg-card rounded-2xl shadow-xl border border-border p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                <Cookie className="w-6 h-6 text-primary-foreground" />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold mb-1">We use cookies 🍪</h4>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your experience. By continuing, you agree to our{" "}
                  <Link to="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button variant="ghost" size="sm" onClick={handleDecline} className="flex-1 md:flex-none">
                  Decline
                </Button>
                <Button variant="gradient" size="sm" onClick={handleAccept} className="flex-1 md:flex-none">
                  Accept All
                </Button>
              </div>

              <button
                onClick={handleDecline}
                className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
