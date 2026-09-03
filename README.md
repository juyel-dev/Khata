# Khata — Simple Money Notebook 📒

A dead-simple, offline-first digital cash ledger for shopkeepers, small businesses, and individuals to record daily cash flow, balances, and track who owes what.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Dexie (IndexedDB)**, and **Firebase (Firestore & Authentication)**.

---

## Features

- ⚡ **Offline-First**: Instant zero-latency operations backed locally by IndexedDB (Dexie).
- ☁️ **Firebase Cloud Sync & Backup**: Optional Google Sign-In to backup and sync your ledgers across devices via secure Firestore rules.
- 🌐 **Bilingual (English & বাংলা)**: Full support for both English and Bengali with instant switching.
- 🎨 **Theme Support**: Adaptive Light & Dark themes tailored for high contrast and readability.
- 📦 **Manual JSON Import/Export**: One-click download or file restore of all notebooks, people, and transactions.
- 🔒 **Privacy First**: Completely functional without cloud sign-in. Your data remains on your device unless you choose to sync to Firebase.

---

## How to Sync with GitHub

You can sync this codebase to your own GitHub account:

### Method A: Using AI Studio UI (Fastest)
1. In Google AI Studio, open the **Project Settings** menu (top right).
2. Select **Export to GitHub** (or **Download ZIP**).
3. Connect your GitHub account and choose the repository name.

### Method B: Using Git CLI
```bash
# 1. Create an empty repository on https://github.com/new
# 2. Add the remote and push:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

---

## How to Deploy to Vercel

Khata is a standard Next.js 15 App Router application optimized for Vercel deployment:

1. Go to [Vercel](https://vercel.com) and click **"Add New Project"** -> **"Import Git Repository"**.
2. Select your imported GitHub repository.
3. Keep the default build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. *(Optional)* In the **Environment Variables** section, add your Firebase keys if you wish to override defaults:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_ID`
5. Click **Deploy**. Vercel will build and launch your application globally on its Edge Network!

---

## Local Development

```bash
# Install dependencies
npm install

# Run the local development server
npm run dev

# Open http://localhost:3000 in your browser
```
