'use client';

import React, { useEffect, useState, useRef } from 'react';
import { formatPaise, formatDateTime } from '@/lib/money';
import { useI18n } from '@/lib/i18n';

interface BalanceHeaderProps {
  currentBalance: number;
  openingBalance: number;
  updatedAt: number;
  createdAt?: number;
  notebookName?: string;
  color?: string;
}

export function BalanceHeader({
  currentBalance,
  openingBalance,
  updatedAt,
  createdAt,
  notebookName,
  color = '#2F6B4F',
}: BalanceHeaderProps) {
  const { t, lang } = useI18n();
  const [pulse, setPulse] = useState(false);
  const prevBalanceRef = useRef(currentBalance);

  useEffect(() => {
    if (prevBalanceRef.current !== currentBalance) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      prevBalanceRef.current = currentBalance;
      return () => clearTimeout(timer);
    }
  }, [currentBalance]);

  return (
    <div
      id="notebook-balance-header"
      className="relative overflow-hidden rounded-2xl p-6 text-center border border-[var(--rule)] bg-[var(--paper-card)] shadow-xs transition-all"
    >
      {/* Top subtle accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: color }}
      />

      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-dim)]">
        {t('currentBalance')}
      </span>

      {/* Main big display balance */}
      <div
        className={`mt-2 mb-2 text-3xl sm:text-4xl font-extrabold tracking-tight num-tabular text-[var(--ink)] transition-transform duration-200 ${
          pulse ? 'pulse-balance' : ''
        }`}
      >
        {formatPaise(currentBalance)}
      </div>

      {/* Caption: Opening balance · Updated [time] */}
      <div className="text-xs text-[var(--ink-dim)] flex items-center justify-center gap-2 flex-wrap">
        <span>
          {t('openingBalanceLabel')}:{' '}
          <strong className="num-tabular font-medium text-[var(--ink)]">
            {formatPaise(openingBalance)}
          </strong>
        </span>
        <span className="opacity-40">•</span>
        <span>
          {t('updated')}{' '}
          <span className="font-medium">{formatDateTime(updatedAt, lang)}</span>
        </span>
        {createdAt !== undefined && (
          <>
            <span className="opacity-40">•</span>
            <span>
              {t('createdOn')}{' '}
              <span className="font-medium">{formatDateTime(createdAt, lang)}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
