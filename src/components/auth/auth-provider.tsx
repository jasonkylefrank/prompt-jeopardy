'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  signIn: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firebaseUser: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  const signIn = () => {
    // Redirect to the server-side sign-in route
    router.push('/api/auth/signin');
  };

  const signOut = () => {
    // Redirect to the server-side sign-out route
    router.push('/api/auth/signout');
  };

  useEffect(() => {
    if (!isUserLoading && firebaseUser) {
        // This effect can be used to show a welcome toast, etc.
        // But we avoid showing a toast on every page load.
    }
  }, [isUserLoading, firebaseUser, toast]);

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
