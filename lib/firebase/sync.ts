import { User } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { db as dexieDb, Notebook, Transaction } from '@/lib/db/schema';

export interface CloudSyncSummary {
  notebooksCount: number;
  transactionsCount: number;
  syncedAt: number;
}

function assertCloud(): void {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase সেট করা নেই। .env.local-এ Firebase মান বসান।');
  }
}

/**
 * Ensures the user profile document exists at /users/{userId}
 */
export async function ensureUserProfile(user: User): Promise<void> {
  assertCloud();
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || 'user@khata.local',
        displayName: user.displayName || 'Khata User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || 'Khata User',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

function lastPushKey(uid: string): string {
  return `khata_last_push_${uid}`;
}

function getLastPush(uid: string): number {
  try {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(lastPushKey(uid)) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function setLastPush(uid: string, at: number): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(lastPushKey(uid), String(at));
  } catch {
    // ignore
  }
}

/**
 * Backs up local Dexie records into Firestore under /users/{userId}.
 * শুধু নতুন/বদলানো অংশ পাঠায় (delta) — পুরো ডাটা বারবার নয়।
 * createdAt সংরক্ষণ করা হয় — দ্বিতীয়বার ব্যাকআপে তারিখ বদলে যায় না।
 */
export async function backupLocalToCloud(user: User): Promise<CloudSyncSummary> {
  assertCloud();
  await ensureUserProfile(user);

  const lastPush = getLastPush(user.uid);
  const isChanged = (updatedAt?: number, createdAt?: number) =>
    (updatedAt || createdAt || 0) > lastPush;

  const notebooks = (await dexieDb.notebooks.toArray()).filter((nb) =>
    isChanged(nb.updatedAt, nb.createdAt)
  );
  const transactions = (await dexieDb.transactions.toArray()).filter((tx) =>
    isChanged(tx.updatedAt, tx.createdAt)
  );

  // 1. Sync Notebooks (createdAt সংরক্ষণ করে)
  for (const nb of notebooks) {
    const path = `users/${user.uid}/notebooks/${nb.id}`;
    try {
      const nbRef = doc(db, 'users', user.uid, 'notebooks', nb.id);
      const existing = await getDoc(nbRef);
      if (existing.exists()) {
        await setDoc(
          nbRef,
          {
            id: nb.id,
            userId: user.uid,
            name: nb.name,
            openingBalance: Math.round(nb.openingBalance),
            color: nb.color || '#2F6B4F',
            icon: nb.icon || 'book',
            archived: Boolean(nb.archived),
            pinned: Boolean(nb.pinned),
            deletedAt: nb.deletedAt || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(nbRef, {
          id: nb.id,
          userId: user.uid,
          name: nb.name,
          openingBalance: Math.round(nb.openingBalance),
          color: nb.color || '#2F6B4F',
          icon: nb.icon || 'book',
          archived: Boolean(nb.archived),
          pinned: Boolean(nb.pinned),
          deletedAt: nb.deletedAt || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // 2. Sync Transactions (createdAt সংরক্ষণ করে)
  for (const tx of transactions) {
    const path = `users/${user.uid}/transactions/${tx.id}`;
    try {
      const txRef = doc(db, 'users', user.uid, 'transactions', tx.id);
      const existing = await getDoc(txRef);
      const payload: Record<string, unknown> = {
        id: tx.id,
        userId: user.uid,
        notebookId: tx.notebookId,
        personName: tx.personName,
        type: tx.type,
        amount: Math.round(tx.amount),
        occurredAt: Math.round(tx.occurredAt),
        deletedAt: tx.deletedAt || null,
      };
      if (tx.note && tx.note.trim().length > 0) {
        payload.note = tx.note.trim();
      }
      if (!existing.exists()) {
        payload.createdAt = serverTimestamp();
        await setDoc(txRef, payload);
      } else {
        await setDoc(txRef, payload, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_last_cloud_sync', String(now));
  }
  setLastPush(user.uid, now);

  return {
    notebooksCount: notebooks.length,
    transactionsCount: transactions.length,
    syncedAt: now,
  };
}

/**
 * Restores data from Firestore to the local Dexie database
 */
export async function restoreCloudToLocal(
  user: User,
  mode: 'merge' | 'replace' = 'merge'
): Promise<CloudSyncSummary> {
  assertCloud();
  const notebooksCol = collection(db, 'users', user.uid, 'notebooks');
  const transactionsCol = collection(db, 'users', user.uid, 'transactions');

  let nbDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];
  let txDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];

  try {
    const nbDocs = await getDocs(notebooksCol);
    nbDocsArr = nbDocs.docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notebooks`);
  }

  try {
    const txDocs = await getDocs(transactionsCol);
    txDocsArr = txDocs.docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`);
  }

  const parsedNotebooks: Notebook[] = nbDocsArr.map((docSnap) => {
    const data = docSnap.data() as any;
    const createdMs =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : Date.now();
    const updatedMs =
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : createdMs;

    return {
      id: data.id || docSnap.id,
      name: data.name || 'Untitled Notebook',
      openingBalance: Number(data.openingBalance) || 0,
      createdAt: createdMs,
      updatedAt: updatedMs,
      archived: Boolean(data.archived),
      pinned: Boolean(data.pinned),
      deletedAt: data.deletedAt || undefined,
      color: data.color || '#2F6B4F',
      icon: data.icon || 'book',
    };
  });

  const parsedTransactions: Transaction[] = txDocsArr.map((docSnap) => {
    const data = docSnap.data() as any;
    const createdMs =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : Date.now();

    return {
      id: data.id || docSnap.id,
      notebookId: data.notebookId,
      personName: data.personName || 'Unknown',
      type: data.type === 'got' ? 'got' : 'gave',
      amount: Number(data.amount) || 0,
      note: data.note || undefined,
      occurredAt: Number(data.occurredAt) || createdMs,
      deletedAt: data.deletedAt || undefined,
      createdAt: createdMs,
      updatedAt: createdMs,
    };
  });

  await dexieDb.transaction('rw', dexieDb.notebooks, dexieDb.transactions, async () => {
    if (mode === 'replace') {
      await dexieDb.transactions.clear();
      await dexieDb.notebooks.clear();
    }

    if (parsedNotebooks.length > 0) {
      await dexieDb.notebooks.bulkPut(parsedNotebooks);
    }
    if (parsedTransactions.length > 0) {
      await dexieDb.transactions.bulkPut(parsedTransactions);
    }
  });

  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_last_cloud_sync', String(now));
  }

  return {
    notebooksCount: parsedNotebooks.length,
    transactionsCount: parsedTransactions.length,
    syncedAt: now,
  };
}
