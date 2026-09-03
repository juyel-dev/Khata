'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '@/lib/firebase/config';
import {
  backupLocalToCloud,
  restoreCloudToLocal,
  ensureUserProfile,
  CloudSyncSummary,
} from '@/lib/firebase/sync';

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncLocalToCloud: () => Promise<CloudSyncSummary | null>;
  syncCloudToLocal: (mode?: 'merge' | 'replace') => Promise<CloudSyncSummary | null>;
  clearError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('khata_last_cloud_sync');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate connection to Firestore on initial boot
    testConnection().catch((e) => console.warn('Firebase connection test: ', e));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
        } catch (err) {
          console.error('Failed to sync profile: ', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureUserProfile(result.user);
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      console.error('Sign-out error:', err);
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setError(msg);
      throw err;
    }
  }, []);

  const syncLocalToCloud = useCallback(async (): Promise<CloudSyncSummary | null> => {
    if (!user) {
      setError('Please sign in to sync with the cloud.');
      return null;
    }
    try {
      setIsSyncing(true);
      setError(null);
      const summary = await backupLocalToCloud(user);
      setLastSyncedAt(summary.syncedAt);
      return summary;
    } catch (err: unknown) {
      console.error('Sync to cloud error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sync to cloud';
      setError(msg);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const syncCloudToLocal = useCallback(
    async (mode: 'merge' | 'replace' = 'merge'): Promise<CloudSyncSummary | null> => {
      if (!user) {
        setError('Please sign in to restore from cloud.');
        return null;
      }
      try {
        setIsSyncing(true);
        setError(null);
        const summary = await restoreCloudToLocal(user, mode);
        setLastSyncedAt(summary.syncedAt);
        return summary;
      } catch (err: unknown) {
        console.error('Restore from cloud error:', err);
        const msg = err instanceof Error ? err.message : 'Failed to restore from cloud';
        setError(msg);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [user]
  );

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        isSyncing,
        lastSyncedAt,
        error,
        signInWithGoogle,
        signOutUser,
        syncLocalToCloud,
        syncCloudToLocal,
        clearError,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
