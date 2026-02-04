import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [hasShown, setHasShown] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const shown = sessionStorage.getItem("exitIntentShown");
    if (shown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves toward top of viewport
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem("exitIntentShown", "true");
      }
    };

    // Add delay before enabling exit intent
    const timeout = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasShown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // In a real app, you'd send this to your backend
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-card border border-border rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg">
              {/* Gradient decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 gradient-bg" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
                aria-label="Close popup"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="p-8 pt-10">
                {!isSubmitted ? (
                  <>
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-20 h-20 mx-auto rounded-2xl gradient-bg flex items-center justify-center mb-6"
                    >
                      <Gift className="w-10 h-10 text-primary-foreground" />
                    </motion.div>

                    {/* Content */}
                    <div className="text-center mb-6">
                      <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                        Wait! Don't leave yet
                      </h2>
                      <p className="text-muted-foreground">
                        Get <span className="font-bold text-primary">20% off</span> your first month when you sign up today
                      </p>
                    </div>

                    {/* Offer highlights */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Free setup
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Cancel anytime
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 text-primary" />
                        24/7 support
                      </span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-center"
                        required
                      />
                      <Button type="submit" variant="gradient" size="lg" className="w-full">
                        Claim My 20% Discount
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      No spam, ever. Unsubscribe anytime.
                    </p>
                  </>
                ) : (
                  /* Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6"
                    >
                      <Sparkles className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold mb-2">
                      You're all set! 🎉
                    </h2>
                    <p className="text-muted-foreground">
                      Check your inbox for your exclusive discount code
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
