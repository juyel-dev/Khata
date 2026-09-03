'use client';

import React from 'react';
import { Transaction } from '@/lib/db/schema';
import { formatPaise, formatDateTime } from '@/lib/money';
import { useI18n } from '@/lib/i18n';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionRowProps {
  transaction: Transaction & { personName?: string; notebookName?: string; notebookColor?: string };
  showPerson?: boolean;
  showNotebook?: boolean;
  onClick?: () => void;
}

export function TransactionRow({
  transaction,
  showPerson = true,
  showNotebook = false,
  onClick,
}: TransactionRowProps) {
  const { t, lang } = useI18n();

  const isGave = transaction.type === 'gave';
  const colorClass = isGave ? 'text-[var(--owe-you)]' : 'text-[var(--accent)]';
  const bgClass = isGave ? 'bg-[var(--owe-you-soft)]' : 'bg-[var(--accent-soft)]';

  // Format primary line
  let primaryText = '';
  if (showPerson && transaction.personName) {
    primaryText = transaction.personName;
  } else if (transaction.note) {
    primaryText = transaction.note;
  } else {
    primaryText = isGave ? t('gave') : t('got');
  }

  return (
    <div
      id={`tx-row-${transaction.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="flex items-center justify-between py-3 px-2 border-b border-[var(--rule)] hover:bg-[var(--paper-card)]/80 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        {/* Left icon badge */}
        <div
          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${bgClass} ${colorClass}`}
        >
          {isGave ? (
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
          )}
        </div>

        {/* Middle text */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-semibold text-[var(--ink)] truncate group-hover:text-[var(--accent)] transition-colors">
              {primaryText}
            </span>
            {showNotebook && transaction.notebookName && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-[var(--rule)] shrink-0"
                style={{
                  backgroundColor: `${transaction.notebookColor}15`,
                  color: transaction.notebookColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: transaction.notebookColor }}
                />
                {transaction.notebookName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--ink-dim)] mt-0.5">
            <span>{formatDateTime(transaction.occurredAt, lang)}</span>
            {showPerson && transaction.note && (
              <>
                <span className="opacity-40">•</span>
                <span className="truncate italic">{transaction.note}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right amount */}
      <div className="text-right shrink-0">
        <div className={`text-base sm:text-lg font-bold num-tabular ${colorClass}`}>
          {isGave ? '-' : '+'}
          {formatPaise(transaction.amount)}
        </div>
        <div className="text-[10px] text-[var(--ink-dim)] uppercase font-medium">
          {isGave ? t('gave') : t('got')}
        </div>
      </div>
    </div>
  );
}
