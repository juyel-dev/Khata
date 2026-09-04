# Khata — Simple Money Notebook 📒

দোকানদার ও সাধারণ মানুষের জন্য সহজ হিসাবের খাতা। কে কত দিল, কে কত নিল, কে কত পায় — সব হিসাব ফোনেই থাকে।

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Dexie (IndexedDB)**, and **Firebase (Firestore & Authentication)**.

---

## Features

- ⚡ **Offline-First**: ইন্টারনেট ছাড়াই চলে। হিসাব ফোনের ভেতরে জমা থাকে।
- ☁️ **Firebase Cloud Sync (ঐচ্ছিক)**: Google দিয়ে ঢুকলে হিসাবের নকল ক্লাউডে থাকে, অন্য ফোনেও পাওয়া যায়।
- 🌐 **Bilingual (English ও বাংলা)**: দুই ভাষায় চলে।
- 🎨 **Light ও Dark থিম**
- 📦 **ব্যাকআপ ফাইল**: এক ক্লিকে সব হিসাব নামিয়ে রাখা ও ফিরিয়ে আনা যায়।
- 🔒 **Privacy First**: অ্যাকাউন্ট ছাড়াই চলে। আপনি না চাইলে হিসাব ফোনের বাইরে যায় না।

---

## Local Development

```bash
# Install
npm install

# Copy env and fill Firebase values (optional — app works offline without it)
cp .env.example .env.local

# Run
npm run dev

# Open http://localhost:3000
```

---

## Deploy to Vercel

1. Vercel-এ **Add New Project** -> **Import Git Repository**।
2. `juyel-dev/Khata` বেছে নিন।
3. Build সেটিং অপরিবর্তিত রাখুন (Framework: Next.js, Build: `next build`)।
4. ক্লাউড সিঙ্ক চাইলে **Environment Variables**-এ Firebase মান বসান:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_ID` (ঐচ্ছিক, খালি রাখলে `(default)`)
5. **Deploy** চাপুন।

Firebase না দিলেও অ্যাপ চলবে, শুধু ক্লাউড সিঙ্ক বন্ধ থাকবে।

---

## Firestore Rules

- `firestore.rules` — কে কার হিসাব দেখতে পারবে তার নিয়ম।
- `security_spec.md` — ১২টা হামলা আটকানোর তালিকা।
- Deploy: `firebase deploy --only firestore:rules`
