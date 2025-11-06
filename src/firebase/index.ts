// This file is being deprecated in favor of the new AuthProvider
// but is kept for now to avoid breaking existing imports.
// Please update imports to use hooks and context from `@/components/auth-provider`

export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';

// Deprecated exports
/** @deprecated */
export const initializeFirebase = () => {};
/** @deprecated */
export const FirebaseClientProvider = ({ children }: { children: React.ReactNode }) => children;
/** @deprecated */
export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => children;
/** @deprecated */
export const useFirebase = () => ({});
/** @deprecated */
export const useAuthContext = () => null;
/** @deprecated */
export const useFirestore = () => null;
/** @deprecated */
export const useFirebaseApp = () => null;
/** @deprecated */
export const useUser = () => ({ user: null, isUserLoading: true, userError: null });
