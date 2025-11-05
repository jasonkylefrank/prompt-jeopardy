"use client";

import type { User } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  createContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

// Mock user data
const MOCK_USERS: User[] = [
  { id: "user_1", name: "Alex", avatarUrl: PlaceHolderImages[0].imageUrl },
  { id: "user_2", name: "Brenda", avatarUrl: PlaceHolderImages[1].imageUrl },
  { id: "user_3", name: "Charlie", avatarUrl: PlaceHolderImages[2].imageUrl },
  { id: "user_4", name: "Diana", avatarUrl: PlaceHolderImages[3].imageUrl },
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    const timer = setTimeout(() => {
      // In a real app, you'd check for a session here.
      // For this demo, we'll assign a random user to simulate login.
      const randomUser =
        MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      setUser(randomUser);
      setLoading(false);
    }, 500); // Simulate loading delay

    return () => clearTimeout(timer);
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
