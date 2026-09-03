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
  Phone,
  MessageCircle,
  Share2,
  Printer,
  Check,
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
  const { t, lang } = useI18n();
  const { openTxSheet, showUndoToast } = useKhataUI();

  const { person, loading: personLoading } = usePerson(personId);
  const { notebook } = useNotebook(notebookId);
  const { transactions, loading: txLoading } = useTransactions({ personId });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');

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
      await updatePerson(person.id, editedName.trim(), person.phone);
      setIsEditingName(false);
      showUndoToast(t('updatedToast'), () => {});
    } catch (err) {
      console.error('Failed to update person name:', err);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePerson(person.id, person.name, editedPhone.trim());
      setIsEditingPhone(false);
      showUndoToast(t('updatedToast'), () => {});
    } catch (err) {
      console.error('Failed to update person phone:', err);
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

  const handleWhatsAppReminder = () => {
    const formattedAmount = formatPaise(Math.abs(person.net));
    const msg =
      lang === 'bn'
        ? `আসসালামু আলাইকুম ${person.name} ভাই, আপনার নিকট খাতার হিসাব অনুযায়ী ${formattedAmount} বাকি রয়েছে। অনুগ্রহ করে সুবিধামতো পরিশোধ করবেন। ধন্যবাদ!`
        : `Dear ${person.name}, according to our records, an outstanding balance of ${formattedAmount} is pending. Kindly settle at your convenience. Thank you!`;

    let cleanPhone = (person.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '88' + cleanPhone; // Bangladesh country code prefix
    }

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
  };

  const handleShareReminder = () => {
    const formattedAmount = formatPaise(Math.abs(person.net));
    const msg =
      lang === 'bn'
        ? `আসসালামু আলাইকুম ${person.name} ভাই, আপনার নিকট খাতার হিসাব অনুযায়ী ${formattedAmount} বাকি রয়েছে। অনুগ্রহ করে সুবিধামতো পরিশোধ করবেন। ধন্যবাদ!`
        : `Dear ${person.name}, according to our records, an outstanding balance of ${formattedAmount} is pending. Kindly settle at your convenience. Thank you!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: `Khata - ${person.name}`, text: msg }).catch(() => {});
    } else if (typeof window !== 'undefined') {
      const cleanPhone = (person.phone || '').replace(/[^0-9]/g, '');
      window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
    }
  };

  // Determine Net Banner Styling
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
      {/* 1. Header */}
      <header className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
          <button
            id="person-back-btn"
            type="button"
            onClick={() => router.push(`/notebook/${notebookId}`)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Back to notebook"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <AvatarCircle name={person.name} size="sm" />

          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-1.5 min-w-0">
                <input
                  type="text"
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-lg px-2.5 py-1 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] w-full"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-[var(--accent)] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  {t('save')}
                </button>
              </form>
            ) : (
              <h1 className="text-lg font-bold text-[var(--ink)] truncate">
                {person.name}
              </h1>
            )}

            {/* Phone display / edit */}
            {isEditingPhone ? (
              <form onSubmit={handleSavePhone} className="flex items-center gap-1.5 mt-1">
                <input
                  type="tel"
                  autoFocus
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-lg px-2 py-0.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] w-36"
                />
                <button
                  type="submit"
                  className="p-1 bg-[var(--accent)] text-white text-xs rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                {person.phone ? (
                  <a
                    href={`tel:${person.phone}`}
                    className="text-xs text-[var(--accent)] font-medium hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{person.phone}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedPhone('');
                      setIsEditingPhone(true);
                    }}
                    className="text-[11px] text-[var(--ink-dim)] hover:text-[var(--accent)] underline cursor-pointer"
                  >
                    + {t('phonePlaceholder')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overflow Menu */}
        <div className="relative shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={() => window.print()}
            title={t('printStatement')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            id="person-overflow-btn"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all cursor-pointer"
            aria-label="Person options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
              <div
                id="person-overflow-dropdown"
                className="absolute right-0 top-full mt-1 w-48 bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl shadow-xl z-30 py-1.5 divide-y divide-[var(--rule)]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditedName(person.name);
                    setIsEditingName(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors text-left cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>{t('editPersonName')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditedPhone(person.phone || '');
                    setIsEditingPhone(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors text-left cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>{person.phone ? t('update') : t('add')} {t('phone')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeletePerson}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left cursor-pointer"
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
        className={`rounded-2xl border p-5 text-center shadow-xs mb-4 ${netBgClass}`}
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

      {/* 3. Action Row: WhatsApp Reminder & Share (if person owes money) */}
      {person.net > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={handleWhatsAppReminder}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('sendWhatsApp')}</span>
          </button>

          <button
            type="button"
            onClick={handleShareReminder}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[var(--rule)] bg-[var(--paper-card)] hover:bg-[var(--rule)]/20 text-[var(--ink)] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('sendSMS')}</span>
          </button>
        </div>
      )}

      {/* 4. Chronological list of transactions for this person */}
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

      {/* 5. Sticky Bottom: Gave / Got Buttons pre-filled with person */}
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
