'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface GaveGotButtonsProps {
  onGave: () => void;
  onGot: () => void;
}

export function GaveGotButtons({ onGave, onGot }: GaveGotButtonsProps) {
  const { t } = useI18n();

  return (
    <div
      id="gave-got-actions-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--paper)]/95 backdrop-blur-md border-t border-[var(--rule)] p-4 pb-safe shadow-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
        {/* Gave Button: Outlined / ghost in terracotta tone (money leaving) */}
        <button
          id="btn-gave"
          type="button"
          onClick={onGave}
          className="min-h-[56px] px-5 py-3 rounded-full border-2 border-[var(--owe-you)] text-[var(--owe-you)] bg-[var(--owe-you-soft)]/40 hover:bg-[var(--owe-you-soft)] active:scale-98 transition-all flex items-center justify-center gap-2 font-bold text-base cursor-pointer shadow-xs"
        >
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          <span>{t('gave')}</span>
        </button>

        {/* Got Button: Filled in accent green tone (money arriving) */}
        <button
          id="btn-got"
          type="button"
          onClick={onGot}
          className="min-h-[56px] px-5 py-3 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-98 transition-all flex items-center justify-center gap-2 font-bold text-base cursor-pointer shadow-md"
        >
          <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          <span>{t('got')}</span>
        </button>
      </div>
    </div>
  );
}
