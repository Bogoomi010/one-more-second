import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  isAuthAvailable,
  signInWithGoogleRedirect,
  signOutCurrentUser,
  subscribeAuthState,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;
      loading: boolean;
      firebaseEnabled: boolean;
      signInWithGoogle: () => Promise<void>;
      signOut: () => Promise<void>;
}

const defaultValue: AuthContextValue = {
  user: null,
  loading: false,
  firebaseEnabled: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const firebaseEnabled = isAuthAvailable();

  useEffect(() => {
    const unsubscribe = subscribeAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseEnabled,
      signInWithGoogle: async () => {
        await signInWithGoogleRedirect();
      },
      signOut: async () => {
        await signOutCurrentUser();
      },
    }),
    [firebaseEnabled, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
