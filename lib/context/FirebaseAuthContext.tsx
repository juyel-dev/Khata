'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
import { subscribeToDatabase } from '@/lib/db/operations';

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncLocalToCloud: () => Promise<CloudSyncSummary | null>;
  syncCloudToLocal: (mode?: 'merge' | 'replace') => Promise<CloudSyncSummary | null>;
  syncAll: () => Promise<CloudSyncSummary | null>;
  clearError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('khata_last_cloud_sync');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  // Bi-directional full sync (push local first, then merge cloud updates)
  const syncAll = useCallback(async (): Promise<CloudSyncSummary | null> => {
    const activeUser = userRef.current;
    if (!activeUser) return null;
    try {
      setIsSyncing(true);
      setError(null);
      // 1. Push local changes to cloud
      const backupSummary = await backupLocalToCloud(activeUser);
      // 2. Pull & merge cloud updates into local Dexie
      await restoreCloudToLocal(activeUser, 'merge');
      setLastSyncedAt(backupSummary.syncedAt);
      return backupSummary;
    } catch (err: unknown) {
      console.error('Full sync error:', err);
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setError(msg);
      throw err;
    } finally {
      setIsSyncing(false);
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

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureUserProfile(result.user);
        // Automatic sync immediately upon signing in!
        try {
          setIsSyncing(true);
          const backupSummary = await backupLocalToCloud(result.user);
          await restoreCloudToLocal(result.user, 'merge');
          setLastSyncedAt(backupSummary.syncedAt);
        } catch (syncErr) {
          console.warn('Initial post-login auto-sync warning:', syncErr);
        } finally {
          setIsSyncing(false);
        }
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

  // 1. Initial auth state listener + test connection
  useEffect(() => {
    testConnection().catch((e) => console.warn('Firebase connection test: ', e));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
          // Auto-sync on page refresh/session restore if online
          if (navigator.onLine) {
            await backupLocalToCloud(currentUser);
            await restoreCloudToLocal(currentUser, 'merge');
            setLastSyncedAt(Date.now());
          }
        } catch (err) {
          console.error('Auto-sync on auth change warning:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Connectivity listener: When reconnecting to internet, auto-sync if logged in
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const currentUser = userRef.current;
      if (currentUser) {
        try {
          setIsSyncing(true);
          const summary = await backupLocalToCloud(currentUser);
          await restoreCloudToLocal(currentUser, 'merge');
          setLastSyncedAt(summary.syncedAt);
        } catch (err) {
          console.warn('Auto-sync on internet reconnect error:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. Auto-sync on local DB changes when logged in and online (debounced)
  useEffect(() => {
    if (!user) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    const unsubscribe = subscribeToDatabase(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return; // Stored safely in local Dexie IndexedDB when offline
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const currentUser = userRef.current;
        if (currentUser && navigator.onLine) {
          try {
            await backupLocalToCloud(currentUser);
            setLastSyncedAt(Date.now());
          } catch (e) {
            console.warn('Background auto-sync on DB change:', e);
          }
        }
      }, 2500);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [user]);

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        isSyncing,
        isOnline,
        lastSyncedAt,
        error,
        signInWithGoogle,
        signOutUser,
        syncLocalToCloud,
        syncCloudToLocal,
        syncAll,
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
