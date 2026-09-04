'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotebooks, useAllPeople, useTransactions } from '@/hooks/useKhataDB';
import { useKhataSummary } from '@/hooks/useKhataSummary';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { useI18n } from '@/lib/i18n';
import { formatPaise } from '@/lib/money';
import { NotebookCard } from '@/components/notebook/NotebookCard';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { HomeBanners } from '@/components/home/HomeBanners';
import {
  Menu,
  Plus,
  BookOpen,
  Cloud,
  CloudOff,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Search,
  BookMarked,
  History,
  Phone,
  MessageCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { notebooks, loading: nbLoading } = useNotebooks();
  const { people, loading: peopleLoading } = useAllPeople();
  const { transactions, loading: txLoading } = useTransactions({ limit: 30 });
  const { summary, loading: summaryLoading } = useKhataSummary();
  const { openDrawer, openTxSheet, showUndoToast, activeNotebookId, setActiveNotebookId } = useKhataUI();
  const { user, isSyncing, isOnline, syncLocalToCloud } = useFirebaseAuth();
  const { t, lang } = useI18n();

  const [activeTab, setActiveTab] = useState<'customers' | 'transactions' | 'notebooks'>('customers');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'owes' | 'youOwe'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Set default active notebook ID if not set
  const currentNotebookId = useMemo(() => {
    if (activeNotebookId && notebooks.some((n) => n.id === activeNotebookId)) {
      return activeNotebookId;
    }
    return notebooks[0]?.id || '';
  }, [activeNotebookId, notebooks]);

  const handleQuickSync = async () => {
    if (!user) {
      openDrawer();
      return;
    }
    const res = await syncLocalToCloud();
    if (res) {
      showUndoToast(t('cloudSyncSuccess'));
    }
  };

  // Filter pills count (search-এর নিচের ফিল্টার)
  const debtorsCount = useMemo(() => people.filter((p) => p.net > 0).length, [people]);
  const creditorsCount = useMemo(() => people.filter((p) => p.net < 0).length, [people]);

  // Filtered customer list
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // Tab filter
      if (customerFilter === 'owes' && p.net <= 0) return false;
      if (customerFilter === 'youOwe' && p.net >= 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchPhone = p.phone ? p.phone.includes(q) : false;
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [people, customerFilter, searchQuery]);

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-28">
      {/* 1. Top Bar */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button
            id="home-hamburger-btn"
            type="button"
            onClick={openDrawer}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 active:scale-95 transition-all cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 stroke-[2]" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
                {t('appName')}
              </h1>
              <p className="text-[10px] text-[var(--ink-dim)] font-medium -mt-0.5">
                {t('appTagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Action badges: PWA Install, Cloud Sync */}
        <div className="flex items-center gap-1.5">
          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Cloud Sync Button */}
          <button
            id="home-cloud-sync-btn"
            type="button"
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="h-8 px-2.5 rounded-lg border border-[var(--rule)] bg-[var(--paper-card)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--rule)]/30 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title={user ? 'Sync with Cloud' : 'Connect to Cloud'}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : !isOnline ? (
              <CloudOff className="w-3.5 h-3.5 text-[var(--ink-dim)]" />
            ) : (
              <Cloud
                className={`w-3.5 h-3.5 ${
                  user ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--ink-dim)]'
                }`}
              />
            )}
            {user ? (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold hidden xs:inline">
                {isSyncing ? 'Syncing' : 'Cloud'}
              </span>
            ) : (
              <span className="text-[11px] text-[var(--ink-dim)] hidden xs:inline">Offline</span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Home banner (tips + admin images) */}
      <div className="mb-3">
        <HomeBanners />
      </div>

      {/* 2b. Today's quick glance */}
      <section className="mb-4">
        {/* Sub-bar: Today's Transactions Quick Glance */}
        <div className="mt-2 py-2 px-3 rounded-xl bg-[var(--paper-card)] border border-[var(--rule)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--ink-dim)]">{t('todayGot')}:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 num-tabular">
              +{formatPaise(summary.todayGot)}
            </span>
          </div>
          <div className="h-3 w-px bg-[var(--rule)]" />
          <div className="flex items-center gap-2">
            <span className="text-[var(--ink-dim)]">{t('todayGave')}:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 num-tabular">
              -{formatPaise(summary.todayGave)}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Primary Action Buttons: You Gave (দিলাম) / You Got (পেলাম) */}
      <section className="mb-5 grid grid-cols-2 gap-2.5">
        {/* Red: দিলাম (You Gave) */}
        <button
          id="home-btn-gave"
          type="button"
          onClick={() =>
            openTxSheet({
              type: 'gave',
              notebookId: currentNotebookId,
            })
          }
          className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          <span>{t('gave')} (দিলাম)</span>
        </button>

        {/* Green: পেলাম (You Got) */}
        <button
          id="home-btn-got"
          type="button"
          onClick={() =>
            openTxSheet({
              type: 'got',
              notebookId: currentNotebookId,
            })
          }
          className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          <span>{t('got')} (পেলাম)</span>
        </button>
      </section>

      {/* 4. Active Notebook Selector Pill */}
      {notebooks.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[var(--ink-dim)] shrink-0 font-medium">খাতা:</span>
            <select
              value={currentNotebookId}
              onChange={(e) => setActiveNotebookId(e.target.value)}
              className="bg-transparent font-bold text-[var(--ink)] focus:outline-none truncate cursor-pointer"
            >
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name} ({formatPaise(nb.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/notebook/new"
            className="text-[var(--accent)] font-semibold flex items-center gap-1 hover:underline shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newNotebook')}</span>
          </Link>
        </div>
      )}

      {/* 5. Interactive Tabs: Customers | Transactions | Books */}
      <div className="flex border-b border-[var(--rule)] mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t('customers')} ({people.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{t('transactions')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notebooks')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'notebooks'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>{t('notebooks')} ({notebooks.length})</span>
        </button>
      </div>

      {/* 6. TAB CONTENT 1: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div>
          {/* Search bar & filter pills */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--ink-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchCustomer')}
                className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--ink-dim)]/50 focus:outline-none focus:border-[var(--accent)] font-medium"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCustomerFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  customerFilter === 'all'
                    ? 'bg-[var(--ink)] text-[var(--paper)]'
                    : 'bg-[var(--paper-card)] border border-[var(--rule)] text-[var(--ink-dim)]'
                }`}
              >
                {t('allCustomers')} ({people.length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('owes')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  customerFilter === 'owes'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {t('owesFilter')} ({debtorsCount})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('youOwe')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  customerFilter === 'youOwe'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                {t('youOweFilter')} ({creditorsCount})
              </button>
            </div>
          </div>

          {/* Customer list */}
          {peopleLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredPeople.length > 0 ? (
            <div className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
              {filteredPeople.map((person) => {
                const isDebtor = person.net > 0;
                const isCreditor = person.net < 0;
                const isSettled = person.net === 0;

                return (
                  <div
                    key={person.id}
                    onClick={() =>
                      router.push(`/notebook/${person.notebookId}/person/${person.id}`)
                    }
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between py-3 px-2 hover:bg-[var(--paper-card)] rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <AvatarCircle name={person.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                          {person.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--ink-dim)]">
                          {person.phone ? (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {person.phone}
                            </span>
                          ) : (
                            <span>{person.transactionCount} টি লেনদেন</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Balance status */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-extrabold num-tabular ${
                          isDebtor
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isCreditor
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[var(--ink-dim)]'
                        }`}
                      >
                        {isSettled
                          ? t('settled')
                          : formatPaise(Math.abs(person.net))}
                      </div>
                      <div className="text-[10px] text-[var(--ink-dim)] font-medium">
                        {isDebtor
                          ? t('owesYou')
                          : isCreditor
                          ? t('youOwe')
                          : 'হিসাব সম্পন্ন'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--ink-dim)] bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-6 my-2">
              <Users className="w-8 h-8 mx-auto mb-2 text-[var(--ink-dim)]/50" />
              <p className="font-semibold text-sm text-[var(--ink)] mb-1">
                {searchQuery ? t('noCustomersFound') : t('noCustomersYet')}
              </p>
              <p className="text-[11px] text-[var(--ink-dim)] mb-4">
                গ্রাহককে বাকিতে দিলে &quot;দিলাম&quot; বা টাকা পেলে &quot;পেলাম&quot; চাপুন।
              </p>
              <button
                type="button"
                onClick={() =>
                  openTxSheet({
                    type: 'gave',
                    notebookId: currentNotebookId,
                  })
                }
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                + {t('addCustomer')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB CONTENT 2: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div>
          {txLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="border-t border-[var(--rule)]">
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  showPerson={true}
                  showNotebook={notebooks.length > 1}
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
          ) : (
            <div className="py-12 text-center text-xs text-[var(--ink-dim)] bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-6">
              <History className="w-8 h-8 mx-auto mb-2 text-[var(--ink-dim)]/50" />
              <p className="font-semibold text-sm text-[var(--ink)] mb-1">এখনও কোনো লেনদেন নেই</p>
              <p className="text-[11px] text-[var(--ink-dim)] mb-3">
                উপরে &quot;দিলাম&quot; বা &quot;পেলাম&quot; বাটনে চাপ দিয়ে প্রথম হিসাব লিখুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. TAB CONTENT 3: NOTEBOOKS */}
      {activeTab === 'notebooks' && (
        <div className="space-y-3">
          {nbLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-[var(--rule)]/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            notebooks.map((nb) => (
              <NotebookCard key={nb.id} notebook={nb} />
            ))
          )}

          <Link
            id="home-btn-new-notebook-row"
            href="/notebook/new"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-[var(--rule)] hover:border-[var(--accent)] text-[var(--ink-dim)] hover:text-[var(--accent)] hover:bg-[var(--paper-card)] active:scale-98 transition-all font-semibold text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('newNotebook')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
