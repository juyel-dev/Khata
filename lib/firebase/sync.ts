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
import { db as dexieDb, Notebook, Person, Transaction } from '@/lib/db/schema';

export interface CloudSyncSummary {
  notebooksCount: number;
  peopleCount: number;
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

/**
 * Backs up all local Dexie records into Firestore under /users/{userId}
 * createdAt সংরক্ষণ করা হয় — দ্বিতীয়বার ব্যাকআপে তারিখ বদলে যায় না।
 */
export async function backupLocalToCloud(user: User): Promise<CloudSyncSummary> {
  assertCloud();
  await ensureUserProfile(user);

  const notebooks = await dexieDb.notebooks.toArray();
  const people = await dexieDb.people.toArray();
  const transactions = await dexieDb.transactions.toArray();

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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // 2. Sync People (createdAt সংরক্ষণ করে)
  for (const p of people) {
    const path = `users/${user.uid}/people/${p.id}`;
    try {
      const pRef = doc(db, 'users', user.uid, 'people', p.id);
      const existing = await getDoc(pRef);
      const payload: Record<string, unknown> = {
        id: p.id,
        userId: user.uid,
        notebookId: p.notebookId,
        name: p.name,
      };
      if (p.phone && p.phone.trim().length > 0) {
        payload.phone = p.phone.trim();
      }
      if (!existing.exists()) {
        payload.createdAt = serverTimestamp();
        await setDoc(pRef, payload);
      } else {
        await setDoc(pRef, payload, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // 3. Sync Transactions (createdAt সংরক্ষণ করে)
  for (const tx of transactions) {
    const path = `users/${user.uid}/transactions/${tx.id}`;
    try {
      const txRef = doc(db, 'users', user.uid, 'transactions', tx.id);
      const existing = await getDoc(txRef);
      const payload: Record<string, unknown> = {
        id: tx.id,
        userId: user.uid,
        notebookId: tx.notebookId,
        personId: tx.personId,
        type: tx.type,
        amount: Math.round(tx.amount),
        occurredAt: Math.round(tx.occurredAt),
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

  return {
    notebooksCount: notebooks.length,
    peopleCount: people.length,
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
  const peopleCol = collection(db, 'users', user.uid, 'people');
  const transactionsCol = collection(db, 'users', user.uid, 'transactions');

  let nbDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];
  let peopleDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];
  let txDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];

  try {
    const nbDocs = await getDocs(notebooksCol);
    nbDocsArr = nbDocs.docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notebooks`);
  }

  try {
    const peopleDocs = await getDocs(peopleCol);
    peopleDocsArr = peopleDocs.docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/people`);
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
      color: data.color || '#2F6B4F',
      icon: data.icon || 'book',
    };
  });

  const parsedPeople: Person[] = peopleDocsArr.map((docSnap) => {
    const data = docSnap.data() as any;
    const createdMs =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : Date.now();

    return {
      id: data.id || docSnap.id,
      notebookId: data.notebookId,
      name: data.name || 'Unnamed Person',
      phone: data.phone || undefined,
      createdAt: createdMs,
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
      personId: data.personId,
      type: data.type === 'got' ? 'got' : 'gave',
      amount: Number(data.amount) || 0,
      note: data.note || undefined,
      occurredAt: Number(data.occurredAt) || createdMs,
      createdAt: createdMs,
    };
  });

  await dexieDb.transaction(
    'rw',
    dexieDb.notebooks,
    dexieDb.people,
    dexieDb.transactions,
    async () => {
      if (mode === 'replace') {
        await dexieDb.transactions.clear();
        await dexieDb.people.clear();
        await dexieDb.notebooks.clear();
      }

      if (parsedNotebooks.length > 0) {
        await dexieDb.notebooks.bulkPut(parsedNotebooks);
      }
      if (parsedPeople.length > 0) {
        await dexieDb.people.bulkPut(parsedPeople);
      }
      if (parsedTransactions.length > 0) {
        await dexieDb.transactions.bulkPut(parsedTransactions);
      }
    }
  );

  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_last_cloud_sync', String(now));
  }

  return {
    notebooksCount: parsedNotebooks.length,
    peopleCount: parsedPeople.length,
    transactionsCount: parsedTransactions.length,
    syncedAt: now,
  };
}
