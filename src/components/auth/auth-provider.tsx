'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { useFirebase } from '@/firebase';
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
  // Consume the stable user state from the main FirebaseProvider
  const { auth, user: firebaseUser, isUserLoading } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    // This effect should only run once when auth is available to handle the redirect result.
    if (auth && !isUserLoading) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            // User successfully signed in.
            toast({
              title: "Signed In",
              description: `Welcome back, ${result.user.displayName}!`,
            });
          }
        })
        .catch((error) => {
          // Handle errors here.
          console.error('Login failed after redirect:', error);
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description:
              'There was a problem signing in with Google. Please try again.',
          });
        });
    }
  }, [auth, isUserLoading, toast]); // Dependencies ensure this runs at the right time

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
    [user, isUserLoading, firebaseUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
