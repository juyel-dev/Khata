'use client';

import React from 'react';
import Link from 'next/link';
import { useNotebooks } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { useI18n } from '@/lib/i18n';
import { NotebookCard } from '@/components/notebook/NotebookCard';
import { HomeBanner } from '@/components/nav/HomeBanner';
import { Menu, Plus, BookOpen, BookCheck, Cloud, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { notebooks, loading } = useNotebooks();
  const { openDrawer, showUndoToast } = useKhataUI();
  const { user, isSyncing, syncLocalToCloud } = useFirebaseAuth();
  const { t } = useI18n();

  const handleQuickSync = async () => {
    if (!user) {
      openDrawer();
      return;
    }
    const res = await syncLocalToCloud();
    if (res) {
      showUndoToast(t('cloudSyncSuccess'), () => {});
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
      {/* 1. Header: Hamburger menu icon + App Wordmark + Cloud status */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            id="home-hamburger-btn"
            type="button"
            onClick={openDrawer}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 stroke-[2]" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {t('appName')}
            </h1>
          </div>
        </div>

        {/* Cloud Sync Quick Action / Indicator */}
        <button
          id="home-cloud-sync-btn"
          type="button"
          onClick={handleQuickSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--rule)] bg-[var(--paper-card)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--rule)]/30 active:scale-95 transition-all shadow-2xs"
          title={user ? 'Sync with Firebase Firestore' : 'Connect to Cloud'}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : (
            <Cloud
              className={`w-3.5 h-3.5 ${
                user ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--ink-dim)]'
              }`}
            />
          )}
          {user ? (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
              {isSyncing ? 'Syncing' : 'Synced'}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--ink-dim)]">Sync</span>
          )}
        </button>
      </header>

      {/* 2. Home Banner: Auto-swipe carousel */}
      <HomeBanner />

      {/* 3. Section label: "Your notebooks" */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
          {t('yourNotebooks')}
        </h2>
        {notebooks.length > 0 && (
          <span className="text-xs text-[var(--ink-dim)] font-medium num-tabular">
            {notebooks.length}
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full h-20 rounded-xl bg-[var(--rule)]/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* 4. Notebooks List or Empty State */}
      {!loading && notebooks.length > 0 && (
        <div className="space-y-3">
          {notebooks.map((nb) => (
            <NotebookCard key={nb.id} notebook={nb} />
          ))}

          {/* 5. "+ New notebook" as a full-width dashed-border row at bottom of list */}
          <Link
            id="home-btn-new-notebook-row"
            href="/notebook/new"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-dashed border-[var(--rule)] hover:border-[var(--accent)] text-[var(--ink-dim)] hover:text-[var(--accent)] hover:bg-[var(--paper-card)] active:scale-98 transition-all font-semibold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('newNotebook')}</span>
          </Link>
        </div>
      )}

      {/* Empty State (zero notebooks — first launch) */}
      {!loading && notebooks.length === 0 && (
        <div
          id="home-empty-state"
          className="rounded-2xl border border-[var(--rule)] bg-[var(--paper-card)] p-8 text-center my-4 shadow-xs"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <BookCheck className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h3 className="text-lg font-bold text-[var(--ink)] mb-2">
            {t('startFirstNotebook')}
          </h3>

          <p className="text-sm text-[var(--ink-dim)] leading-relaxed max-w-xs mx-auto mb-6">
            {t('emptyNotebooksDesc')}
          </p>

          <Link
            id="home-btn-create-first-notebook"
            href="/notebook/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('createNotebook')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
