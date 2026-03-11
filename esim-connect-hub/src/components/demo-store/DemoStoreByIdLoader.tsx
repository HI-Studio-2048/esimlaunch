import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DemoStoreLayout } from "./DemoStoreLayout";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { apiClient } from "@/lib/api";

const STORE_ID_KEY = "current_store_id";

/**
 * When navigating to /demo-store (not /store/:subdomain), load the current store
 * from the API so branding and config match the live site. Without this, the
 * Demo Store uses stale localStorage data.
 */
export function DemoStoreByIdLoader() {
  const { setConfig, setStoreId } = useDemoStore();
  const [status, setStatus] = useState<"loading" | "ready" | "none">("loading");

  useEffect(() => {
    const storeIdFromStorage = typeof window !== "undefined" ? localStorage.getItem(STORE_ID_KEY) : null;

    if (!storeIdFromStorage) {
      setStatus("ready");
      return;
    }

    let cancelled = false;

    apiClient
      .getPublicStore(storeIdFromStorage)
      .then((data) => {
        if (cancelled) return;
        setStoreId(storeIdFromStorage);
        setConfig({
          businessName: data.branding.businessName,
          primaryColor: data.branding.primaryColor,
          secondaryColor: data.branding.secondaryColor,
          accentColor: data.branding.accentColor,
          logo: data.branding.logoUrl ?? null,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [setConfig, setStoreId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm">Loading your store preview...</p>
        </div>
      </div>
    );
  }

  return <DemoStoreLayout />;
}
