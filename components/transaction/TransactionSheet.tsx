'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { useNotebooks } from '@/hooks/useKhataDB';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  restoreTransaction,
  getPersonNameSuggestions,
} from '@/lib/db/operations';
import { rupeesToPaise, paiseToRupees, formatPaise, getCurrencySymbol } from '@/lib/money';
import { X, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionFormProps {
  notebookId: string;
  onClose: () => void;
}

function TransactionForm({ notebookId, onClose }: TransactionFormProps) {
  const { txSheet, showUndoToast } = useKhataUI();
  const { t } = useI18n();

  const editTx = txSheet.transactionToEdit;

  const [type, setType] = useState<'gave' | 'got'>(() => {
    if (editTx) return editTx.type;
    return txSheet.type || 'got';
  });

  const [amountStr, setAmountStr] = useState<string>(() => {
    if (editTx) return String(paiseToRupees(editTx.amount));
    return '';
  });

  const [name, setName] = useState<string>(() => {
    if (editTx) return editTx.personName;
    return txSheet.personName || '';
  });

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

  const [dateTime, setDateTime] = useState<string>(() => {
    if (editTx) {
      const d = new Date(editTx.occurredAt);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const [note, setNote] = useState<string>(() => editTx?.note || '');
  const [isSaving, setIsSaving] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPersonNameSuggestions(notebookId).then(setNameSuggestions).catch(() => {});
  }, [notebookId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const canSave = !isSaving && parseFloat(amountStr) > 0 && name.trim().length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setIsSaving(true);
      const amountPaise = rupeesToPaise(parseFloat(amountStr));
      const occurredEpoch = dateTime ? new Date(dateTime).getTime() : Date.now();
      const finalName = name.trim();

      if (editTx) {
        await updateTransaction(editTx.id, {
          personName: finalName,
          type,
          amount: amountPaise,
          note,
          occurredAt: occurredEpoch,
        });
        showUndoToast(`${t('updatedToast')} — ${formatPaise(amountPaise)} (${finalName})`);
      } else {
        await createTransaction({
          notebookId,
          personName: finalName,
          type,
          amount: amountPaise,
          note,
          occurredAt: occurredEpoch,
        });
        showUndoToast(`${t('savedToast')} — ${formatPaise(amountPaise)} (${finalName})`);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editTx) return;
    try {
      const deleted = await deleteTransaction(editTx.id);
      onClose();

      if (deleted) {
        showUndoToast(t('deletedToast'), async () => {
          await restoreTransaction(deleted);
        });
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  return (
    <motion.div
      id="transaction-bottom-sheet"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--paper)] rounded-t-3xl border-t border-[var(--rule)] shadow-2xl flex flex-col max-h-[92vh] z-10"
    >
      <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1.5 rounded-full bg-[var(--rule)]" />
      </div>

      <div className="px-5 py-2 flex items-center justify-between border-b border-[var(--rule)]/60">
        <h2 className="text-base font-bold text-[var(--ink)]">
          {editTx ? t('editTransaction') : t('newTransaction')}
        </h2>
        <button
          id="sheet-close-btn"
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-dim)] hover:bg-[var(--rule)]/40 hover:text-[var(--ink)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* 1. Type Toggle: Gave / Got */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--rule)]/30 rounded-full">
          <button
            id="tx-toggle-gave"
            type="button"
            onClick={() => setType('gave')}
            className={`py-2.5 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              type === 'gave'
                ? 'bg-[var(--owe-you)] text-white shadow-xs'
                : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>{t('gave')}</span>
          </button>

          <button
            id="tx-toggle-got"
            type="button"
            onClick={() => setType('got')}
            className={`py-2.5 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              type === 'got'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('got')}</span>
          </button>
        </div>

        {/* 2. Amount: Big numeric field */}
        <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-4 text-center">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1">
            {t('amount')}
          </label>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-[var(--ink-dim)]">
              {getCurrencySymbol()}
            </span>
            <input
              ref={amountInputRef}
              id="tx-sheet-amount-input"
              type="number"
              step="any"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
              className="w-full text-3xl sm:text-4xl font-extrabold text-[var(--ink)] num-tabular text-center bg-transparent focus:outline-none placeholder:text-[var(--ink-dim)]/30"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            {[100, 500, 1000, 2000, 5000].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  const current = parseFloat(amountStr) || 0;
                  setAmountStr(String(current + quick));
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--paper)] border border-[var(--rule)] hover:border-[var(--accent)] text-[var(--ink)] active:scale-95 transition-all cursor-pointer"
              >
                +{quick}
              </button>
            ))}
            {amountStr && parseFloat(amountStr) > 0 && (
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2 py-1 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>

        {/* 3. Name: plain text field, with suggestions from names used before in this khata */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('person')}
          </label>
          <input
            id="tx-sheet-name-input"
            type="text"
            list="tx-sheet-name-suggestions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('selectOrAddPerson')}
            autoComplete="off"
            className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-3 text-base text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
          />
          <datalist id="tx-sheet-name-suggestions">
            {nameSuggestions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        {/* 4. Date & Time */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('dateTime')}
          </label>
          <input
            id="tx-sheet-datetime-input"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* 5. Note (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('note')}
          </label>
          <input
            id="tx-sheet-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            maxLength={500}
            className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-dim)]/50"
          />
        </div>

        <div className="pt-2 pb-3 space-y-2">
          <button
            id="tx-sheet-save-btn"
            type="submit"
            disabled={!canSave}
            className={`w-full min-h-[52px] rounded-full font-bold text-base transition-all shadow-md flex items-center justify-center cursor-pointer ${
              canSave
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-98'
                : 'bg-[var(--rule)] text-[var(--ink-dim)] cursor-not-allowed opacity-60'
            }`}
          >
            {editTx ? t('update') : t('save')}
          </button>

          {editTx && (
            <button
              id="tx-sheet-delete-btn"
              type="button"
              onClick={handleDelete}
              className="w-full py-2.5 text-xs font-semibold text-[var(--danger)] hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('delete')}</span>
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}

export function TransactionSheet() {
  const { txSheet, closeTxSheet } = useKhataUI();
  const { notebooks } = useNotebooks();
  const { t } = useI18n();

  if (!txSheet.isOpen) return null;

  if (notebooks.length === 0 && !txSheet.transactionToEdit) {
    return (
      <div id="transaction-sheet-wrapper" className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          id="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeTxSheet}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--paper)] rounded-t-3xl border-t border-[var(--rule)] shadow-2xl p-6 text-center z-10"
        >
          <h2 className="text-base font-bold text-[var(--ink)] mb-2">{t('startFirstNotebook')}</h2>
          <p className="text-xs text-[var(--ink-dim)] mb-4 leading-relaxed">{t('emptyNotebooksDesc')}</p>
          <Link
            href="/notebook/new"
            onClick={closeTxSheet}
            className="inline-block px-6 py-3 rounded-full bg-[var(--accent)] text-white text-sm font-bold shadow-md"
          >
            + {t('newNotebook')}
          </Link>
        </motion.div>
      </div>
    );
  }

  let targetNbId = txSheet.notebookId;
  if (!targetNbId || (!txSheet.transactionToEdit && !notebooks.some((n) => n.id === targetNbId))) {
    targetNbId = txSheet.transactionToEdit?.notebookId || notebooks[0]?.id || '';
  }

  const keyId = txSheet.transactionToEdit?.id || `new-${txSheet.type || 'got'}-${targetNbId}`;

  return (
    <div id="transaction-sheet-wrapper" className="fixed inset-0 z-50 overflow-hidden">
      <motion.div
        id="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeTxSheet}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
      />

      <AnimatePresence>
        <TransactionForm key={keyId} notebookId={targetNbId} onClose={closeTxSheet} />
      </AnimatePresence>
    </div>
  );
}
