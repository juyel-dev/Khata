'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { useNotebooks, usePeople } from '@/hooks/useKhataDB';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  restoreTransaction,
  getOrCreatePerson,
} from '@/lib/db/operations';
import { rupeesToPaise, paiseToRupees, formatPaise } from '@/lib/money';
import { X, UserPlus, ArrowUpRight, ArrowDownLeft, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionFormProps {
  initialNotebookId: string;
  onClose: () => void;
}

function TransactionForm({ initialNotebookId, onClose }: TransactionFormProps) {
  const { txSheet, showUndoToast, setActiveNotebookId } = useKhataUI();
  const { t } = useI18n();
  const { notebooks } = useNotebooks();

  const editTx = txSheet.transactionToEdit;

  // Initialize values directly in useState
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(() => {
    if (editTx) return editTx.notebookId;
    return initialNotebookId || (notebooks[0]?.id ?? '');
  });

  const [type, setType] = useState<'gave' | 'got'>(() => {
    if (editTx) return editTx.type;
    return txSheet.type || 'got';
  });

  const [amountStr, setAmountStr] = useState<string>(() => {
    if (editTx) return String(paiseToRupees(editTx.amount));
    return '';
  });

  const [selectedPersonId, setSelectedPersonId] = useState<string>(() => {
    if (editTx) return editTx.personId;
    return txSheet.personId || '';
  });

  const [personQuery, setPersonQuery] = useState<string>(() => {
    if (editTx?.personName) return editTx.personName;
    return '';
  });

  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);

  const [dateTime, setDateTime] = useState<string>(() => {
    if (editTx) {
      const d = new Date(editTx.occurredAt);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  const [note, setNote] = useState<string>(() => editTx?.note || '');
  const [isSaving, setIsSaving] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Fetch people for selected notebook
  const { people } = usePeople(selectedNotebookId || null);

  // Auto-focus amount on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Filter people list for search
  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(personQuery.trim().toLowerCase())
  );

  const isExactPersonMatch = people.some(
    (p) => p.name.toLowerCase() === personQuery.trim().toLowerCase()
  );

  const canSave =
    !isSaving &&
    parseFloat(amountStr) > 0 &&
    (selectedPersonId !== '' || personQuery.trim().length > 0) &&
    selectedNotebookId !== '';

  const displayPersonName =
    personQuery ||
    (selectedPersonId ? people.find((p) => p.id === selectedPersonId)?.name || '' : '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setIsSaving(true);
      const amountPaise = rupeesToPaise(parseFloat(amountStr));
      const occurredEpoch = dateTime ? new Date(dateTime).getTime() : Date.now();

      // Resolve person ID
      let personIdToUse = selectedPersonId;
      let finalPersonName = displayPersonName.trim();

      if (!personIdToUse || !people.some((p) => p.id === personIdToUse)) {
        const createdPerson = await getOrCreatePerson(selectedNotebookId, finalPersonName);
        personIdToUse = createdPerson.id;
        finalPersonName = createdPerson.name;
      } else {
        const found = people.find((p) => p.id === personIdToUse);
        if (found) finalPersonName = found.name;
      }

      if (editTx) {
        // Edit mode
        await updateTransaction(editTx.id, {
          notebookId: selectedNotebookId,
          personId: personIdToUse,
          type,
          amount: amountPaise,
          note,
          occurredAt: occurredEpoch,
        });

        showUndoToast(
          `${t('updatedToast')} — ${formatPaise(amountPaise)} (${finalPersonName})`,
          () => {}
        );
      } else {
        // Create mode
        await createTransaction({
          notebookId: selectedNotebookId,
          personId: personIdToUse,
          type,
          amount: amountPaise,
          note,
          occurredAt: occurredEpoch,
        });

        // Set as active notebook
        setActiveNotebookId(selectedNotebookId);

        showUndoToast(
          `${t('savedToast')} — ${formatPaise(amountPaise)} (${finalPersonName})`,
          () => {}
        );
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
      {/* Grab Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1.5 rounded-full bg-[var(--rule)]" />
      </div>

      {/* Sheet Header */}
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

      {/* Form Body */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Notebook selector if multiple exist */}
        {notebooks.length > 1 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
              {t('whichNotebook')}
            </label>
            <select
              id="tx-sheet-notebook-select"
              value={selectedNotebookId}
              onChange={(e) => {
                setSelectedNotebookId(e.target.value);
                setSelectedPersonId('');
                setPersonQuery('');
              }}
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            <span className="text-3xl sm:text-4xl font-bold text-[var(--ink-dim)]">₹</span>
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
        </div>

        {/* 3. Person: Combobox with inline "Add new person" */}
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('person')}
          </label>
          <div className="relative">
            <input
              id="tx-sheet-person-input"
              type="text"
              value={isPersonDropdownOpen ? personQuery : displayPersonName}
              onFocus={() => {
                if (!personQuery && displayPersonName) {
                  setPersonQuery(displayPersonName);
                }
                setIsPersonDropdownOpen(true);
              }}
              onChange={(e) => {
                setPersonQuery(e.target.value);
                setSelectedPersonId('');
                setIsPersonDropdownOpen(true);
              }}
              placeholder={t('selectOrAddPerson')}
              autoComplete="off"
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-3 text-base text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
            />
            {selectedPersonId && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Dropdown list */}
          {isPersonDropdownOpen && (
            <div
              id="tx-person-dropdown"
              className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-[var(--rule)]"
            >
              {/* Existing people matches */}
              {filteredPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setSelectedPersonId(person.id);
                    setPersonQuery(person.name);
                    setIsPersonDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors flex items-center justify-between"
                >
                  <span>{person.name}</span>
                  {person.net !== 0 && (
                    <span className="text-xs font-normal text-[var(--ink-dim)]">
                      {person.net > 0 ? `${t('owesYou')} ` : `${t('youOwe')} `}
                      {formatPaise(Math.abs(person.net))}
                    </span>
                  )}
                </button>
              ))}

              {/* Inline "Add new person" option */}
              {personQuery.trim().length > 0 && !isExactPersonMatch && (
                <button
                  id="tx-add-new-person-option"
                  type="button"
                  onClick={() => {
                    setIsPersonDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-[var(--accent)] bg-[var(--accent-soft)]/50 hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>
                    {t('addNewPerson')}: &quot;{personQuery.trim()}&quot;
                  </span>
                </button>
              )}

              {filteredPeople.length === 0 && personQuery.trim().length === 0 && (
                <div className="px-4 py-3 text-xs text-[var(--ink-dim)] italic text-center">
                  Type a name above to search or add
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Date & Time */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('dateTime')}
          </label>
          <div className="relative">
            <input
              id="tx-sheet-datetime-input"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
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
            maxLength={80}
            className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-dim)]/50"
          />
        </div>

        {/* Actions: Save Button (Sticky bottom of sheet) */}
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

          {/* Edit mode: Delete link */}
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

  if (!txSheet.isOpen) return null;

  let targetNbId = txSheet.notebookId;
  if (!targetNbId || !notebooks.some((n) => n.id === targetNbId)) {
    targetNbId = notebooks[0]?.id || '';
  }

  const keyId = txSheet.transactionToEdit?.id || `new-${txSheet.type || 'got'}-${txSheet.personId || ''}`;

  return (
    <div id="transaction-sheet-wrapper" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        id="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeTxSheet}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
      />

      {/* Form */}
      <AnimatePresence>
        <TransactionForm
          key={keyId}
          initialNotebookId={targetNbId}
          onClose={closeTxSheet}
        />
      </AnimatePresence>
    </div>
  );
}
