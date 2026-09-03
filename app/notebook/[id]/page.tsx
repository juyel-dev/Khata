'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotebook, usePeople } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { BalanceHeader } from '@/components/notebook/BalanceHeader';
import { PersonRow } from '@/components/person/PersonRow';
import { GaveGotButtons } from '@/components/transaction/GaveGotButtons';
import {
  ArrowLeft,
  MoreVertical,
  Search,
  ArrowDown,
  Edit2,
  Archive,
  Trash2,
} from 'lucide-react';

export default function NotebookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const notebookId = resolvedParams.id;
  const router = useRouter();
  const { t } = useI18n();
  const { openTxSheet, setActiveNotebookId } = useKhataUI();

  const { notebook, loading: nbLoading } = useNotebook(notebookId);
  const { people, loading: peopleLoading } = usePeople(notebookId);

  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Keep active notebook id updated
  React.useEffect(() => {
    if (notebookId) {
      setActiveNotebookId(notebookId);
    }
  }, [notebookId, setActiveNotebookId]);

  if (nbLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-[var(--rule)]/40 rounded-lg w-1/2" />
        <div className="h-36 bg-[var(--rule)]/40 rounded-2xl" />
        <div className="h-60 bg-[var(--rule)]/40 rounded-xl" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-base text-[var(--ink-dim)] mb-4">Notebook not found</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-28">
      {/* 1. Header: Back Arrow, Notebook Name, Overflow Menu */}
      <header className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <button
            id="nb-detail-back-btn"
            type="button"
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
          <h1 className="text-lg font-bold text-[var(--ink)] truncate">
            {notebook.name}
          </h1>
        </div>

        {/* Overflow Menu */}
        <div className="relative shrink-0">
          <button
            id="nb-detail-overflow-btn"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all"
            aria-label="Notebook options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div
                id="nb-overflow-dropdown"
                className="absolute right-0 top-full mt-1 w-48 bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl shadow-xl z-30 py-1.5 divide-y divide-[var(--rule)]"
              >
                <Link
                  id="nb-menu-edit"
                  href={`/notebook/${notebook.id}/edit`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>{t('editNotebook')}</span>
                </Link>
                <Link
                  id="nb-menu-archive"
                  href={`/notebook/${notebook.id}/edit`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--ink-dim)] hover:bg-[var(--rule)]/40 hover:text-[var(--ink)] transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>{t('archiveNotebook')}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. Balance Header Band */}
      <BalanceHeader
        currentBalance={notebook.currentBalance}
        openingBalance={notebook.openingBalance}
        updatedAt={notebook.updatedAt}
        notebookName={notebook.name}
        color={notebook.color}
      />

      {/* 3. Section Label: "People" with Inline Search */}
      <div className="mt-6 mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
          {t('people')} ({people.length})
        </h2>

        {people.length > 3 && (
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPeople')}
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-lg pl-8 pr-3 py-1 text-xs text-[var(--ink)] placeholder:text-[var(--ink-dim)]/50 focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}
      </div>

      {/* 4. List of Person Rows */}
      {people.length > 0 ? (
        <div className="border-t border-[var(--rule)]">
          {filteredPeople.map((p) => (
            <PersonRow key={p.id} person={p} notebookId={notebook.id} />
          ))}
          {filteredPeople.length === 0 && searchQuery && (
            <div className="py-8 text-center text-xs text-[var(--ink-dim)] italic">
              No matching people found
            </div>
          )}
        </div>
      ) : (
        /* Empty State: Short line pointing toward Gave/Got buttons */
        <div
          id="notebook-empty-people"
          className="rounded-2xl border border-dashed border-[var(--rule)] p-8 text-center my-6 bg-[var(--paper-card)]/50"
        >
          <p className="text-sm font-medium text-[var(--ink-dim)] mb-4 max-w-xs mx-auto leading-relaxed">
            {t('noPeopleYet')}
          </p>
          <div className="flex justify-center text-[var(--accent)] animate-bounce">
            <ArrowDown className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* 5. Sticky Bottom Gave / Got Buttons */}
      <GaveGotButtons
        onGave={() =>
          openTxSheet({
            notebookId: notebook.id,
            type: 'gave',
          })
        }
        onGot={() =>
          openTxSheet({
            notebookId: notebook.id,
            type: 'got',
          })
        }
      />
    </div>
  );
}
