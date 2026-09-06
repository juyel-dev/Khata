import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
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

// Firestore batch limit is 500 ops; chunk with a safety margin.
const BATCH_CHUNK_SIZE = 450;
// একটু margin রাখা হয় clock-skew-এর জন্য - পরের delta pull সামান্য
// overlap করে পুরনো কিছু আবার আনতে পারে (harmless, idempotent), কিন্তু কখনো
// কিছু মিস করবে না।
const PULL_SAFETY_BUFFER_MS = 5000;

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

function lastPullKey(uid: string): string {
  return `khata_last_pull_${uid}`;
}

function getCursor(key: string): number {
  try {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(key) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function setCursor(key: string, at: number): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, String(at));
  } catch {
    // ignore
  }
}

/**
 * Backs up local Dexie records into Firestore under /users/{userId}.
 * শুধু নতুন/বদলানো অংশ পাঠায় (delta), batched writes (chunk of 450) দিয়ে -
 * কোনো per-item getDoc read নেই। createdAt local-এ যা আছে তাই পাঠানো হয়
 * (immutable, তাই create/update এক-ই মান - firestore.rules-এ এটাই enforce করা,
 * তাই আগে থেকে ডকুমেন্ট আছে কিনা জানার দরকার হয় না)। updatedAt সবসময় fresh
 * serverTimestamp() - delta-pull/conflict-resolution এটার উপর নির্ভর করে।
 */
export async function backupLocalToCloud(user: User): Promise<CloudSyncSummary> {
  assertCloud();
  await ensureUserProfile(user);

  const lastPush = getCursor(lastPushKey(user.uid));
  const isChanged = (updatedAt?: number, createdAt?: number) =>
    (updatedAt || createdAt || 0) > lastPush;

  const notebooks = (await dexieDb.notebooks.toArray()).filter((nb) =>
    isChanged(nb.updatedAt, nb.createdAt)
  );
  const transactions = (await dexieDb.transactions.toArray()).filter((tx) =>
    isChanged(tx.updatedAt, tx.createdAt)
  );

  type PendingWrite = { ref: ReturnType<typeof doc>; payload: Record<string, unknown> };
  const writes: PendingWrite[] = [];

  for (const nb of notebooks) {
    writes.push({
      ref: doc(db, 'users', user.uid, 'notebooks', nb.id),
      payload: {
        id: nb.id,
        userId: user.uid,
        name: nb.name,
        openingBalance: Math.round(nb.openingBalance),
        color: nb.color || '#2F6B4F',
        icon: nb.icon || 'book',
        archived: Boolean(nb.archived),
        pinned: Boolean(nb.pinned),
        deletedAt: nb.deletedAt || null,
        createdAt: Timestamp.fromMillis(nb.createdAt),
        updatedAt: serverTimestamp(),
      },
    });
  }

  for (const tx of transactions) {
    const payload: Record<string, unknown> = {
      id: tx.id,
      userId: user.uid,
      notebookId: tx.notebookId,
      personName: tx.personName,
      type: tx.type,
      amount: Math.round(tx.amount),
      occurredAt: Math.round(tx.occurredAt),
      deletedAt: tx.deletedAt || null,
      createdAt: Timestamp.fromMillis(tx.createdAt),
      updatedAt: serverTimestamp(),
    };
    if (tx.note && tx.note.trim().length > 0) {
      payload.note = tx.note.trim();
    }
    writes.push({ ref: doc(db, 'users', user.uid, 'transactions', tx.id), payload });
  }

  const path = `users/${user.uid}/{notebooks,transactions}`;
  for (let i = 0; i < writes.length; i += BATCH_CHUNK_SIZE) {
    const chunk = writes.slice(i, i + BATCH_CHUNK_SIZE);
    try {
      const batch = writeBatch(db);
      chunk.forEach(({ ref, payload }) => batch.set(ref, payload, { merge: true }));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_last_cloud_sync', String(now));
  }
  setCursor(lastPushKey(user.uid), now);

  return {
    notebooksCount: notebooks.length,
    transactionsCount: transactions.length,
    syncedAt: now,
  };
}

/**
 * Restores data from Firestore to the local Dexie database.
 * Delta pull (শুধু lastPull-এর পর যা বদলেছে) + সত্যিকারের Last-Write-Wins:
 * cloud-এর updatedAt local record-এর updatedAt-এর চেয়ে নতুন হলেই কেবল
 * local overwrite হয় - পুরনো cloud ডেটা আরেকটা ডিভাইসের নতুন local এডিট
 * blind overwrite করে দেয় না।
 */
export async function restoreCloudToLocal(
  user: User,
  mode: 'merge' | 'replace' = 'merge'
): Promise<CloudSyncSummary> {
  assertCloud();

  if (mode === 'replace') {
    // Explicit "replace everything from cloud" - পুরো collection আনা দরকার, delta না।
    return restoreCloudToLocalFull(user);
  }

  const lastPull = getCursor(lastPullKey(user.uid));
  const cursorTs = Timestamp.fromMillis(lastPull);

  const notebooksCol = collection(db, 'users', user.uid, 'notebooks');
  const transactionsCol = collection(db, 'users', user.uid, 'transactions');

  let nbDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];
  let txDocsArr: Awaited<ReturnType<typeof getDocs>>['docs'] = [];

  try {
    const nbDocs = await getDocs(query(notebooksCol, where('updatedAt', '>', cursorTs)));
    nbDocsArr = nbDocs.docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notebooks`);
  }

  try {
    const txDocs = await getDocs(query(transactionsCol, where('updatedAt', '>', cursorTs)));
    txDocsArr = txDocs.docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`);
  }

  const parsedNotebooks = nbDocsArr.map(parseNotebookDoc);
  const parsedTransactions = txDocsArr.map(parseTransactionDoc);

  const mergedCounts = await mergeWithLWW(parsedNotebooks, parsedTransactions);

  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_last_cloud_sync', String(now));
  }
  setCursor(lastPullKey(user.uid), Math.max(0, now - PULL_SAFETY_BUFFER_MS));

  return {
    notebooksCount: mergedCounts.notebooksCount,
    transactionsCount: mergedCounts.transactionsCount,
    syncedAt: now,
  };
}

// পুরনো "সম্পূর্ণ replace" flow - settings/backup পেজের explicit "Replace"
// import mode-এর জন্য এখনো পুরো collection টেনে আনে (delta না, ইচ্ছাকৃতভাবে
// ধ্বংসাত্মক অপারেশন, ব্যবহারকারী স্পষ্টভাবে এটা চেয়েছে)।
async function restoreCloudToLocalFull(user: User): Promise<CloudSyncSummary> {
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

  const parsedNotebooks = nbDocsArr.map(parseNotebookDoc);
  const parsedTransactions = txDocsArr.map(parseTransactionDoc);

  await dexieDb.transaction('rw', dexieDb.notebooks, dexieDb.transactions, async () => {
    await dexieDb.transactions.clear();
    await dexieDb.notebooks.clear();
    if (parsedNotebooks.length > 0) await dexieDb.notebooks.bulkPut(parsedNotebooks);
    if (parsedTransactions.length > 0) await dexieDb.transactions.bulkPut(parsedTransactions);
  });

  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_last_cloud_sync', String(now));
  }
  setCursor(lastPullKey(user.uid), Math.max(0, now - PULL_SAFETY_BUFFER_MS));

  return {
    notebooksCount: parsedNotebooks.length,
    transactionsCount: parsedTransactions.length,
    syncedAt: now,
  };
}

function parseNotebookDoc(docSnap: { id: string; data: () => any }): Notebook {
  const data = docSnap.data() as any;
  const createdMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
  const updatedMs = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : createdMs;

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
}

function parseTransactionDoc(docSnap: { id: string; data: () => any }): Transaction {
  const data = docSnap.data() as any;
  const createdMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
  const updatedMs = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : createdMs;

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
    updatedAt: updatedMs,
  };
}

// প্রতিটা রেকর্ড আলাদাভাবে compare করে - cloud-এর updatedAt local-এর চেয়ে নতুন
// হলেই কেবল local বদলায় (true Last-Write-Wins), bulkPut দিয়ে blind overwrite না।
async function mergeWithLWW(
  cloudNotebooks: Notebook[],
  cloudTransactions: Transaction[]
): Promise<{ notebooksCount: number; transactionsCount: number }> {
  let notebooksApplied = 0;
  let transactionsApplied = 0;

  await dexieDb.transaction('rw', dexieDb.notebooks, dexieDb.transactions, async () => {
    for (const cloudNb of cloudNotebooks) {
      const localNb = await dexieDb.notebooks.get(cloudNb.id);
      if (!localNb || cloudNb.updatedAt > localNb.updatedAt) {
        await dexieDb.notebooks.put(cloudNb);
        notebooksApplied += 1;
      }
    }
    for (const cloudTx of cloudTransactions) {
      const localTx = await dexieDb.transactions.get(cloudTx.id);
      if (!localTx || cloudTx.updatedAt > localTx.updatedAt) {
        await dexieDb.transactions.put(cloudTx);
        transactionsApplied += 1;
      }
    }
  });

  return { notebooksCount: notebooksApplied, transactionsCount: transactionsApplied };
}

/**
 * পুরো bidirectional sync - আগে cloud থেকে delta+LWW merge (অন্য ডিভাইসের পরিবর্তন
 * প্রথমে মিলিয়ে নেওয়া হয়), তারপর local-এর বাকি বদল push। এই ক্রম জরুরি: push-আগে
 * করলে আরেকটা ডিভাইসের নতুন এডিট এই ডিভাইসের পুরনো local কপি দিয়ে overwrite হয়ে
 * যেতে পারত। Auto-sync (login, reconnect, active-session debounce) সব এই ফাংশন
 * ব্যবহার করে; backup/restore পেজের আলাদা "Backup now" ও "Restore" বাটন এখনো
 * ইচ্ছাকৃতভাবে এক-মুখী (backupLocalToCloud / restoreCloudToLocal) থেকে যায়।
 */
export async function syncBidirectional(user: User): Promise<CloudSyncSummary> {
  await restoreCloudToLocal(user, 'merge');
  return backupLocalToCloud(user);
}
