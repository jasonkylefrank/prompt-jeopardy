
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { useUser } from "@/firebase";
import { createContext, useMemo, type ReactNode } from "react";
import type { User } from "@/lib/types";

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
