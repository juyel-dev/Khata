'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePerson, useTransactions, useNotebook } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { formatPaise } from '@/lib/money';
import { updatePerson, deletePerson } from '@/lib/db/operations';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { GaveGotButtons } from '@/components/transaction/GaveGotButtons';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import {
  ArrowLeft,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string; personId: string }>;
}) {
  const resolvedParams = use(params);
  const notebookId = resolvedParams.id;
  const personId = resolvedParams.personId;

  const router = useRouter();
  const { t } = useI18n();
  const { openTxSheet, showUndoToast } = useKhataUI();

  const { person, loading: personLoading } = usePerson(personId);
  const { notebook } = useNotebook(notebookId);
  const { transactions, loading: txLoading } = useTransactions({ personId });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  if (personLoading || txLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-[var(--rule)]/40 rounded-lg w-1/3" />
        <div className="h-32 bg-[var(--rule)]/40 rounded-2xl" />
        <div className="h-64 bg-[var(--rule)]/40 rounded-xl" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-base text-[var(--ink-dim)] mb-4">Person not found</p>
        <button
          onClick={() => router.push(`/notebook/${notebookId}`)}
          className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold text-sm"
        >
          Back to Notebook
        </button>
      </div>
    );
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    try {
      await updatePerson(person.id, editedName.trim());
      setIsEditingName(false);
      showUndoToast(t('updatedToast'), () => {});
    } catch (err) {
      console.error('Failed to update person name:', err);
    }
  };

  const handleDeletePerson = async () => {
    setIsMenuOpen(false);
    if (person.transactionCount > 0) {
      showUndoToast(t('cannotDeletePersonHasTx'), () => {});
      return;
    }
    const success = await deletePerson(person.id);
    if (success) {
      showUndoToast(t('deletedToast'), () => {});
      router.push(`/notebook/${notebookId}`);
    }
  };

  // Determine Net Banner Styling
  // net = totalGiven - totalTaken
  let netStatusText = t('settled');
  let netColorClass = 'text-[var(--neutral-settled)]';
  let netBgClass = 'bg-[var(--paper-card)] border-[var(--rule)]';

  if (person.net > 0) {
    netStatusText = `${t('owesYou')} ${formatPaise(person.net)}`;
    netColorClass = 'text-[var(--owe-you)]';
    netBgClass = 'bg-[var(--owe-you-soft)]/40 border-[var(--owe-you)]/30';
  } else if (person.net < 0) {
    netStatusText = `${t('youOwe')} ${formatPaise(Math.abs(person.net))}`;
    netColorClass = 'text-[var(--you-owe)]';
    netBgClass = 'bg-[var(--you-owe-soft)]/40 border-[var(--you-owe)]/30';
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <button
            id="person-back-btn"
            type="button"
            onClick={() => router.push(`/notebook/${notebookId}`)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all shrink-0"
            aria-label="Back to notebook"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <AvatarCircle name={person.name} size="sm" />

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5 min-w-0">
              <input
                type="text"
                autoFocus
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-lg px-2.5 py-1 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-[var(--accent)] text-white text-xs font-bold rounded-lg"
              >
                {t('save')}
              </button>
            </form>
          ) : (
            <h1 className="text-lg font-bold text-[var(--ink)] truncate">
              {person.name}
            </h1>
          )}
        </div>

        {/* Overflow Menu */}
        <div className="relative shrink-0">
          <button
            id="person-overflow-btn"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all"
            aria-label="Person options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
              <div
                id="person-overflow-dropdown"
                className="absolute right-0 top-full mt-1 w-44 bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl shadow-xl z-30 py-1.5 divide-y divide-[var(--rule)]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditedName(person.name);
                    setIsEditingName(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors text-left"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>{t('editPersonName')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeletePerson}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('deletePerson')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. Net Balance Band */}
      <div
        id="person-net-banner"
        className={`rounded-2xl border p-5 text-center shadow-xs mb-6 ${netBgClass}`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)]">
          {t('currentBalance')}
        </span>
        <div className={`mt-1.5 mb-3 text-2xl sm:text-3xl font-extrabold num-tabular ${netColorClass}`}>
          {netStatusText}
        </div>

        {/* Two smaller stat lines: Total given & Total taken */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--rule)] text-xs">
          <div className="text-left pl-2">
            <span className="text-[var(--ink-dim)] block mb-0.5">{t('totalGiven')}:</span>
            <span className="font-bold text-[var(--owe-you)] num-tabular text-sm">
              {formatPaise(person.totalGiven)}
            </span>
          </div>
          <div className="text-right pr-2 border-l border-[var(--rule)]">
            <span className="text-[var(--ink-dim)] block mb-0.5">{t('totalTaken')}:</span>
            <span className="font-bold text-[var(--accent)] num-tabular text-sm">
              {formatPaise(person.totalTaken)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Chronological list of transactions for this person */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
          {t('allTransactions')} ({transactions.length})
        </h2>
      </div>

      {transactions.length > 0 ? (
        <div className="border-t border-[var(--rule)]">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              showPerson={false}
              onClick={() =>
                openTxSheet({
                  notebookId,
                  personId: person.id,
                  transactionToEdit: tx,
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-[var(--ink-dim)] italic">
          {t('noPersonTransactions')}
        </div>
      )}

      {/* 4. Sticky Bottom: Gave / Got Buttons pre-filled with person */}
      <GaveGotButtons
        onGave={() =>
          openTxSheet({
            notebookId,
            personId: person.id,
            type: 'gave',
          })
        }
        onGot={() =>
          openTxSheet({
            notebookId,
            personId: person.id,
            type: 'got',
          })
        }
      />
    </div>
  );
}
