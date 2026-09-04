'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import {
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Zap,
  Heart,
  Share2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();
  const { t } = useI18n();
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
          id="about-back-btn"
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--ink)]">{t('aboutKhata')}</h1>
      </header>

      <div className="space-y-6">
        {/* Brand Banner */}
        <div className="rounded-2xl bg-[var(--paper-card)] border border-[var(--rule)] p-6 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[var(--ink)]">{t('appName')}</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mt-0.5">
            {t('appTagline')}
          </p>
          <p className="text-sm text-[var(--ink-dim)] mt-3 leading-relaxed">
            {t('aboutParagraph1')}
          </p>
        </div>

        {/* 100% Offline Promise */}
        <div className="rounded-2xl bg-[var(--accent-soft)]/50 border border-[var(--accent)]/30 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[var(--accent)] font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>100% Offline & Private</span>
          </div>
          <p className="text-xs text-[var(--ink)] leading-relaxed">
            {t('aboutParagraph2')}
          </p>
        </div>

        {/* How it works / Help Guide */}
        <div className="rounded-2xl bg-[var(--paper-card)] border border-[var(--rule)] p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
            {t('helpTitle')}
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-[var(--ink)]">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--owe-you-soft)]/50 border border-[var(--owe-you)]/20">
              <ArrowUpRight className="w-4 h-4 text-[var(--owe-you)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--owe-you)] block mb-0.5">
                  {t('gave')} (Gave):
                </strong>
                <span>{t('helpGaveExplainer')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--accent-soft)]/50 border border-[var(--accent)]/20">
              <ArrowDownLeft className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--accent)] block mb-0.5">
                  {t('got')} (Got):
                </strong>
                <span>{t('helpGotExplainer')}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--rule)]">
              <span className="text-[var(--ink-dim)]">{t('helpOweExplainer')}</span>
            </div>
          </div>
        </div>

        {/* Share CTA */}
        <button
          id="about-share-btn"
          type="button"
          onClick={handleShare}
          className="w-full py-3.5 px-4 rounded-full bg-[var(--accent)] text-white font-bold text-sm shadow-md hover:bg-[var(--accent-hover)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('shareApp')}</span>
        </button>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--ink-dim)] pt-2">
          <p>Built with care for everyday business owners.</p>
        </div>
      </div>
    </div>
  );
}
