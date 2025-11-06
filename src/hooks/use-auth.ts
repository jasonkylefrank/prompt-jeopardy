'use client';

import { useAuth as useAuthFromProvider } from '@/components/auth-provider';

/**
 * Custom hook to access authentication context.
 */
export const useAuth = () => {
  return useAuthFromProvider();
};
