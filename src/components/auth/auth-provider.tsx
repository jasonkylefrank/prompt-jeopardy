'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { useFirebase, useUser } from '@/firebase';
import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import type { User } from '@/lib/types';
import {
  getRedirectResult,
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
  const { user: firebaseUser, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!auth) return;
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          toast({
            title: "Signed In",
            description: `Welcome back, ${result.user.displayName}!`,
          });
        }
      } catch (error: any) {
        console.error('Login failed after redirect:', error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description:
            'There was a problem signing in with Google after redirect. Please try again.',
        });
      }
    };
    
    // Only run this on the initial load when auth is available
    if (auth && !isUserLoading) {
      handleRedirect();
    }
  }, [auth, isUserLoading, toast]);

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
    [user, isUserLoading, firebaseUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
