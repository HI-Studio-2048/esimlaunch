import { useEffect, useState } from "react";
import { useParams, Outlet } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { DemoStoreNavbar } from "./DemoStoreNavbar";
import { DemoStoreFooter } from "./DemoStoreFooter";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { apiClient } from "@/lib/api";

/**
 * Loads a store by its subdomain URL param, populates DemoStoreContext,
 * then renders the child route (demo-store pages) inside the standard store layout.
 *
 * Used by /store/:subdomain/* routes so each merchant's store is fully isolated
 * and served with the correct branding + content.
 */
export function SubdomainStoreLoader() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { setConfig, setStoreId } = useDemoStore();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!subdomain) {
      setStatus("error");
      setErrorMsg("No store specified.");
      return;
    }

    let cancelled = false;

    apiClient.getStoreBySubdomain(subdomain)
      .then((data) => {
        if (cancelled) return;
        setStoreId(data.storeId);
        setConfig({
          businessName: data.branding.businessName,
          primaryColor: data.branding.primaryColor,
          secondaryColor: data.branding.secondaryColor,
          accentColor: data.branding.accentColor,
          logo: data.branding.logoUrl,
        });
        setStatus("ready");
      })
      .catch((err: any) => {
        if (cancelled) return;
        setErrorMsg(err?.message || "Store not found.");
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, [subdomain, setConfig, setStoreId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm">Loading store...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Store not found</h2>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DemoStoreNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <DemoStoreFooter />
    </div>
  );
}
