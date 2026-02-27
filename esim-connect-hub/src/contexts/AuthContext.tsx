import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, ApiError } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  serviceType: 'EASY' | 'ADVANCED';
  isActive: boolean;
  createdAt?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name?: string, serviceType?: 'EASY' | 'ADVANCED', referralCode?: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void; // Expose setUser for ClerkAuthSync
  setAuthLoading: (loading: boolean) => void; // Expose for ClerkAuthSync to hold loading state during sync
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  // Auth from DB: session cookie (or JWT) — no localStorage. Works on any device after login.
  useEffect(() => {
    const initAuth = async () => {
      const explicitLogout =
        localStorage.getItem('explicit_logout') || sessionStorage.getItem('explicit_logout');
      if (explicitLogout === 'true') {
        sessionStorage.removeItem('explicit_logout');
        localStorage.removeItem('explicit_logout');
        apiClient.setJwtToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Session cookie is sent automatically (credentials: 'include'). Backend uses DB session.
        const merchant = await apiClient.getCurrentMerchant();
        setUser(merchant ?? null);
        if (merchant?.id) apiClient.setJwtToken(null); // Prefer cookie; clear any stale in-memory token
      } catch (_) {
        setUser(null);
        apiClient.setJwtToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sync Clerk user if Clerk is configured
  useEffect(() => {
    if (!clerkPubKey) return;

    const syncClerkUser = async () => {
      try {
        // Dynamically import Clerk hooks only if Clerk is configured
        const { useClerk, useUser } = await import("@clerk/clerk-react");
        // Note: This won't work directly in useEffect, so we'll handle Clerk sync differently
        // Clerk sync will be handled via the ClerkProvider's onSignIn callback or webhook
      } catch (err) {
        // Clerk not available
      }
    };

    // For now, Clerk sync happens via backend webhook or manual sync endpoint
    // This can be enhanced later with Clerk's React hooks if needed
  }, [clerkPubKey]);

  const login = async (email: string, password: string, _rememberMe: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.login(email, password);
      setUser(result.merchant);
      // Server sets httpOnly session cookie (DB). No localStorage — works on any device.
      apiClient.setJwtToken(result.token); // in-memory fallback for legacy paths
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name?: string, 
    serviceType?: 'EASY' | 'ADVANCED',
    referralCode?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.register(email, password, name, serviceType, referralCode);
      setUser(result.merchant);
      // Server sets httpOnly session cookie (DB). No localStorage.
      apiClient.setJwtToken(result.token);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    sessionStorage.setItem('explicit_logout', 'true');
    try {
      await apiClient.logout();
    } catch (_) {}
    setUser(null);
    apiClient.setJwtToken(null);
    apiClient.setApiKey(null);
    setError(null);
  };

  const refreshToken = async () => {
    try {
      // Refresh the token
      const result = await apiClient.refreshToken();
      setUser(result.merchant);
    } catch (err) {
      // Token refresh failed, logout
      logout();
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshToken,
    clearError,
    setUser, // Expose setUser for ClerkAuthSync
    setAuthLoading: setIsLoading, // Expose for ClerkAuthSync to hold loading state during sync
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
