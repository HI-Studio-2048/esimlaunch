import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Settings, Rocket, Store, ChevronDown, Globe, Calculator, BookOpen, Handshake, History, Map, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dynamically check for Clerk availability
let clerkSignOut: ((options?: any) => Promise<void>) | null = null;
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (clerkPubKey) {
  import("@clerk/clerk-react").then((mod) => {
    // We'll use the clerk instance from the hook at render time
  }).catch(() => {
    // Clerk not available
  });
}

const navLinks = [
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "FAQ", href: "/faq" },
];

const resourceLinks = [
  { name: "Coverage Checker", href: "/coverage", icon: Signal },
  { name: "World Coverage", href: "/world-coverage", icon: Map },
  { name: "ROI Calculator", href: "/roi-calculator", icon: Calculator },
  { name: "Case Studies", href: "/case-studies", icon: BookOpen },
  { name: "Partners", href: "/partners", icon: Handshake },
  { name: "Changelog", href: "/changelog", icon: History },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (clerkPubKey) {
      try {
        const { useClerk } = await import("@clerk/clerk-react");
        // Can't use hooks outside components, so just clear local state
      } catch (e) {
        // Clerk not available
      }
    }
    logout();
    navigate("/");
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          "bg-card/60 backdrop-blur-xl border-b border-border/30",
          isScrolled && "bg-card/80 shadow-md border-border/50"
        )}
      >
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20 overflow-visible">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-display font-bold text-xl">eSIMLaunch</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 overflow-visible">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent",
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.name}
                </Link>
              ))}

              {/* Resources Dropdown */}
              <DropdownMenu open={resourcesOpen} onOpenChange={setResourcesOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 outline-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent",
                      resourceLinks.some(l => location.pathname === l.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    Resources
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", resourcesOpen && "rotate-180")} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {resourceLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="flex items-center gap-3 cursor-pointer">
                        <link.icon className="w-4 h-4 text-muted-foreground" />
                        {link.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to="/blog"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent",
                  location.pathname.startsWith("/blog")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Blog
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3 overflow-visible">
              <ThemeToggle />
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 outline-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline">{user?.name || user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/onboarding" className="flex items-center gap-2 cursor-pointer">
                        <Rocket className="w-4 h-4" />
                        Onboarding
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/store-preview" className="flex items-center gap-2 cursor-pointer">
                        <Store className="w-4 h-4" />
                        Store Preview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        logout();
                        navigate("/");
                      }}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button variant="gradient" size="sm" asChild>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden pt-20"
          >
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card mx-4 rounded-2xl shadow-xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      className={cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        location.pathname === link.href
                          ? "text-primary bg-primary/10"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}

                {/* Resources section in mobile */}
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</div>
                {resourceLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navLinks.length + index) * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        location.pathname === link.href
                          ? "text-primary bg-primary/10"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                      {link.name}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + resourceLinks.length) * 0.05 }}
                >
                  <Link
                    to="/blog"
                    className={cn(
                      "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      location.pathname.startsWith("/blog")
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    Blog
                  </Link>
                </motion.div>

                <div className="pt-4 space-y-2 border-t border-border">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm">
                        <p className="font-medium">{user?.name || user?.email}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/onboarding">Onboarding</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/store-preview">Store Preview</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/settings">Settings</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          logout();
                          navigate("/");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/login">Sign In</Link>
                      </Button>
                      <Button variant="gradient" className="w-full" asChild>
                        <Link to="/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
