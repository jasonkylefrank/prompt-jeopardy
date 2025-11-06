
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { useFirebase, useUser } from "@/firebase";
import { createContext, useEffect, useMemo, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { getRedirectResult } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firebaseUser: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "There was a problem signing in with Google. Please try again.",
        })
      }
    };
    if (auth) {
        handleRedirect();
    }
  }, [auth, toast]);

  const user: User | null = useMemo(() => {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || "Contestant",
      avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
    };
  }, [firebaseUser]);

  const value = useMemo(
    () => ({
      user,
      loading: isUserLoading,
      firebaseUser,
    }),
    [user, isUserLoading, firebaseUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
