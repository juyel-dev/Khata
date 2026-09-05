'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotebooks } from '@/hooks/useKhataDB';
import { archiveNotebook, deleteNotebookPermanently } from '@/lib/db/operations';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { formatPaise } from '@/lib/money';
import { IconHelper } from '@/components/shared/IconHelper';
import { ArrowLeft, Archive, RefreshCw, Trash2 } from 'lucide-react';

export default function ArchivedNotebooksPage() {
  const router = useRouter();
  const { notebooks, loading } = useNotebooks(true);
  const { t } = useI18n();
  const { showUndoToast } = useKhataUI();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const archivedNotebooks = notebooks.filter((n) => n.archived);

  const handleRestore = async (id: string, name: string) => {
    try {
      await archiveNotebook(id, false);
      showUndoToast(`${t('unarchiveNotebook')} — ${name}`);
    } catch (err) {
      console.error('Failed to unarchive notebook:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotebookPermanently(id);
      setDeleteConfirmId(null);
      showUndoToast(t('deletedToast'));
    } catch (err) {
      console.error('Failed to permanently delete notebook:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          id="archived-back-btn"
          type="button"
          onClick={() => router.push('/settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--ink)]">{t('archivedNotebooks')}</h1>
      </header>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && archivedNotebooks.length > 0 && (
        <div className="space-y-3">
          {archivedNotebooks.map((nb) => (
            <div
              key={nb.id}
              className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: nb.color || '#2F6B4F' }}
                  >
                    <IconHelper name={nb.icon || 'book'} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--ink)] truncate">
                      {nb.name}
                    </h3>
                    <p className="text-xs text-[var(--ink-dim)]">
                      {formatPaise(nb.currentBalance)} • {nb.transactionCount} entries
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id={`restore-nb-${nb.id}`}
                    type="button"
                    onClick={() => handleRestore(nb.id, nb.name)}
                    className="px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('unarchiveNotebook')}</span>
                  </button>

                  <button
                    id={`delete-nb-${nb.id}`}
                    type="button"
                    onClick={() => setDeleteConfirmId(nb.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confirm Delete prompt */}
              {deleteConfirmId === nb.id && (
                <div className="pt-2 border-t border-[var(--rule)] flex items-center justify-between text-xs">
                  <span className="text-[var(--danger)] font-medium">Delete permanently?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 rounded-md border border-[var(--rule)] text-[var(--ink-dim)]"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(nb.id)}
                      className="px-2.5 py-1 rounded-md bg-[var(--danger)] text-white font-bold"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && archivedNotebooks.length === 0 && (
        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--paper-card)] p-8 text-center my-6 shadow-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--rule)]/30 text-[var(--ink-dim)] flex items-center justify-center">
            <Archive className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink)] mb-1">No archived notebooks</h3>
          <p className="text-xs text-[var(--ink-dim)]">
            When you archive a notebook, it will appear here safely out of the way.
          </p>
        </div>
      )}
    </div>
  );
}
