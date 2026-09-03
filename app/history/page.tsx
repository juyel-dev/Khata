'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTransactions, useNotebooks } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { formatDateHeading } from '@/lib/money';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { Clock, Filter, ArrowUpRight, ArrowDownLeft, X, BookOpen } from 'lucide-react';

export default function HistoryPage() {
  const { transactions, loading } = useTransactions();
  const { notebooks } = useNotebooks();
  const { t, lang } = useI18n();
  const { openTxSheet } = useKhataUI();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'gave' | 'got'>('all');

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (selectedNotebookId !== 'all' && tx.notebookId !== selectedNotebookId) {
      return false;
    }
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }
    return true;
  });

  // Group transactions by calendar day (e.g. YYYY-MM-DD)
  const groupedByDay: { [key: string]: typeof filteredTransactions } = {};
  filteredTransactions.forEach((tx) => {
    const d = new Date(tx.occurredAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = [];
    }
    groupedByDay[dayKey].push(tx);
  });

  const dayKeys = Object.keys(groupedByDay);

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-24">
      {/* 1. Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-xl font-bold text-[var(--ink)]">{t('history')}</h1>
        </div>

        <button
          id="history-filter-toggle-btn"
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isFilterOpen || selectedNotebookId !== 'all' || selectedType !== 'all'
              ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
              : 'bg-[var(--paper-card)] border-[var(--rule)] text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{t('filterHistory')}</span>
        </button>
      </header>

      {/* 2. Filter Row (Collapsible) */}
      {isFilterOpen && (
        <div
          id="history-filters-panel"
          className="rounded-2xl border border-[var(--rule)] bg-[var(--paper-card)] p-4 mb-4 space-y-3 shadow-xs"
        >
          {/* Notebook Filter Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
              {t('whichNotebook')}
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedNotebookId('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedNotebookId === 'all'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--rule)]/40 text-[var(--ink-dim)] hover:text-[var(--ink)]'
                }`}
              >
                {t('filterAll')}
              </button>
              {notebooks.map((nb) => (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => setSelectedNotebookId(nb.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedNotebookId === nb.id
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--rule)]/40 text-[var(--ink-dim)] hover:text-[var(--ink)]'
                  }`}
                >
                  {nb.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter: All / Gave / Got */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedType === 'all'
                    ? 'bg-[var(--ink)] text-[var(--paper)]'
                    : 'bg-[var(--rule)]/30 text-[var(--ink-dim)]'
                }`}
              >
                {t('filterAll')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('gave')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  selectedType === 'gave'
                    ? 'bg-[var(--owe-you)] text-white'
                    : 'bg-[var(--owe-you-soft)]/60 text-[var(--owe-you)]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{t('filterGaveOnly')}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('got')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  selectedType === 'got'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{t('filterGotOnly')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 3 & 4. Chronological list grouped by day */}
      {!loading && dayKeys.length > 0 && (
        <div className="space-y-6">
          {dayKeys.map((dayKey) => {
            const dayTxs = groupedByDay[dayKey];
            const sampleTime = dayTxs[0].occurredAt;
            const heading = formatDateHeading(sampleTime, lang);

            return (
              <div key={dayKey} className="space-y-1">
                {/* Sticky Date Header */}
                <div className="sticky top-0 z-10 bg-[var(--paper)]/95 backdrop-blur-xs py-1 px-1 border-b border-[var(--rule)]/60 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                    {heading}
                  </span>
                  <span className="text-[11px] text-[var(--ink-dim)] num-tabular font-medium">
                    {dayTxs.length} {dayTxs.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Day's Transactions */}
                <div className="divide-y divide-[var(--rule)]/60">
                  {dayTxs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      showPerson={true}
                      showNotebook={true}
                      onClick={() =>
                        openTxSheet({
                          notebookId: tx.notebookId,
                          personId: tx.personId,
                          transactionToEdit: tx,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && dayKeys.length === 0 && (
        <div
          id="history-empty-state"
          className="rounded-2xl border border-[var(--rule)] bg-[var(--paper-card)] p-8 text-center my-6 shadow-xs"
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--rule)]/40 text-[var(--ink-dim)] flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink)] mb-1">{t('noHistory')}</h3>
          <p className="text-xs text-[var(--ink-dim)] max-w-xs mx-auto leading-relaxed mb-5">
            {t('noHistorySub')}
          </p>
          <Link
            id="history-btn-goto-home"
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('home')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
