import { User, deleteUser } from 'firebase/auth';
import { collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { db as dexieDb } from '@/lib/db/schema';

const BATCH_CHUNK_SIZE = 450;

function assertCloud(): void {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase সেট করা নেই।');
  }
}

// notebooks + transactions subcollection পুরোপুরি batched delete করে (৪৫০/chunk)।
// এটা admin/backend privilege লাগে না - owner নিজেই নিজের ডেটা মুছতে পারে
// (firestore.rules-এ আগে থেকেই owner-delete অনুমতি আছে নোটবুক/ট্রানজেকশনে)।
async function deleteAllUserCloudData(user: User): Promise<void> {
  assertCloud();
  const notebooksCol = collection(db, 'users', user.uid, 'notebooks');
  const transactionsCol = collection(db, 'users', user.uid, 'transactions');

  const [nbSnap, txSnap] = await Promise.all([
    getDocs(notebooksCol).catch((err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notebooks`);
      return null;
    }),
    getDocs(transactionsCol).catch((err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`);
      return null;
    }),
  ]);

  const refs = [
    ...(nbSnap ? nbSnap.docs.map((d) => d.ref) : []),
    ...(txSnap ? txSnap.docs.map((d) => d.ref) : []),
  ];

  for (let i = 0; i < refs.length; i += BATCH_CHUNK_SIZE) {
    const chunk = refs.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/{notebooks,transactions}`);
    }
  }
}

// সব local Dexie ডেটা + sync cursor মুছে - account delete মানে সম্পূর্ণ fresh শুরু।
async function wipeLocalData(): Promise<void> {
  await dexieDb.transaction('rw', dexieDb.notebooks, dexieDb.transactions, async () => {
    await dexieDb.transactions.clear();
    await dexieDb.notebooks.clear();
  });
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('khata_'))
      .forEach((k) => localStorage.removeItem(k));
  }
}

/**
 * নিজের অ্যাকাউন্ট + সব ক্লাউড ডেটা + লোকাল ডেটা মুছে ফেলে (সম্পূর্ণ client-side,
 * কোনো Cloud Function/Admin SDK/Blaze billing plan লাগে না)।
 *
 * ক্রম জরুরি: Firestore subcollection ডেটা আগে মুছতে হবে (owner-delete rule অনুযায়ী,
 * user তখনো signed-in/valid থাকা অবস্থায়), তারপর users/{uid} প্রোফাইল ডকুমেন্ট, সবশেষে
 * Firebase Auth অ্যাকাউন্ট (`user.delete()`) - কারণ auth অ্যাকাউন্ট মুছে গেলে সেই user
 * আর owner-হিসেবে কোনো Firestore write/delete করতে পারবে না।
 *
 * Firebase Auth নিয়মে sensitive operation (`deleteUser`)-এর আগে recent re-login লাগে -
 * caller-কে অবশ্যই reauthenticate (Google popup বা email/password) আগে করাতে হবে,
 * নাহলে এটা `auth/requires-recent-login` error ছুঁড়ে দেবে।
 */
export async function deleteAccountCompletely(user: User): Promise<void> {
  assertCloud();

  await deleteAllUserCloudData(user);

  try {
    await deleteDoc(doc(db, 'users', user.uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  await deleteUser(user);
  await wipeLocalData();
}
