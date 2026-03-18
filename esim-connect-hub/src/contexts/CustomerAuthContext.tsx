import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";

interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  emailVerified: boolean;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setCustomer: (customer: Customer | null) => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // SECURITY NOTE: Customer JWT in localStorage is an XSS risk.
  // TODO: Migrate to httpOnly session cookies (same pattern as merchant auth).

  // TODO: Add 401 response handling to automatically clear customer state
  // and redirect to customer login when the token expires.

  // Load customer from localStorage on mount
  useEffect(() => {
    const loadCustomer = async () => {
      const token = localStorage.getItem('customer_token');
      const customerData = localStorage.getItem('customer');

      if (token && customerData) {
        try {
          // Verify token by fetching customer data
          const response = await fetch(`${API_BASE_URL}/api/customers/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setCustomer(result.data);
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('customer_token');
              localStorage.removeItem('customer');
            }
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('customer_token');
            localStorage.removeItem('customer');
          }
        } catch (error) {
          console.error('Failed to verify customer token:', error);
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer');
        }
      }
      setIsLoading(false);
    };

    loadCustomer();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('customer_token', result.data.token);
        localStorage.setItem('customer', JSON.stringify(result.data.customer));
        setCustomer(result.data.customer);
      } else {
        throw new Error(result.errorMessage || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('customer_token', result.data.token);
        localStorage.setItem('customer', JSON.stringify(result.data.customer));
        setCustomer(result.data.customer);
      } else {
        throw new Error(result.errorMessage || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer');
    setCustomer(null);
    navigate('/customer/login');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        setCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}










