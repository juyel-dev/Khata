'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Plus, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useNotebooks } from '@/hooks/useKhataDB';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { openTxSheet, activeNotebookId } = useKhataUI();
  const { notebooks } = useNotebooks();

  // Hide bottom nav on deeper drill-downs as per NAVIGATION.md:
  // "Bottom nav is not shown inside the transaction entry sheet, person detail drill-down, or settings — those are stack-navigated"
  const isTopLevelScreen =
    pathname === '/' ||
    pathname === '/history' ||
    pathname.startsWith('/notebook/') && !pathname.includes('/person/') && !pathname.includes('/edit') && pathname !== '/notebook/new';

  if (!isTopLevelScreen) {
    return null;
  }

  const isHome = pathname === '/' || pathname.startsWith('/notebook/');
  const isHistory = pathname === '/history';

  const handleAddClick = () => {
    // If no notebooks yet, can't add transaction directly
    if (notebooks.length === 0) {
      // route to /notebook/new or let openTxSheet handle it
      window.location.href = '/notebook/new';
      return;
    }

    // Determine target notebook
    let targetId = activeNotebookId;
    if (!targetId || !notebooks.some((n) => n.id === targetId)) {
      targetId = notebooks[0].id;
    }

    openTxSheet({
      notebookId: targetId,
      type: 'got',
    });
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
