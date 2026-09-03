'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

export const translations = {
  en: {
    appName: 'Khata',
    appTagline: 'Simple Money Notebook',
    home: 'Home',
    add: 'Add',
    history: 'History',
    settings: 'Settings',
    backupAndRestore: 'Backup & Restore',
    archivedNotebooks: 'Archived Notebooks',
    aboutKhata: 'About Khata',
    shareApp: 'Share this app',
    help: 'Help',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Notebooks
    yourNotebooks: 'Your notebooks',
    newNotebook: 'New notebook',
    editNotebook: 'Edit notebook',
    startFirstNotebook: 'Start your first notebook',
    emptyNotebooksDesc: 'A notebook is a separate ledger for your business, cloth shop, or personal cash records.',
    createNotebook: 'Create notebook',
    notebookName: 'Notebook name',
    notebookNamePlaceholder: 'e.g. Cloth Shop, Family, Personal',
    openingBalance: 'Opening balance',
    openingBalanceHint: 'Starting cash in hand (optional)',
    color: 'Color',
    icon: 'Icon',
    saveNotebook: 'Save notebook',
    updateNotebook: 'Update notebook',
    archiveNotebook: 'Archive this notebook',
    unarchiveNotebook: 'Restore to active',
    deletePermanently: 'Delete permanently',
    confirmDeleteNotebook: 'Are you sure you want to permanently delete this notebook and all its transactions? This action cannot be undone.',
    
    // Notebook Detail
    currentBalance: 'Current balance',
    openingBalanceLabel: 'Opening balance',
    updated: 'Updated',
    people: 'People',
    searchPeople: 'Search people...',
    noPeopleYet: 'No entries yet — tap Gave or Got below to add your first one',
    lastTxPrefix: 'Last',
    on: 'on',
    
    // Balance Status
    owesYou: 'Owes you',
    youOwe: 'You owe',
    settled: 'Settled',
    
    // Buttons
    gave: 'Gave',
    got: 'Got',
    save: 'Save',
    update: 'Update',
    cancel: 'Cancel',
    delete: 'Delete',
    undo: 'Undo',
    confirm: 'Confirm',
    
    // Transaction Entry Sheet
    newTransaction: 'New Entry',
    editTransaction: 'Edit Entry',
    amount: 'Amount',
    amountPlaceholder: '0',
    person: 'Person',
    selectOrAddPerson: 'Select or add person',
    addNewPerson: 'Add as new person',
    dateTime: 'Date & time',
    note: 'Note',
    notePlaceholder: 'What was this for? (optional)',
    selectNotebookFirst: 'Select a notebook first',
    whichNotebook: 'Which notebook?',
    
    // Person Detail
    totalGiven: 'Total given',
    totalTaken: 'Total taken',
    allTransactions: 'Transactions',
    noPersonTransactions: 'No transactions recorded for this person.',
    editPersonName: 'Edit person name',
    deletePerson: 'Delete person',
    cannotDeletePersonHasTx: 'Cannot delete person with existing transactions.',
    
    // History
    allNotebooks: 'All notebooks',
    filterHistory: 'Filter',
    filterAll: 'All',
    filterGaveOnly: 'Gave only',
    filterGotOnly: 'Got only',
    noHistory: 'No transactions yet',
    noHistorySub: 'Transactions you record in any notebook will appear here in chronological order.',
    today: 'Today',
    yesterday: 'Yesterday',
    
    // Backup & Restore
    exportBackup: 'Export backup',
    exportBackupDesc: 'Download all your notebooks, people, and transactions as a JSON file.',
    importBackup: 'Import backup',
    importBackupDesc: 'Restore your records from a previously exported JSON backup file.',
    lastBackup: 'Last backup',
    neverBackedUp: 'Never',
    importWarning: 'This will import data from the backup file into your device.',
    importModeMerge: 'Merge with existing data',
    importModeReplace: 'Replace all existing data',
    importSuccess: 'Backup imported successfully!',
    exportSuccess: 'Backup downloaded successfully!',
    
    // Cloud Sync (Firebase)
    cloudSync: 'Cloud Sync & Backup',
    cloudSyncDesc: 'Sync your data securely to Firebase Firestore across all your phones and computers.',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign out',
    syncNow: 'Sync to Cloud',
    restoreFromCloud: 'Restore from Cloud',
    lastCloudSync: 'Last synced',
    syncing: 'Syncing...',
    synced: 'Synced',
    notSignedIn: 'Not signed in',
    signedInAs: 'Signed in as',
    cloudSyncSuccess: 'Data backed up to cloud successfully!',
    cloudRestoreSuccess: 'Data restored from cloud successfully!',
    connectedToFirebase: 'Connected to Firebase Firestore',
    
    // PWA & Offline
    installApp: 'Install App',
    installAppShort: 'Install',
    installAppDesc: 'Install Khata on your phone or PC for full offline access and fast home screen launch.',
    appInstalled: 'Installed',
    installGuideTitle: 'Install Khata App',
    installGuideIOSStep1: '1. Tap the Share button at the bottom of Safari',
    installGuideIOSStep2: '2. Scroll down and tap "Add to Home Screen"',
    installGuideAndroid: 'Tap "Install" below to add Khata to your home screen.',
    installSuccess: 'Khata app installed successfully!',
    offlineMode: 'Offline Mode (Saved to phone)',
    onlineBack: 'Back Online (Synced to Cloud)',
    autoSyncSuccess: 'Data automatically synced to cloud',
    
    // About & Help
    aboutTitle: 'About Khata',
    aboutParagraph1: 'Khata is a dead-simple, offline-first digital ledger built for shopkeepers, small businesses, and individuals who want fast cash records without the complexity of modern accounting apps.',
    aboutParagraph2: 'All your data stays completely private on your device in your browser. No account required, no tracking, and fully functional without an internet connection.',
    helpTitle: 'How Khata works',
    helpGaveExplainer: '• GAVE: When you give money to someone, or supply goods on credit. This increases what they owe you.',
    helpGotExplainer: '• GOT: When someone gives you cash or pays back their balance. This increases your cash-in-hand.',
    helpOweExplainer: '• BALANCES: The app automatically calculates whether each person owes you or you owe them.',
    
    // Toasts
    savedToast: 'Saved',
    updatedToast: 'Updated',
    deletedToast: 'Deleted',
    restoredToast: 'Restored',
    linkCopied: 'Link copied to clipboard',
  },
  bn: {
    appName: 'খাতা',
    appTagline: 'সহজ হিসাবের খাতা',
    home: 'হোম',
    add: 'যোগ করুন',
    history: 'ইতিহাস',
    settings: 'সেটিংস',
    backupAndRestore: 'ব্যাকআপ ও রিস্টোর',
    archivedNotebooks: 'আর্কাইভ করা খাতা',
    aboutKhata: 'খাতা পরিচিতি',
    shareApp: 'শেয়ার করুন',
    help: 'সাহায্য',
    language: 'ভাষা',
    theme: 'থিম',
    light: 'উজ্জ্বল',
    dark: 'গাঢ়',
    system: 'সিস্টেম',
    
    // Notebooks
    yourNotebooks: 'আপনার খাতাসমূহ',
    newNotebook: 'নতুন খাতা',
    editNotebook: 'খাতা সম্পাদনা',
    startFirstNotebook: 'প্রথম খাতা শুরু করুন',
    emptyNotebooksDesc: 'খাতা হলো আপনার কাপড়ের দোকান, ব্যবসা বা ব্যক্তিগত দৈনন্দিন নগদ লেনদেনের আলাদা হিসাব বই।',
    createNotebook: 'খাতা তৈরি করুন',
    notebookName: 'খাতার নাম',
    notebookNamePlaceholder: 'যেমন: কাপড়ের দোকান, পরিবার, ব্যক্তিগত',
    openingBalance: 'শুরুর ব্যালেন্স',
    openingBalanceHint: 'শুরুতে হাতে থাকা নগদ টাকা (ঐচ্ছিক)',
    color: 'রং',
    icon: 'আইকন',
    saveNotebook: 'খাতা সংরক্ষণ করুন',
    updateNotebook: 'খাতা আপডেট করুন',
    archiveNotebook: 'খাতাটি আর্কাইভে রাখুন',
    unarchiveNotebook: 'পুনরায় চালু করুন',
    deletePermanently: 'চিরতরে মুছে ফেলুন',
    confirmDeleteNotebook: 'আপনি কি নিশ্চিত যে এই খাতা এবং এর সকল লেনদেন স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।',
    
    // Notebook Detail
    currentBalance: 'বর্তমান ব্যালেন্স',
    openingBalanceLabel: 'শুরুর ব্যালেন্স',
    updated: 'হালনাগাদ',
    people: 'গ্রাহক / ব্যক্তি',
    searchPeople: 'ব্যক্তি খুঁজুন...',
    noPeopleYet: 'এখনও কোনো হিসাব নেই — নিচে দিলাম বা পেলাম চাপুন',
    lastTxPrefix: 'সর্বশেষ',
    on: 'তারিখে',
    
    // Balance Status
    owesYou: 'পাবেন',
    youOwe: 'দিতে হবে',
    settled: 'পরিশোধিত',
    
    // Buttons
    gave: 'দিলাম',
    got: 'পেলাম',
    save: 'সংরক্ষণ',
    update: 'আপডেট',
    cancel: 'বাতিল',
    delete: 'মুছে ফেলুন',
    undo: 'ফিরিয়ে নিন',
    confirm: 'নিশ্চিত করুন',
    
    // Transaction Entry Sheet
    newTransaction: 'নতুন লেনদেন',
    editTransaction: 'লেনদেন পরিবর্তন',
    amount: 'টাকার পরিমাণ',
    amountPlaceholder: '০',
    person: 'ব্যক্তি',
    selectOrAddPerson: 'ব্যক্তি নির্বাচন বা নাম লিখুন',
    addNewPerson: 'নতুন ব্যক্তি হিসেবে যোগ করুন',
    dateTime: 'তারিখ ও সময়',
    note: 'বিবরণ',
    notePlaceholder: 'কি বাবদ ছিল? (ঐচ্ছিক)',
    selectNotebookFirst: 'প্রথমে একটি খাতা নির্বাচন করুন',
    whichNotebook: 'কোন খাতা?',
    
    // Person Detail
    totalGiven: 'মোট দিয়েছেন',
    totalTaken: 'মোট পেয়েছেন',
    allTransactions: 'লেনদেনসমূহ',
    noPersonTransactions: 'এই ব্যক্তির জন্য কোনো লেনদেন লিপিবদ্ধ নেই।',
    editPersonName: 'নাম পরিবর্তন',
    deletePerson: 'ব্যক্তিকে মুছুন',
    cannotDeletePersonHasTx: 'লেনদেন থাকা অবস্থায় মুছে ফেলা যাবে না।',
    
    // History
    allNotebooks: 'সব খাতা',
    filterHistory: 'ফিল্টার',
    filterAll: 'সকল',
    filterGaveOnly: 'শুধু দিলাম',
    filterGotOnly: 'শুধু পেলাম',
    noHistory: 'এখনও কোনো লেনদেন নেই',
    noHistorySub: 'যেকোনো খাতায় আপনার যোগ করা লেনদেনগুলো এখানে পর্যায়ক্রমে দেখা যাবে।',
    today: 'আজ',
    yesterday: 'গতকাল',
    
    // Backup & Restore
    exportBackup: 'ব্যাকআপ ডাউনলোড',
    exportBackupDesc: 'আপনার সমস্ত খাতা, ব্যক্তি এবং লেনদেন একটি JSON ফাইলে সংরক্ষণ করুন।',
    importBackup: 'ব্যাকআপ ফাইল আনুন',
    importBackupDesc: 'পূর্বে সংরক্ষিত ব্যাকআপ ফাইল থেকে সকল তথ্য ফিরিয়ে আনুন।',
    lastBackup: 'সর্বশেষ ব্যাকআপ',
    neverBackedUp: 'কখনও করা হয়নি',
    importWarning: 'এটি আপনার ডিভাইসে ব্যাকআপ ফাইল থেকে তথ্য লোড করবে।',
    importModeMerge: 'বর্তমান তথ্যের সাথে যোগ করুন',
    importModeReplace: 'বর্তমান সব তথ্য প্রতিস্থাপন করুন',
    importSuccess: 'ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!',
    exportSuccess: 'ব্যাকআপ ফাইল ডাউনলোড হয়েছে!',
    
    // Cloud Sync (Firebase)
    cloudSync: 'ক্লাউড সিঙ্ক ও ব্যাকআপ',
    cloudSyncDesc: 'আপনার সকল ডেটা নিরাপদে ফায়ারবেস ক্লাউডে সিঙ্ক করুন এবং যেকোনো ডিভাইস থেকে ব্যবহার করুন।',
    signInWithGoogle: 'গুগল দিয়ে সাইন ইন করুন',
    signOut: 'লগ আউট',
    syncNow: 'ক্লাউডে সিঙ্ক করুন',
    restoreFromCloud: 'ক্লাউড থেকে আনুন',
    lastCloudSync: 'সর্বশেষ ক্লাউড সিঙ্ক',
    syncing: 'সিঙ্ক হচ্ছে...',
    synced: 'সিঙ্ক সম্পন্ন',
    notSignedIn: 'সাইন ইন করা নেই',
    signedInAs: 'অ্যাকাউন্ট',
    cloudSyncSuccess: 'ক্লাউডে ডেটা সফলভাবে সংরক্ষিত হয়েছে!',
    cloudRestoreSuccess: 'ক্লাউড থেকে ডেটা সফলভাবে পুনরুদ্ধার হয়েছে!',
    connectedToFirebase: 'ফায়ারবেস ক্লাউড কানেক্টেড',
    
    // PWA & Offline
    installApp: 'অ্যাপ ইনস্টল করুন',
    installAppShort: 'ইনস্টল',
    installAppDesc: 'ইন্টারনেট ছাড়াও সহজে হিসাব রাখতে ও দ্রুত ব্যবহার করতে খাতা অ্যাপ ইনস্টল করুন।',
    appInstalled: 'ইনস্টল সম্পন্ন',
    installGuideTitle: 'খাতা অ্যাপ ইনস্টল করুন',
    installGuideIOSStep1: '১. সাফারির নিচে শেয়ার (Share) বাটনে ট্যাপ করুন',
    installGuideIOSStep2: '২. নিচে গিয়ে "Add to Home Screen" অপশনে ট্যাপ করুন',
    installGuideAndroid: 'খাতা অ্যাপটি হোম স্ক্রিনে ইনস্টল করতে নিচের "ইনস্টল" বাটনে চাপুন।',
    installSuccess: 'খাতা অ্যাপ সফলভাবে ইনস্টল হয়েছে!',
    offlineMode: 'অফলাইন মোড (ফোনে সেভ হচ্ছে)',
    onlineBack: 'ইন্টারনেট চালু (ক্লাউডে সিঙ্ক সম্পন্ন)',
    autoSyncSuccess: 'ক্লাউডে অটো-সিঙ্ক সফল হয়েছে',
    
    // About & Help
    aboutTitle: 'খাতা পরিচিতি',
    aboutParagraph1: 'খাতা হলো একটি অতি-সহজ, সম্পূর্ণ অফলাইন ডিজিটাল খাতা যা দোকানদার ও সাধারণ মানুষের জন্য তৈরি। জটিল কোনো হিসাব বা অ্যাকাউন্টের ঝামেলা ছাড়াই দ্রুত লেনদেন লিখে রাখার জন্য এটি কার্যকর।',
    aboutParagraph2: 'আপনার সমস্ত তথ্য সম্পূর্ণ নিরাপদে আপনার নিজস্ব ফোনেই সংরক্ষিত থাকে। ইন্টারনেট বা অ্যাকাউন্টের কোনো প্রয়োজন নেই।',
    helpTitle: 'খাতা কিভাবে কাজ করে?',
    helpGaveExplainer: '• দিলাম: কাউকে নগদ টাকা বা বাকিতে পণ্য দিলে এটি চাপুন। এতে তারা আপনার কাছে দেনাদার হবে (আপনি পাবেন)।',
    helpGotExplainer: '• পেলাম: কেউ টাকা পরিশোধ করলে বা নগদ টাকা হাতে এলে এটি চাপুন। এতে আপনার ক্যাশ ব্যালেন্স বাড়বে।',
    helpOweExplainer: '• ব্যালেন্স: কে কত টাকা পাবে বা আপনাকে কত দিতে হবে তা অ্যাপ নিজেই নিখুঁতভাবে হিসাব করে দেখায়।',
    
    // Toasts
    savedToast: 'সংরক্ষিত হয়েছে',
    updatedToast: 'আপডেট হয়েছে',
    deletedToast: 'মুছে ফেলা হয়েছে',
    restoredToast: 'পুনরুদ্ধার করা হয়েছে',
    linkCopied: 'লিংক কপি করা হয়েছে',
  },
} as const;

export type TranslationKey = keyof typeof translations['en'];

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('khata_lang') as Language;
      if (savedLang === 'en' || savedLang === 'bn') {
        return savedLang;
      }
    }
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_lang', newLang);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[lang] || translations.en;
    let text: string = dict[key] || translations.en[key] || (key as string);

    if (params) {
      Object.entries(params).forEach(([k, val]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
