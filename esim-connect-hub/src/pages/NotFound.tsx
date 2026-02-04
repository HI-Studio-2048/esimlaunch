import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowRight, Compass, MapPin, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quickLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Features", href: "/features", icon: Rocket },
  { name: "Pricing", href: "/pricing", icon: MapPin },
  { name: "Dashboard", href: "/dashboard", icon: Compass },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        
        {/* Floating Elements */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="container-custom py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Animated 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <span className="text-[150px] md:text-[200px] font-display font-bold gradient-text leading-none">
                404
              </span>
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-8 -left-6 w-6 h-6 rounded-full bg-secondary"
                animate={{
                  y: [0, 10, 0],
                  x: [0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              The page you're looking for seems to have wandered off. 
              Don't worry, let's get you back on track!
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for pages..."
                className="pl-12 pr-4 h-12 rounded-full border-2 focus:border-primary"
              />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-10"
          >
            <p className="text-sm text-muted-foreground mb-4">Quick Links</p>
            <div className="flex flex-wrap justify-center gap-3">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <Link
                    to={link.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">{link.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button variant="gradient" size="lg" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Fun Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 text-sm text-muted-foreground"
          >
            Lost? Our eSIMs work in 200+ countries, but this page isn't one of them! 🌍
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
