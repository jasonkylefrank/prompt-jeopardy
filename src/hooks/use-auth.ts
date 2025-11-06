
"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/auth-provider";
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { useFirebase } from "@/firebase";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { auth } = useFirebase();

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    // We don't need to get a new auth instance, useFirebase() provides it.
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    // We don't need to get a new auth instance, useFirebase() provides it.
    await firebaseSignOut(auth);
  };

  return { ...context, signIn, signOut };
};
