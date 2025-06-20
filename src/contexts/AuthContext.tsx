import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthService, User } from '../services/AuthService';

type ProfileUpdates = {
  fullName?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  data?: Record<string, any>;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  initialLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check if there's an active session when the app loads
  const checkUser = useCallback(async (isRetry = false) => {
    try {
      console.log('Checking for existing session...');
      const { user } = await AuthService.getCurrentUser();
      setUser(user);
    } catch (error: any) {
      console.log('Session check error:', error?.message || error);
      
      // If we get an AuthSessionMissingError and this isn't a retry, wait a bit and try again
      if (error?.name === 'AuthSessionMissingError' && !isRetry) {
        console.log('Retrying session check after delay...');
        setTimeout(() => checkUser(true), 500);
        return;
      }
      
      setUser(null);
    } finally {
      if (!isRetry) {
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    checkUser();

    // Set up auth state change listener
    console.log('Setting up auth state listener...');
    const { subscription } = AuthService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setUser(session?.user ?? null);
      setInitialLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [checkUser]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await AuthService.signIn(email, password);
      // The auth state change listener will update the user state
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      await AuthService.signUp(email, password);
      // The auth state change listener will update the user state
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      // The auth state change listener will update the user state
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await AuthService.resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdates) => {
    try {
      setLoading(true);
      await AuthService.updateProfile(updates);
      // Refresh user data after update
      await checkUser();
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    initialLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!initialLoading ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
