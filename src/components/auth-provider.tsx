'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  getRedirectResult,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface AuthContextType {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize Firebase outside of the component to ensure it's only done once.
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This handles the redirect result after a user signs in.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({
            title: 'Signed In',
            description: `Welcome back, ${result.user.displayName}!`,
          });
        }
      })
      .catch((error) => {
        console.error('Auth Error from getRedirectResult:', error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'There was a problem signing in. Please try again.',
        });
      })
      .finally(() => {
        // Set up the state change listener AFTER processing the redirect.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user);
          setLoading(false);
        }, (error) => {
          console.error('Auth Error from onAuthStateChanged:', error);
          setLoading(false);
        });
        
        // Cleanup listener on unmount
        return () => unsubscribe();
      });
  }, [toast]);
  
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
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
  };

  const value = useMemo(
    () => ({
      firebaseApp,
      auth,
      firestore,
      user,
      firebaseUser,
      loading,
      signIn,
      signOut,
    }),
    [user, firebaseUser, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
