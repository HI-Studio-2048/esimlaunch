import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const PublicStoreInvalidationContext = createContext<{
  invalidateKey: number;
  bump: () => void;
} | null>(null);

export function PublicStoreInvalidationProvider({ children }: { children: ReactNode }) {
  const [invalidateKey, setInvalidateKey] = useState(0);
  const bump = useCallback(() => setInvalidateKey((k) => k + 1), []);
  return (
    <PublicStoreInvalidationContext.Provider value={{ invalidateKey, bump }}>
      {children}
    </PublicStoreInvalidationContext.Provider>
  );
}

export function usePublicStoreInvalidation() {
  return useContext(PublicStoreInvalidationContext);
}

export { PublicStoreInvalidationContext };
