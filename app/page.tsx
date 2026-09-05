'use client';

import React from 'react';
import Link from 'next/link';
import { useNotebooks } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { useI18n } from '@/lib/i18n';
import { NotebookCard } from '@/components/notebook/NotebookCard';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { HomeBanners } from '@/components/home/HomeBanners';
import { Menu, Plus, BookOpen, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { notebooks, loading: nbLoading } = useNotebooks();
  const { openDrawer, showUndoToast } = useKhataUI();
  const { user, isSyncing, isOnline, syncLocalToCloud } = useFirebaseAuth();
  const { t } = useI18n();

  const handleQuickSync = async () => {
    if (!user) {
      openDrawer();
      return;
    }
    const res = await syncLocalToCloud();
    if (res) {
      showUndoToast(t('cloudSyncSuccess'));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-28">
      {/* Top Bar */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button
            id="home-hamburger-btn"
            type="button"
            onClick={openDrawer}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 stroke-[2]" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
                {t('appName')}
              </h1>
              <p className="text-[10px] text-[var(--ink-dim)] font-medium -mt-0.5">{t('appTagline')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <PWAInstallButton variant="header" />

          <button
            id="home-cloud-sync-btn"
            type="button"
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="h-8 px-2.5 rounded-lg border border-[var(--rule)] bg-[var(--paper-card)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--rule)]/30 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title={user ? 'Sync with Cloud' : 'Connect to Cloud'}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : !isOnline ? (
              <CloudOff className="w-3.5 h-3.5 text-[var(--ink-dim)]" />
            ) : (
              <Cloud className={`w-3.5 h-3.5 ${user ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--ink-dim)]'}`} />
            )}
            {user ? (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold hidden xs:inline">
                {isSyncing ? 'Syncing' : 'Cloud'}
              </span>
            ) : (
              <span className="text-[11px] text-[var(--ink-dim)] hidden xs:inline">Offline</span>
            )}
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="mb-4">
        <HomeBanners />
      </div>

      {/* Khata list - only content on Home */}
      <div className="space-y-3">
        {nbLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notebooks.length > 0 ? (
          notebooks.map((nb) => <NotebookCard key={nb.id} notebook={nb} />)
        ) : (
          <div className="py-12 text-center text-xs text-[var(--ink-dim)] bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-6">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-[var(--ink-dim)]/50" />
            <p className="font-semibold text-sm text-[var(--ink)] mb-1">{t('startFirstNotebook')}</p>
            <p className="text-[11px] text-[var(--ink-dim)] mb-4">{t('emptyNotebooksDesc')}</p>
          </div>
        )}

        <Link
          id="home-btn-new-notebook-row"
          href="/notebook/new"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-[var(--rule)] hover:border-[var(--accent)] text-[var(--ink-dim)] hover:text-[var(--accent)] hover:bg-[var(--paper-card)] active:scale-98 transition-all font-semibold text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('newNotebook')}</span>
        </Link>
      </div>
    </div>
  );
}
