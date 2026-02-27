import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Search, Menu, X, User, ShoppingCart, ChevronDown, MapPin, Globe } from "lucide-react";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const popularDestinations = [
  { name: "France", flag: "🇫🇷" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "United States", flag: "🇺🇸" },
];

const regionalPlans = [
  { name: "Europe", icon: "🌍" },
  { name: "Asia", icon: "🌏" },
  { name: "Americas", icon: "🌎" },
  { name: "World", icon: "🌐" },
];

export function DemoStoreNavbar() {
  const { config } = useDemoStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();

  // Derive base path: /store/:subdomain when accessed via subdomain route, else /demo-store
  const basePath = params.subdomain ? `/store/${params.subdomain}` : "/demo-store";

  const isActive = (suffix: string) => location.pathname === `${basePath}${suffix}`;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={basePath} className="flex items-center gap-3">
            {config.logo ? (
              <img src={config.logo} alt="Logo" className="h-8 object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: config.primaryColor }}
              >
                {config.businessName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-lg">{config.businessName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                Destinations
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[400px] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Popular Destinations
                    </div>
                    {popularDestinations.map((dest) => (
                      <DropdownMenuItem key={dest.name} asChild>
                        <Link
                          to={`${basePath}/country/${dest.name.toLowerCase().replace(/\s+/g, "-")}`}
                          className="flex items-center gap-2"
                        >
                          <span>{dest.flag}</span>
                          {dest.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      Regional Plans
                    </div>
                    {regionalPlans.map((region) => (
                      <DropdownMenuItem key={region.name} asChild>
                        <Link
                          to={`${basePath}/destinations`}
                          className="flex items-center gap-2"
                        >
                          <span>{region.icon}</span>
                          {region.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    to={`${basePath}/destinations`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: config.primaryColor }}
                  >
                    View All Destinations →
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to={`${basePath}/about`}
              className={`text-sm font-medium transition-colors ${
                isActive("/about") ? "text-primary" : "hover:text-primary"
              }`}
            >
              About us
            </Link>
            <Link
              to={`${basePath}/contact`}
              className={`text-sm font-medium transition-colors ${
                isActive("/contact") ? "text-primary" : "hover:text-primary"
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-muted rounded-full transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-full transition-colors hidden md:flex">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <Button
              size="sm"
              style={{ background: config.primaryColor }}
              className="hidden md:flex text-white"
            >
              Login
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link
                to={`${basePath}/destinations`}
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Destinations
              </Link>
              <Link
                to={`${basePath}/about`}
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About us
              </Link>
              <Link
                to={`${basePath}/contact`}
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
              <Button
                size="sm"
                style={{ background: config.primaryColor }}
                className="text-white w-fit"
              >
                Login
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
