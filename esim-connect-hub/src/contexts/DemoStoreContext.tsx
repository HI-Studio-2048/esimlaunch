import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

interface DemoStoreContextType {
  config: BrandConfig;
  setConfig: (config: BrandConfig) => void;
}

const DemoStoreContext = createContext<DemoStoreContextType | undefined>(undefined);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  // Load config from localStorage on mount
  const loadConfig = (): BrandConfig => {
    if (typeof window === 'undefined') return defaultBrandConfig;
    
    try {
      const saved = localStorage.getItem(STORE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that all required fields exist
        if (parsed.businessName && parsed.primaryColor && parsed.secondaryColor && parsed.accentColor) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load store config from localStorage:', error);
    }
    return defaultBrandConfig;
  };

  const [config, setConfigState] = useState<BrandConfig>(loadConfig);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        console.error('Failed to save store config to localStorage:', error);
      }
    }
  }, [config]);

  const setConfig = (newConfig: BrandConfig) => {
    setConfigState(newConfig);
  };

  return (
    <DemoStoreContext.Provider value={{ config, setConfig }}>
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
