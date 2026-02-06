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
  register: (email: string, password: string, name?: string, serviceType?: 'EASY' | 'ADVANCED') => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void; // Expose setUser for ClerkAuthSync
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  // Load token from localStorage and validate on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          // Validate token by fetching current merchant
          const merchant = await apiClient.getCurrentMerchant();
          setUser(merchant);
        }
      } catch (err) {
        // Token is invalid or expired, clear it
        localStorage.removeItem('jwt_token');
        apiClient.setJwtToken(null);
        setUser(null);
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

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.login(email, password);
      setUser(result.merchant);
      
      // Store token based on remember me preference
      if (rememberMe) {
        localStorage.setItem('jwt_token', result.token);
      } else {
        sessionStorage.setItem('jwt_token', result.token);
        // Also store in localStorage for apiClient
        localStorage.setItem('jwt_token', result.token);
      }
      
      apiClient.setJwtToken(result.token);
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
    serviceType?: 'EASY' | 'ADVANCED'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.register(email, password, name, serviceType);
      setUser(result.merchant);
      
      // Store token after registration
      localStorage.setItem('jwt_token', result.token);
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
    // If using Clerk, sign out from Clerk first
    if (clerkPubKey) {
      try {
        const { useClerk } = await import("@clerk/clerk-react");
        // We can't use hooks here, so we'll need to handle Clerk sign out differently
        // The ClerkProvider's afterSignOutUrl will handle navigation
        // For now, we'll clear local state and let Clerk handle its own sign out
      } catch (e) {
        // Clerk not available, continue with normal logout
      }
    }
    
    // Clear all authentication state
    setUser(null);
    localStorage.removeItem('jwt_token');
    sessionStorage.removeItem('jwt_token');
    localStorage.removeItem('api_key');
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
