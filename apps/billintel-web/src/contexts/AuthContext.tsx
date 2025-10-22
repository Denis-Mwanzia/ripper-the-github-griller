import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ user: User | null; error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const { user, error } = await AuthService.getCurrentUser();
        if (error) {
          console.error('Auth error:', error);
        }
        setUser(user);
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth state changes
    const subscription = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);

    const result = await AuthService.signUp(email, password, name);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const result = await AuthService.signIn(email, password);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    const result = await AuthService.signOut();

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
