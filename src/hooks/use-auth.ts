
'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

// This is a mock auth hook since we removed Firebase Auth.
// It retrieves the user from session storage.
export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem('player');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to parse user from session storage", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const signIn = () => {
        // This is a placeholder. The sign-in is now handled by the NameDialog.
        console.log("Sign-in process initiated via NameDialog.");
    };

    const signOut = () => {
        sessionStorage.removeItem('player');
        setUser(null);
        // In a real app, you might want to redirect to the homepage.
        window.location.href = '/';
    };

    return { user, loading, signIn, signOut };
};
