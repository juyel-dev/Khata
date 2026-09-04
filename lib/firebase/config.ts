import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase সেটিং শুধু environment থেকে আসবে। repo-তে কোনো চাবি রাখা নেই।
// Firebase ছাড়াও অ্যাপ সম্পূর্ণ অফলাইনে চলবে।

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';

export const firebaseConfig: FirebaseOptions | null =
  apiKey && projectId
    ? {
        apiKey,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
      }
    : null;

export const isFirebaseConfigured = firebaseConfig !== null;

export const firestoreDatabaseId =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';

const app = firebaseConfig ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

// Firebase সেট করা না থাকলে db/auth null থাকবে। ব্যবহারের আগে isFirebaseConfigured দেখুন।
export const db = app ? getFirestore(app, firestoreDatabaseId) : (null as unknown as ReturnType<typeof getFirestore>);
export const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
export const googleProvider = new GoogleAuthProvider();

export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    // /test/connection default-deny নিয়মে block করা, তাই false আসা স্বাভাবিক।
    return false;
  }
}
