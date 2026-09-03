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
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { db as dexieDb, Notebook, Person, Transaction } from '@/lib/db/schema';

export interface CloudSyncSummary {
  notebooksCount: number;
  peopleCount: number;
  transactionsCount: number;
  syncedAt: number;
}

/**
 * Ensures the user profile document exists at /users/{userId}
 */
export async function ensureUserProfile(user: User): Promise<void> {
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
 */
export async function backupLocalToCloud(user: User): Promise<CloudSyncSummary> {
  await ensureUserProfile(user);

  const notebooks = await dexieDb.notebooks.toArray();
  const people = await dexieDb.people.toArray();
  const transactions = await dexieDb.transactions.toArray();

  // 1. Sync Notebooks
  for (const nb of notebooks) {
    const path = `users/${user.uid}/notebooks/${nb.id}`;
    try {
      const nbRef = doc(db, 'users', user.uid, 'notebooks', nb.id);
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // 2. Sync People
  for (const p of people) {
    const path = `users/${user.uid}/people/${p.id}`;
    try {
      const pRef = doc(db, 'users', user.uid, 'people', p.id);
      const payload: Record<string, unknown> = {
        id: p.id,
        userId: user.uid,
        notebookId: p.notebookId,
        name: p.name,
        createdAt: serverTimestamp(),
      };
      if (p.phone && p.phone.trim().length > 0) {
        payload.phone = p.phone.trim();
      }
      await setDoc(pRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // 3. Sync Transactions
  for (const tx of transactions) {
    const path = `users/${user.uid}/transactions/${tx.id}`;
    try {
      const txRef = doc(db, 'users', user.uid, 'transactions', tx.id);
      const payload: Record<string, unknown> = {
        id: tx.id,
        userId: user.uid,
        notebookId: tx.notebookId,
        personId: tx.personId,
        type: tx.type,
        amount: Math.round(tx.amount),
        occurredAt: Math.round(tx.occurredAt),
        createdAt: serverTimestamp(),
      };
      if (tx.note && tx.note.trim().length > 0) {
        payload.note = tx.note.trim();
      }
      await setDoc(txRef, payload);
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
  const notebooksCol = collection(db, 'users', user.uid, 'notebooks');
  const peopleCol = collection(db, 'users', user.uid, 'people');
  const transactionsCol = collection(db, 'users', user.uid, 'transactions');

  let nbDocs;
  let peopleDocs;
  let txDocs;

  try {
    nbDocs = await getDocs(notebooksCol);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notebooks`);
  }

  try {
    peopleDocs = await getDocs(peopleCol);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/people`);
  }

  try {
    txDocs = await getDocs(transactionsCol);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`);
  }

  const parsedNotebooks: Notebook[] = nbDocs.docs.map((docSnap) => {
    const data = docSnap.data();
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

  const parsedPeople: Person[] = peopleDocs.docs.map((docSnap) => {
    const data = docSnap.data();
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

  const parsedTransactions: Transaction[] = txDocs.docs.map((docSnap) => {
    const data = docSnap.data();
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
