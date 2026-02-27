import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface BrandConfig {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string | null;
}

export const defaultBrandConfig: BrandConfig = {
  businessName: "Your eSIM Store",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#22c55e",
  logo: null,
};

const STORE_CONFIG_KEY = 'esimlaunch_store_config';
const STORE_ID_KEY = 'current_store_id';

interface DemoStoreContextType {
  config: BrandConfig;
  setConfig: (config: BrandConfig) => void;
  storeId: string | null;
  setStoreId: (id: string | null) => void;
}

const DemoStoreContext = createContext<DemoStoreContextType | undefined>(undefined);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const loadConfig = (): BrandConfig => {
    if (typeof window === 'undefined') return defaultBrandConfig;
    try {
      const saved = localStorage.getItem(STORE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName && parsed.primaryColor && parsed.secondaryColor && parsed.accentColor) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load store config from localStorage:', error);
    }
    return defaultBrandConfig;
  };

  const loadStoreId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORE_ID_KEY);
  };

  const [config, setConfigState] = useState<BrandConfig>(loadConfig);
  const [storeId, setStoreIdState] = useState<string | null>(loadStoreId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        console.error('Failed to save store config to localStorage:', error);
      }
    }
  }, [config]);

  const setConfig = useCallback((newConfig: BrandConfig) => {
    setConfigState(newConfig);
  }, []);

  const setStoreId = useCallback((id: string | null) => {
    setStoreIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORE_ID_KEY, id);
      } else {
        localStorage.removeItem(STORE_ID_KEY);
      }
    }
  }, []);

  return (
    <DemoStoreContext.Provider value={{ config, setConfig, storeId, setStoreId }}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);
  if (context === undefined) {
    throw new Error("useDemoStore must be used within a DemoStoreProvider");
  }
  return context;
}
