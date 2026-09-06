'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase/config';
import {
  backupLocalToCloud,
  restoreCloudToLocal,
  syncBidirectional,
  ensureUserProfile,
  CloudSyncSummary,
} from '@/lib/firebase/sync';
import { subscribeToDatabase } from '@/lib/db/operations';

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  isConfigured: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  syncLocalToCloud: () => Promise<CloudSyncSummary | null>;
  syncCloudToLocal: (mode?: 'merge' | 'replace') => Promise<CloudSyncSummary | null>;
  syncAll: () => Promise<CloudSyncSummary | null>;
  clearError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Firebase সেট না থাকলে শুরু থেকেই loading false — effect-এ setState লাগবে না।
  const [loading, setLoading] = useState(() => isFirebaseConfigured);
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

  // Bi-directional full sync (pull+LWW-merge cloud changes first, then push local delta)
  const syncAll = useCallback(async (): Promise<CloudSyncSummary | null> => {
    const activeUser = userRef.current;
    if (!activeUser || !isFirebaseConfigured) return null;
    try {
      setIsSyncing(true);
      setError(null);
      const summary = await syncBidirectional(activeUser);
      setLastSyncedAt(summary.syncedAt);
      return summary;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setError(msg);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncLocalToCloud = useCallback(async (): Promise<CloudSyncSummary | null> => {
    if (!isFirebaseConfigured) {
      setError('Firebase সেট করা নেই। ক্লাউড সিঙ্ক বন্ধ আছে, হিসাব ফোনেই নিরাপদে আছে।');
      return null;
    }
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
      const msg = err instanceof Error ? err.message : 'Failed to sync to cloud';
      setError(msg);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const syncCloudToLocal = useCallback(
    async (mode: 'merge' | 'replace' = 'merge'): Promise<CloudSyncSummary | null> => {
      if (!isFirebaseConfigured) {
        setError('Firebase সেট করা নেই। ক্লাউড সিঙ্ক বন্ধ আছে।');
        return null;
      }
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
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase সেট করা নেই। .env.local-এ Firebase মান বসান।');
      throw new Error('Firebase not configured');
    }
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureUserProfile(result.user);
        try {
          setIsSyncing(true);
          const summary = await syncBidirectional(result.user);
          setLastSyncedAt(summary.syncedAt);
        } catch (syncErr) {
          console.warn('Initial post-login auto-sync warning:', syncErr);
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      throw err;
    }
  }, []);

  const afterEmailAuth = useCallback(async (authedUser: User) => {
    await ensureUserProfile(authedUser);
    try {
      setIsSyncing(true);
      const summary = await syncBidirectional(authedUser);
      setLastSyncedAt(summary.syncedAt);
    } catch (syncErr) {
      console.warn('Initial post-login auto-sync warning:', syncErr);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!isFirebaseConfigured || !auth) {
        setError('Firebase সেট করা নেই। .env.local-এ Firebase মান বসান।');
        throw new Error('Firebase not configured');
      }
      try {
        setError(null);
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (result.user) await afterEmailAuth(result.user);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign in failed';
        setError(msg);
        throw err;
      }
    },
    [afterEmailAuth]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!isFirebaseConfigured || !auth) {
        setError('Firebase সেট করা নেই। .env.local-এ Firebase মান বসান।');
        throw new Error('Firebase not configured');
      }
      try {
        setError(null);
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (result.user) await afterEmailAuth(result.user);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign up failed';
        setError(msg);
        throw err;
      }
    },
    [afterEmailAuth]
  );

  const signOutUser = useCallback(async () => {    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setError(msg);
      throw err;
    }
  }, []);

  // 1. Auth state — Firebase থাকলেই শুনবে। না থাকলে অ্যাপ অফলাইনে চলবে।
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
          if (navigator.onLine) {
            const summary = await syncBidirectional(currentUser);
            setLastSyncedAt(summary.syncedAt);
          }
        } catch (err) {
          console.warn('Auto-sync on auth change:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. নেট ফিরলে একবার sync (প্রতিটা ছোট বদলে নয় — বিল বাঁচাতে)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const handleOnline = async () => {
      setIsOnline(true);
      const currentUser = userRef.current;
      if (currentUser) {
        try {
          setIsSyncing(true);
          const summary = await syncBidirectional(currentUser);
          setLastSyncedAt(summary.syncedAt);
        } catch (err) {
          console.warn('Auto-sync on reconnect:', err);
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

  // 3. Active session-এ প্রতিটা local বদলের কিছুক্ষণ পর auto-sync (debounced) —
  // আগে sync হতো শুধু login/reconnect-এ; একটানা online থেকে কাজ করলে কোনো
  // ট্রিগার ছিল না। এখানে bidirectional (pull+push) ব্যবহার করা হয় যাতে অন্য
  // ডিভাইসের পরিবর্তনও নিয়মিত মিলে যায়, শুধু নিজের এডিট push হয়ে থেমে না যায়।
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeToDatabase(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const currentUser = userRef.current;
        if (!currentUser || !navigator.onLine) return;
        try {
          setIsSyncing(true);
          const summary = await syncBidirectional(currentUser);
          setLastSyncedAt(summary.syncedAt);
        } catch (err) {
          console.warn('Auto-sync (debounced) failed:', err);
        } finally {
          setIsSyncing(false);
        }
      }, 4000);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, []);

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        isSyncing,
        isOnline,
        isConfigured: isFirebaseConfigured,
        lastSyncedAt,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
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
