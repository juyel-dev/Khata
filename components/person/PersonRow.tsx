'use client';

import React from 'react';
import Link from 'next/link';
import { PersonWithBalance } from '@/lib/db/schema';
import { formatPaise, formatDateTime } from '@/lib/money';
import { useI18n } from '@/lib/i18n';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { ChevronRight } from 'lucide-react';

interface PersonRowProps {
  person: PersonWithBalance;
  notebookId: string;
}

export function PersonRow({ person, notebookId }: PersonRowProps) {
  const { t, lang } = useI18n();

  // Determine net status:
  // net = totalGiven - totalTaken
  // net > 0: They owe you (terracotta)
  // net < 0: You owe them (accent green)
  // net == 0: Settled (neutral dim)
  let badgeStyle = 'bg-[var(--rule)]/40 text-[var(--neutral-settled)] border border-[var(--rule)]';
  let badgeText = t('settled');

  if (person.net > 0) {
    badgeStyle = 'bg-[var(--owe-you-soft)] text-[var(--owe-you)] border border-[var(--owe-you)]/30 font-semibold';
    badgeText = `${t('owesYou')} ${formatPaise(person.net)}`;
  } else if (person.net < 0) {
    badgeStyle = 'bg-[var(--you-owe-soft)] text-[var(--you-owe)] border border-[var(--you-owe)]/30 font-semibold';
    badgeText = `${t('youOwe')} ${formatPaise(Math.abs(person.net))}`;
  }

  // Last transaction summary
  let lastTxSummary = null;
  if (person.lastTransaction) {
    const txTypeStr = person.lastTransaction.type === 'gave' ? t('gave') : t('got');
    lastTxSummary = `${t('lastTxPrefix')}: ${txTypeStr} ${formatPaise(person.lastTransaction.amount)} ${t('on')} ${formatDateTime(person.lastTransaction.occurredAt, lang)}`;
  }

  return (
    <Link
      id={`person-row-${person.id}`}
      href={`/notebook/${notebookId}/person/${person.id}`}
      className="flex items-center justify-between py-3.5 px-2 hover:bg-[var(--paper-card)]/80 transition-colors border-b border-[var(--rule)] group"
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <AvatarCircle name={person.name} size="md" />
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-[var(--ink)] truncate group-hover:text-[var(--accent)] transition-colors">
            {person.name}
          </h4>
          {lastTxSummary ? (
            <p className="text-xs text-[var(--ink-dim)] truncate mt-0.5">{lastTxSummary}</p>
          ) : (
            <p className="text-xs text-[var(--ink-dim)] italic mt-0.5">{t('settled')}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className={`px-3 py-1 rounded-full text-xs whitespace-nowrap num-tabular ${badgeStyle}`}>
          {badgeText}
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--ink-dim)]/50 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
