import { Link, useParams } from "react-router-dom";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { usePublicStore } from "@/hooks/usePublicStore";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function DemoStoreFooter() {
  const { config, storeId } = useDemoStore();
  const { data: storeData } = usePublicStore(storeId);
  const params = useParams<{ subdomain?: string }>();

  const basePath = params.subdomain ? `/store/${params.subdomain}` : "/demo-store";
  const ts = storeData?.templateSettings || {};

  const footerLinks = {
    destinations: [
      { name: "All Destinations", href: `${basePath}/destinations` },
      { name: "Europe", href: `${basePath}/destinations` },
      { name: "Asia Pacific", href: `${basePath}/destinations` },
      { name: "Americas", href: `${basePath}/destinations` },
      { name: "Regional Plans", href: `${basePath}/destinations` },
    ],
    support: [
      { name: "Help Center", href: `${basePath}/help-center` },
      { name: "eSIM Setup Guide", href: `${basePath}/esim-setup-guide` },
      { name: "FAQ", href: `${basePath}/faq` },
      { name: "Contact Us", href: `${basePath}/contact` },
    ],
    company: [
      { name: "About Us", href: `${basePath}/about` },
      { name: "Terms of Service", href: `${basePath}/terms` },
      { name: "Privacy Policy", href: `${basePath}/privacy` },
      { name: "Cookie Policy", href: `${basePath}/cookies` },
    ],
    legal: [
      { name: "Terms of Service", href: `${basePath}/terms` },
      { name: "Privacy Policy", href: `${basePath}/privacy` },
      { name: "Cookie Policy", href: `${basePath}/cookies` },
      { name: "Refund Policy", href: `${basePath}/refund-policy` },
    ],
  };

  const contactEmail = ts.contactEmail || `support@${config.businessName.toLowerCase().replace(/\s+/g, "")}.com`;
  const contactPhone = ts.contactPhone || null;
  const contactAddress = ts.contactAddress || null;

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to={basePath} className="flex items-center gap-3 mb-4">
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
              {ts.aboutTagline || "Your trusted partner for global eSIM connectivity. Stay connected anywhere in the world."}
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
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${contactEmail}`} className="hover:text-foreground transition-colors break-all">
                  {contactEmail}
                </a>
              </li>
              {contactPhone && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-foreground transition-colors">
                    {contactPhone}
                  </a>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  {contactAddress}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {ts.legalCompanyName || config.businessName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
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
