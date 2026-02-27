import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, ArrowRight, MessageSquare, Package, DollarSign, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorePreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Your store is being built</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            The eSIMLaunch team is building and deploying your personalised eSIM store. We'll reach out within <strong className="text-foreground">1–2 business days</strong> to confirm your details and provide your live store link.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: Package, title: "Configure Packages", desc: "Choose the eSIM plans you want to sell in your store", path: "/package-selector" },
            { icon: DollarSign, title: "Set Your Pricing", desc: "Apply markups and configure pricing for your customers", path: "/pricing-config" },
            { icon: Eye, title: "See Demo Store", desc: "Preview what a completed eSIM store looks like to customers", path: "/demo-store" },
          ].map(({ icon: Icon, title, desc, path }) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="bg-card rounded-2xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold mb-0.5">Need to get in touch?</p>
              <p className="text-sm text-muted-foreground">
                Have brand preferences, a custom domain, or questions about your store build? Drop us a message.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              size="sm"
              onClick={() => window.open("mailto:support@esimlaunch.com?subject=Easy Way Store Build", "_blank")}
              className="gap-2 whitespace-nowrap"
            >
              Contact Our Team
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
