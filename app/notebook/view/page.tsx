'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotebook, useTransactions } from '@/hooks/useKhataDB';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { BalanceHeader } from '@/components/notebook/BalanceHeader';
import { NotebookKebabMenu } from '@/components/notebook/NotebookKebabMenu';
import { IndividualTab } from '@/components/notebook/IndividualTab';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { ArrowLeft, History, Users } from 'lucide-react';

// Query-param route (/notebook/view?id=xxx) instead of a dynamic segment
// (/notebook/[id]) — khata id-গুলো runtime-এ Dexie-তে তৈরি হয় বলে static export-এ
// dynamic segment কাজ করবে না, আর একটাই স্থির path হওয়ায় SW এটা precache করতে পারে
// এবং অফলাইনে যেকোনো (এমনকি নতুন তৈরি হওয়া) khata-র জন্যও কাজ করে।
function NotebookViewContent() {
  const searchParams = useSearchParams();
  const notebookId = searchParams.get('id') || '';
  const router = useRouter();
  const { t } = useI18n();
  const { openTxSheet, setActiveNotebookId } = useKhataUI();

  const { notebook, loading: nbLoading } = useNotebook(notebookId || null);
  const { transactions, loading: txLoading } = useTransactions({ notebookId });

  const [tab, setTab] = useState<'transactions' | 'individual'>('transactions');

  React.useEffect(() => {
    if (notebookId) {
      setActiveNotebookId(notebookId);
    }
  }, [notebookId, setActiveNotebookId]);

  if (!notebookId || (!nbLoading && !notebook)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-base text-[var(--ink-dim)] mb-4">Notebook not found</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  if (nbLoading || !notebook) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-[var(--rule)]/40 rounded-lg w-1/2" />
        <div className="h-36 bg-[var(--rule)]/40 rounded-2xl" />
        <div className="h-60 bg-[var(--rule)]/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-28">
      {/* Header: Back Arrow, Notebook Name, Kebab menu */}
      <header className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <button
            id="nb-detail-back-btn"
            type="button"
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
          <h1 className="text-lg font-bold text-[var(--ink)] truncate">{notebook.name}</h1>
        </div>

        <NotebookKebabMenu notebook={notebook} />
      </header>

      {/* Balance / info header: name, created, updated, opening + current balance */}
      <BalanceHeader
        currentBalance={notebook.currentBalance}
        openingBalance={notebook.openingBalance}
        updatedAt={notebook.updatedAt}
        createdAt={notebook.createdAt}
        notebookName={notebook.name}
        color={notebook.color}
      />

      {/* Tabs: Transactions (default) | Individual */}
      <div className="mt-5 mb-3 flex items-center gap-1 p-1 bg-[var(--rule)]/30 rounded-full">
        <button
          type="button"
          onClick={() => setTab('transactions')}
          className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'transactions'
              ? 'bg-[var(--paper-card)] text-[var(--ink)] shadow-xs'
              : 'text-[var(--ink-dim)]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {t('transactions')}
        </button>
        <button
          type="button"
          onClick={() => setTab('individual')}
          className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'individual'
              ? 'bg-[var(--paper-card)] text-[var(--ink)] shadow-xs'
              : 'text-[var(--ink-dim)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          {t('individual')}
        </button>
      </div>

      {tab === 'transactions' ? (
        txLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="border-t border-[var(--rule)]">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                showPerson={true}
                onClick={() => openTxSheet({ notebookId: notebook.id, transactionToEdit: tx })}
              />
            ))}
          </div>
        ) : (
          <div
            id="notebook-empty-transactions"
            className="rounded-2xl border border-dashed border-[var(--rule)] p-8 text-center my-6 bg-[var(--paper-card)]/50"
          >
            <p className="text-sm font-medium text-[var(--ink-dim)] leading-relaxed">
              {t('noTransactionsYet')}
            </p>
          </div>
        )
      ) : (
        <IndividualTab notebookId={notebook.id} />
      )}
    </div>
  );
}

export default function NotebookViewPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-8 animate-pulse h-96" />}>
      <NotebookViewContent />
    </Suspense>
  );
}
