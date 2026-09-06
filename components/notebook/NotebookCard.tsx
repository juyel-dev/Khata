'use client';

import React from 'react';
import Link from 'next/link';
import { NotebookWithStats } from '@/lib/db/schema';
import { formatPaise } from '@/lib/money';
import { useI18n } from '@/lib/i18n';
import { IconHelper } from '@/components/shared/IconHelper';
import { NotebookKebabMenu } from '@/components/notebook/NotebookKebabMenu';
import { ChevronRight, Pin } from 'lucide-react';

interface NotebookCardProps {
  notebook: NotebookWithStats;
}

export function NotebookCard({ notebook }: NotebookCardProps) {
  const { t, lang } = useI18n();

  // Balance coloring rule:
  // In Khata, the notebook current balance = openingBalance + sum(got) - sum(gave)
  // Positive balance means cash in hand > 0 (green)
  // Negative balance means deficit (terracotta)
  // Zero = neutral dim
  let balanceColor = 'text-[var(--ink-dim)]';
  if (notebook.currentBalance > 0) {
    balanceColor = 'text-[var(--accent)]';
  } else if (notebook.currentBalance < 0) {
    balanceColor = 'text-[var(--owe-you)]';
  }

  const txText =
    lang === 'bn'
      ? `${notebook.transactionCount} টি লেনদেন`
      : `${notebook.transactionCount} ${notebook.transactionCount === 1 ? 'entry' : 'entries'}`;

  return (
    <Link
      id={`notebook-card-${notebook.id}`}
      href={`/notebook/view?id=${notebook.id}`}
      className="block w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl p-4 transition-all duration-150 hover:border-[var(--accent)]/40 active:bg-[var(--rule)]/20 shadow-2xs group"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon chip */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white"
          style={{ backgroundColor: notebook.color || '#2F6B4F' }}
        >
          <IconHelper name={notebook.icon || 'book'} className="w-6 h-6" />
        </div>

        {/* Middle: Name + entry count */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-base font-semibold text-[var(--ink)] truncate group-hover:text-[var(--accent)] transition-colors flex items-center gap-1.5">
            {notebook.pinned && <Pin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 fill-current" />}
            <span className="truncate">{notebook.name}</span>
          </h3>
          <p className="text-xs text-[var(--ink-dim)] mt-0.5">{txText}</p>
        </div>

        {/* Right: Current Balance + kebab */}
        <div className="text-right shrink-0 flex items-center gap-1">
          <div>
            <div className={`text-base sm:text-lg font-bold num-tabular ${balanceColor}`}>
              {formatPaise(notebook.currentBalance)}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--ink-dim)] font-medium">
              {t('currentBalance')}
            </p>
          </div>
          <NotebookKebabMenu notebook={notebook} />
          <ChevronRight className="w-4 h-4 text-[var(--ink-dim)]/60 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
