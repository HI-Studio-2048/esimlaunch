import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  MessageSquare,
  Handshake,
  Package,
  DollarSign,
  Settings,
  Code2,
  History,
  ShoppingCart,
  Cpu,
  Store,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
};

type NavSection = {
  items: NavItem[];
  bottom?: boolean;
};

const EASY_NAV: NavItem[] = [
  { label: "Dashboard",   icon: LayoutDashboard, path: "/dashboard" },
  { label: "Billing",     icon: Receipt,         path: "/settings/billing" },
  { label: "Payment",     icon: CreditCard,      path: "/dashboard/payment-settings" },
  { label: "Balance",     icon: Wallet,          path: "/dashboard/balance" },
  { label: "Analytics",   icon: BarChart3,       path: "/dashboard/analytics" },
  { label: "Support",     icon: MessageSquare,   path: "/dashboard/support" },
  { label: "My eSIM",     icon: Cpu,             path: "/dashboard/profiles" },
  { label: "Affiliates",  icon: Handshake,       path: "/dashboard/affiliates" },
  { label: "Packages",    icon: Package,         path: "/package-selector" },
  { label: "Pricing",     icon: DollarSign,      path: "/pricing-config" },
  { label: "Demo Store",  icon: Store,           path: "/demo-store" },
];

const ADVANCED_NAV: NavItem[] = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/dashboard" },
  { label: "eSIM Plans",   icon: Package,         path: "/dashboard/packages" },
  { label: "My eSIM",      icon: Cpu,             path: "/dashboard/profiles" },
  { label: "My Order",     icon: History,         path: "/dashboard/orders" },
  { label: "Billing",      icon: Wallet,          path: "/dashboard/balance" },
  { label: "Payment",      icon: CreditCard,      path: "/dashboard/payment-settings" },
  { label: "Developer",    icon: Code2,           path: "/dashboard/developer" },
  { label: "Create Order", icon: ShoppingCart,    path: "/dashboard/create-order" },
  { label: "Analytics",    icon: BarChart3,       path: "/dashboard/analytics" },
  { label: "Support",      icon: MessageSquare,   path: "/dashboard/support" },
  { label: "Affiliates",   icon: Handshake,       path: "/dashboard/affiliates" },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Settings", icon: Settings, path: "/settings" },
];

function isActive(pathname: string, path: string): boolean {
  if (path === "/dashboard") return pathname === "/dashboard";
  if (path === "/settings")  return pathname === "/settings";
  // Exact match for settings sub-pages and standalone pages
  if (path.startsWith("/settings/") || path === "/package-selector" || path === "/pricing-config" || path === "/demo-store") {
    return pathname === path;
  }
  return pathname.startsWith(path);
}

function NavItemButton({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const active = isActive(pathname, item.path);
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          active ? "text-primary" : "group-hover:text-foreground"
        )}
      />
      {!collapsed && (
        <span className="truncate leading-none">{item.label}</span>
      )}
    </NavLink>
  );
}

export function DashboardSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNav = user?.serviceType === "ADVANCED" ? ADVANCED_NAV : EASY_NAV;

  const sidebarContent = (isMobile = false) => (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobile ? "bg-card" : ""
      )}
    >
      {/* Header row with collapse toggle */}
      <div
        className={cn(
          "flex items-center border-b border-border px-3 py-3 shrink-0",
          collapsed && !isMobile ? "justify-center" : "justify-between"
        )}
      >
        {(!collapsed || isMobile) && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Menu
          </span>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {mainNav.map((item) => (
          <NavItemButton
            key={item.label}
            item={item}
            collapsed={collapsed && !isMobile}
            pathname={location.pathname}
          />
        ))}
      </nav>

      {/* Bottom nav (Settings) */}
      <div className="shrink-0 border-t border-border py-3 space-y-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavItemButton
            key={item.label}
            item={item}
            collapsed={collapsed && !isMobile}
            pathname={location.pathname}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button — shown only in dashboard context on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "md:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full shadow-lg",
          "bg-primary text-primary-foreground"
        )}
        title="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border",
          "transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="pt-16">{sidebarContent(true)}</div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0",
          "sticky top-16 md:top-20 self-start",
          "h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]",
          "bg-card border-r border-border z-30",
          "transition-[width] duration-300 overflow-hidden",
          "overflow-y-auto",
          collapsed ? "w-[4.5rem]" : "w-60"
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
