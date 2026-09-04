'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useCurrency, CURRENCY_OPTIONS } from '@/lib/useCurrency';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import {
  ArrowLeft,
  Languages,
  Sun,
  Moon,
  Laptop,
  Database,
  Archive,
  HelpCircle,
  Share2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [currency, setCurrency] = useCurrency();
  const { showUndoToast } = useKhataUI();

  const handleShare = async () => {
    const shareData = {
      title: 'Khata — Simple Money Notebook',
      text: 'Khata: A simple, offline-first cash ledger for shops and individuals.',
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.origin);
      showUndoToast(t('linkCopied'));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          id="settings-back-btn"
          type="button"
          onClick={() => router.push('/')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--ink)]">{t('settings')}</h1>
      </header>

      <div className="space-y-6">
        {/* Section: Preferences */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] px-1">
            Preferences
          </h2>

          <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl overflow-hidden divide-y divide-[var(--rule)]">
            {/* Language */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-[var(--accent)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {t('language')}
                </span>
              </div>

              <div className="flex items-center bg-[var(--paper)] p-0.5 rounded-lg border border-[var(--rule)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    lang === 'en'
                      ? 'bg-[var(--accent)] text-white shadow-2xs'
                      : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    lang === 'bn'
                      ? 'bg-[var(--accent)] text-white shadow-2xs'
                      : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-[var(--ink-dim)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {t('theme')}
                </span>
              </div>

              <div className="flex items-center bg-[var(--paper)] p-0.5 rounded-lg border border-[var(--rule)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    theme === 'light'
                      ? 'bg-[var(--accent)] text-white shadow-2xs'
                      : 'text-[var(--ink-dim)]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{t('light')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    theme === 'dark'
                      ? 'bg-[var(--accent)] text-white shadow-2xs'
                      : 'text-[var(--ink-dim)]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{t('dark')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    theme === 'system'
                      ? 'bg-[var(--accent)] text-white shadow-2xs'
                      : 'text-[var(--ink-dim)]'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>{t('system')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Currency */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] px-1">
            {t('currency')}
          </h2>

          <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-base font-extrabold text-[var(--accent)]">
                  {currency}
                </span>
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {t('currency')}
                </span>
              </div>

              <div className="flex items-center bg-[var(--paper)] p-0.5 rounded-lg border border-[var(--rule)] text-xs font-semibold">
                {CURRENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setCurrency(opt.symbol)}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                      currency === opt.symbol
                        ? 'bg-[var(--accent)] text-white shadow-2xs'
                        : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="font-extrabold">{opt.symbol}</span>
                    <span>{opt.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Data */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] px-1">
            Data
          </h2>

          <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl overflow-hidden divide-y divide-[var(--rule)]">
            {/* Backup & Restore */}
            <Link
              id="settings-nav-backup"
              href="/settings/backup"
              className="p-4 flex items-center justify-between hover:bg-[var(--rule)]/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[var(--ink-dim)]" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink)]">
                    {t('backupAndRestore')}
                  </h3>
                  <p className="text-xs text-[var(--ink-dim)]">
                    Export or import JSON backup
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-dim)]/50" />
            </Link>

            {/* Archived Notebooks */}
            <Link
              id="settings-nav-archived"
              href="/settings/archived"
              className="p-4 flex items-center justify-between hover:bg-[var(--rule)]/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-[var(--ink-dim)]" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink)]">
                    {t('archivedNotebooks')}
                  </h3>
                  <p className="text-xs text-[var(--ink-dim)]">
                    Restore or permanently delete
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-dim)]/50" />
            </Link>
          </div>
        </section>

        {/* Section: About & Support */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] px-1">
            About & Help
          </h2>

          <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl overflow-hidden divide-y divide-[var(--rule)]">
            <Link
              id="settings-nav-about"
              href="/about"
              className="p-4 flex items-center justify-between hover:bg-[var(--rule)]/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[var(--ink-dim)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {t('aboutKhata')} & {t('help')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-dim)]/50" />
            </Link>

            <button
              id="settings-btn-share"
              type="button"
              onClick={handleShare}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--rule)]/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-[var(--ink-dim)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {t('shareApp')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-dim)]/50" />
            </button>
          </div>
        </section>

        {/* Privacy badge */}
        <div className="p-4 rounded-xl bg-[var(--accent-soft)]/50 border border-[var(--accent)]/20 flex items-center gap-3 text-xs text-[var(--ink)]">
          <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <p className="leading-relaxed">
            {t('aboutParagraph2')}
          </p>
        </div>
      </div>
    </div>
  );
}
