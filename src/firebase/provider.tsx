'use client';

// This file is deprecated and its contents are now handled by `src/components/auth-provider.tsx`
// It is kept to prevent breaking changes from file deletion, but it no longer does anything.
import React, { type ReactNode } from 'react';

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useFirebase = () => {
  console.warn('useFirebase is deprecated. Use useAuth from @/components/auth-provider instead.');
  return {};
};

// ... other deprecated hooks from this file
