'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BookOpen, Plus, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { openTxSheet } = useKhataUI();

  // শুধু মূল পর্দায় নিচের মেনু দেখাবে — ভেতরের পেজ, সেটিংসে নয়।
  const isTopLevelScreen =
    pathname === '/' || pathname === '/history' || pathname === '/notebook/view';

  if (!isTopLevelScreen) {
    return null;
  }

  const isHome = pathname === '/' || pathname === '/notebook/view';
  const isHistory = pathname === '/history';

  // Home-e "+" = notun khata. Khata-r vitore (/notebook/view?id=xxx) "+" = oi khata-y transaction add.
  const insideNotebookId = pathname === '/notebook/view' ? searchParams.get('id') : null;

  const handleAddClick = () => {
    if (insideNotebookId) {
      openTxSheet({ notebookId: insideNotebookId, type: 'got' });
      return;
    }
    window.location.href = '/notebook/new';
  };

  return (
    <nav
      id="khata-bottom-nav"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--paper)]/95 backdrop-blur-md border-t border-[var(--rule)] pb-safe"
    >
      <div className="max-w-md mx-auto h-16 px-6 flex items-center justify-between">
        {/* Home */}
        <Link
          id="bottom-nav-home"
          href="/"
          className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
            isHome && !isHistory ? 'text-[var(--accent)] font-semibold' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] whitespace-nowrap">{t('home')}</span>
        </Link>

        {/* Center Prominent Add Button */}
        <div className="relative -top-3">
          <button
            id="bottom-nav-add"
            type="button"
            onClick={handleAddClick}
            aria-label={t('add')}
            className="w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-hover)] active:scale-95 transition-all flex items-center justify-center cursor-pointer border-4 border-[var(--paper)]"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* History */}
        <Link
          id="bottom-nav-history"
          href="/history"
          className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
            isHistory ? 'text-[var(--accent)] font-semibold' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] whitespace-nowrap">{t('history')}</span>
        </Link>
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
