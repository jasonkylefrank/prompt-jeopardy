"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/auth-provider";
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { useFirebaseApp } from "@/firebase";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const app = useFirebaseApp();

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const signIn = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    const auth = getAuth(app);
    await firebaseSignOut(auth);
  };

  return { ...context, signIn, signOut };
};

    