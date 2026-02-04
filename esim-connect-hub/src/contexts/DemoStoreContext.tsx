import { createContext, useContext, useState, ReactNode } from "react";

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

interface DemoStoreContextType {
  config: BrandConfig;
  setConfig: (config: BrandConfig) => void;
}

const DemoStoreContext = createContext<DemoStoreContextType | undefined>(undefined);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BrandConfig>(defaultBrandConfig);

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
