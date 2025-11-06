'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import type { User } from '@/lib/types';
import {
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firebaseUser: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Consume the stable user state from the main FirebaseProvider
  const { auth, user: firebaseUser, isUserLoading } = useFirebase();
  const { toast } = useToast();
  
  const user: User | null = useMemo(() => {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Contestant',
      avatarUrl:
        firebaseUser.photoURL ||
        `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
    };
  }, [firebaseUser]);

  const signIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    // Start the sign-in process
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
    });
  };

  const value = useMemo(
    () => ({
      user,
      loading: isUserLoading,
      firebaseUser,
      signIn,
      signOut,
    }),
    [user, isUserLoading, firebaseUser, auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
