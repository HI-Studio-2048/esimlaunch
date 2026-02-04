import { Link } from "react-router-dom";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function DemoStoreFooter() {
  const { config } = useDemoStore();

  const footerLinks = {
    destinations: [
      { name: "All Destinations", href: "/demo-store/destinations" },
      { name: "Europe", href: "/demo-store/destinations" },
      { name: "Asia Pacific", href: "/demo-store/destinations" },
      { name: "Americas", href: "/demo-store/destinations" },
      { name: "Regional Plans", href: "/demo-store/destinations" },
    ],
    support: [
      { name: "Help Center", href: "/demo-store/help-center" },
      { name: "eSIM Setup Guide", href: "/demo-store/esim-setup-guide" },
      { name: "FAQ", href: "/demo-store/faq" },
      { name: "Contact Us", href: "/demo-store/contact" },
    ],
    company: [
      { name: "About Us", href: "/demo-store/about" },
      { name: "Careers", href: "/demo-store/careers" },
      { name: "Press", href: "/demo-store/press" },
      { name: "Partners", href: "/demo-store/partners" },
    ],
    legal: [
      { name: "Terms of Service", href: "/demo-store/terms" },
      { name: "Privacy Policy", href: "/demo-store/privacy" },
      { name: "Cookie Policy", href: "/demo-store/cookies" },
      { name: "Refund Policy", href: "/demo-store/refund-policy" },
    ],
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/demo-store" className="flex items-center gap-3 mb-4">
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
              <span className="font-semibold">{config.businessName}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted partner for global eSIM connectivity. Stay connected anywhere in the world.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="font-semibold mb-4">Destinations</h4>
            <ul className="space-y-2">
              {footerLinks.destinations.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                support@{config.businessName.toLowerCase().replace(/\s+/g, "")}.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                123 Tech Street, San Francisco
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 {config.businessName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {footerLinks.legal.map((link) => (
              <Link key={link.name} to={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
