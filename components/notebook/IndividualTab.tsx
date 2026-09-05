'use client';

import React, { useState } from 'react';
import { useIndividualSummaries, useTransactions } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { formatPaise } from '@/lib/money';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { ChevronLeft, Users } from 'lucide-react';

interface IndividualTabProps {
  notebookId: string;
}

export function IndividualTab({ notebookId }: IndividualTabProps) {
  const { individuals, loading } = useIndividualSummaries(notebookId);
  const { openTxSheet } = useKhataUI();
  const { t } = useI18n();
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const { transactions } = useTransactions({
    notebookId,
    personName: selectedName || undefined,
  });

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (individuals.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[var(--ink-dim)] bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-6 my-2">
        <Users className="w-8 h-8 mx-auto mb-2 text-[var(--ink-dim)]/50" />
        <p className="font-semibold text-sm text-[var(--ink)]">{t('noTransactionsYet')}</p>
      </div>
    );
  }

  if (selectedName) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedName(null)}
          className="flex items-center gap-1 text-sm font-semibold text-[var(--accent)] mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('allCustomers')}
        </button>
        <h3 className="text-base font-bold text-[var(--ink)] mb-2">{selectedName}</h3>
        <div className="border-t border-[var(--rule)]">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              showPerson={false}
              onClick={() => openTxSheet({ notebookId, transactionToEdit: tx })}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
      {individuals.map((ind) => {
        const isPositive = ind.net > 0;
        const isSettled = ind.net === 0;
        return (
          <div
            key={ind.name}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedName(ind.name)}
            className="flex items-center justify-between py-3 px-1 hover:bg-[var(--paper-card)] rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <AvatarCircle name={ind.name} size="sm" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                  {ind.name}
                </div>
                <div className="text-[11px] text-[var(--ink-dim)]">
                  {ind.transactionCount} {t('entries')}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-sm font-extrabold num-tabular ${
                  isSettled
                    ? 'text-[var(--ink-dim)]'
                    : isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isSettled ? t('settled') : formatPaise(Math.abs(ind.net))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
