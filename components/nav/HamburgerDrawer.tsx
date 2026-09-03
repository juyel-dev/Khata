'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { useI18n } from '@/lib/i18n';
import {
  X,
  Languages,
  Database,
  Archive,
  Settings,
  Share2,
  HelpCircle,
  BookOpen,
  Cloud,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function HamburgerDrawer() {
  const { isDrawerOpen, closeDrawer, showUndoToast } = useKhataUI();
  const { lang, setLang, t } = useI18n();
  const { user, isSyncing, signInWithGoogle, signOutUser, syncLocalToCloud } =
    useFirebaseAuth();

  const handleShare = async () => {
    const shareData = {
      title: 'Khata — Simple Money Notebook',
      text: 'Khata: A simple, offline-first cash ledger for shops and individuals.',
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled or ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      showUndoToast(t('linkCopied'), () => {});
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div id="khata-drawer-wrapper" className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            id="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer Menu */}
          <motion.div
            id="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[var(--paper)] border-r border-[var(--rule)] shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-[var(--rule)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base tracking-tight leading-tight text-[var(--ink)]">
                    {t('appName')}
                  </h2>
                  <p className="text-xs text-[var(--ink-dim)]">{t('appTagline')}</p>
                </div>
              </div>
              <button
                id="drawer-close-btn"
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
              {/* Google / Cloud Sync Card */}
              {user ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          width={28}
                          height={28}
                          className="w-7 h-7 rounded-full border border-emerald-500/30 shrink-0 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[var(--ink)] truncate">
                          {user.displayName || user.email}
                        </p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t('connectedToFirebase')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={signOutUser}
                      className="p-1 rounded text-[var(--ink-dim)] hover:text-[var(--danger)]"
                      title={t('signOut')}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={async () => {
                        const res = await syncLocalToCloud();
                        if (res) showUndoToast(t('cloudSyncSuccess'), () => {});
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold shadow-xs hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Cloud className="w-3 h-3" />
                      )}
                      <span>{isSyncing ? t('syncing') : t('syncNow')}</span>
                    </button>
                    <Link
                      href="/settings/backup"
                      onClick={closeDrawer}
                      className="py-1.5 px-2.5 rounded-lg border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] text-xs font-semibold hover:bg-[var(--rule)]/40 transition-all text-center"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[var(--paper-card)] border border-[var(--rule)] space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-[var(--ink)]">
                      {t('cloudSync')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-dim)] leading-tight">
                    Sign in to backup and sync your Khata across all devices.
                  </p>
                  <button
                    id="drawer-signin-btn"
                    type="button"
                    onClick={signInWithGoogle}
                    className="w-full py-2 px-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{t('signInWithGoogle')}</span>
                  </button>
                </div>
              )}

              {/* 1. Language Toggle */}
              <div className="px-3 py-2.5 rounded-xl bg-[var(--rule)]/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--ink)]">
                  <Languages className="w-4 h-4 text-[var(--accent)]" />
                  <span>{t('language')}</span>
                </div>
                <div className="flex items-center bg-[var(--paper)] p-0.5 rounded-lg border border-[var(--rule)] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      lang === 'en'
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('bn')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      lang === 'bn'
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              {/* 2. Backup & Restore */}
              <Link
                id="drawer-nav-backup"
                href="/settings/backup"
                onClick={closeDrawer}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
              >
                <Database className="w-4 h-4 text-[var(--ink-dim)]" />
                <span>{t('backupAndRestore')}</span>
              </Link>

              {/* 3. Archived Notebooks */}
              <Link
                id="drawer-nav-archived"
                href="/settings/archived"
                onClick={closeDrawer}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
              >
                <Archive className="w-4 h-4 text-[var(--ink-dim)]" />
                <span>{t('archivedNotebooks')}</span>
              </Link>

              {/* 4. Settings */}
              <Link
                id="drawer-nav-settings"
                href="/settings"
                onClick={closeDrawer}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
              >
                <Settings className="w-4 h-4 text-[var(--ink-dim)]" />
                <span>{t('settings')}</span>
              </Link>

              {/* 5. Share App */}
              <button
                id="drawer-btn-share"
                type="button"
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-[var(--ink-dim)]" />
                <span>{t('shareApp')}</span>
              </button>

              {/* 6. Help / Explainer */}
              <Link
                id="drawer-nav-help"
                href="/about"
                onClick={closeDrawer}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[var(--ink-dim)]" />
                <span>{t('help')}</span>
              </Link>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--rule)] text-xs text-[var(--ink-dim)]">
              <p className="font-semibold text-[var(--ink)]">Khata • {t('appTagline')}</p>
              <p className="mt-0.5 opacity-80">100% Offline & Private</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
