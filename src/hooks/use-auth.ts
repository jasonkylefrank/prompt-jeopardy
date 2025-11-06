'use client';

import { useAuth as useAuthFromProvider } from '@/components/auth-provider';

/**
 * @deprecated This hook is deprecated. Please import `useAuth` from `@/components/auth-provider` instead.
 */
export const useAuth = () => {
  return useAuthFromProvider();
};
