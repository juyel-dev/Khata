'use client';

import React, { useState } from 'react';
import { NotebookWithStats } from '@/lib/db/schema';
import { renameNotebook, pinNotebook, archiveNotebook, deleteNotebook, restoreNotebook } from '@/lib/db/operations';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { MoreVertical, Pencil, Pin, PinOff, Archive, ArchiveRestore, Trash2, FolderInput, ArrowRightLeft, X } from 'lucide-react';

interface NotebookKebabMenuProps {
  notebook: NotebookWithStats;
}

export function NotebookKebabMenu({ notebook }: NotebookKebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(notebook.name);
  const { showUndoToast } = useKhataUI();
  const { t } = useI18n();

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRenameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed) {
      await renameNotebook(notebook.id, trimmed);
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  const handlePin = async (e: React.MouseEvent) => {
    stop(e);
    await pinNotebook(notebook.id, !notebook.pinned);
    setIsOpen(false);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    stop(e);
    await archiveNotebook(notebook.id, !notebook.archived);
    setIsOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    stop(e);
    setIsOpen(false);
    const deleted = await deleteNotebook(notebook.id);
    if (deleted) {
      showUndoToast(`${t('deletedToast')} — ${deleted.name}`, async () => {
        await restoreNotebook(deleted.id);
      });
    }
  };

  return (
    <div className="relative shrink-0" onClick={stop}>
      <button
        id={`notebook-kebab-${notebook.id}`}
        type="button"
        onClick={(e) => {
          stop(e);
          setIsOpen((v) => !v);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-dim)] hover:bg-[var(--rule)]/40 hover:text-[var(--ink)] transition-colors cursor-pointer"
        aria-label="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && !isRenaming && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { stop(e); setIsOpen(false); }} />
          <div className="absolute right-0 top-9 z-40 w-48 bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl shadow-xl py-1.5 divide-y divide-[var(--rule)]/60">
            <div className="py-0.5">
              <button
                type="button"
                onClick={(e) => { stop(e); setIsRenaming(true); }}
                className="w-full px-3.5 py-2 text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/30 flex items-center gap-2.5"
              >
                <Pencil className="w-4 h-4 text-[var(--ink-dim)]" />
                {t('rename')}
              </button>
              <button
                type="button"
                onClick={handlePin}
                className="w-full px-3.5 py-2 text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/30 flex items-center gap-2.5"
              >
                {notebook.pinned ? (
                  <PinOff className="w-4 h-4 text-[var(--ink-dim)]" />
                ) : (
                  <Pin className="w-4 h-4 text-[var(--ink-dim)]" />
                )}
                {notebook.pinned ? t('unpin') : t('pin')}
              </button>
            </div>
            <div className="py-0.5">
              <div className="w-full px-3.5 py-2 text-left text-sm font-medium text-[var(--ink-dim)]/50 flex items-center gap-2.5 cursor-not-allowed">
                <FolderInput className="w-4 h-4" />
                {t('group')} <span className="text-[10px] ml-auto">Phase 2</span>
              </div>
              <div className="w-full px-3.5 py-2 text-left text-sm font-medium text-[var(--ink-dim)]/50 flex items-center gap-2.5 cursor-not-allowed">
                <ArrowRightLeft className="w-4 h-4" />
                {t('move')} <span className="text-[10px] ml-auto">Phase 2</span>
              </div>
            </div>
            <div className="py-0.5">
              <button
                type="button"
                onClick={handleArchive}
                className="w-full px-3.5 py-2 text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--rule)]/30 flex items-center gap-2.5"
              >
                {notebook.archived ? (
                  <ArchiveRestore className="w-4 h-4 text-[var(--ink-dim)]" />
                ) : (
                  <Archive className="w-4 h-4 text-[var(--ink-dim)]" />
                )}
                {notebook.archived ? t('unarchiveNotebook') : t('archiveNotebook')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-3.5 py-2 text-left text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-2.5"
              >
                <Trash2 className="w-4 h-4" />
                {t('delete')}
              </button>
            </div>
          </div>
        </>
      )}

      {isRenaming && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={stop} />
          <form
            onSubmit={handleRenameSave}
            onClick={stop}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[85vw] max-w-xs bg-[var(--paper)] border border-[var(--rule)] rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-[var(--ink)]">{t('rename')}</h3>
              <button
                type="button"
                onClick={() => { setIsRenaming(false); setIsOpen(false); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--ink-dim)] hover:bg-[var(--rule)]/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] mb-3"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold"
            >
              {t('save')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
