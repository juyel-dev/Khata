'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNotebook } from '@/lib/db/operations';
import { NOTEBOOK_COLORS, NOTEBOOK_ICONS } from '@/lib/db/schema';
import { rupeesToPaise, getCurrencySymbol } from '@/lib/money';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { IconHelper } from '@/components/shared/IconHelper';
import { ArrowLeft, Check } from 'lucide-react';

export default function NewNotebookPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { setActiveNotebookId, showUndoToast } = useKhataUI();

  const [name, setName] = useState('');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('0');
  const [selectedColor, setSelectedColor] = useState(NOTEBOOK_COLORS[0].hex);
  const [selectedIcon, setSelectedIcon] = useState(NOTEBOOK_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSave = !isSubmitting && name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setIsSubmitting(true);
      const openingBalancePaise = rupeesToPaise(parseFloat(openingBalanceStr) || 0);

      const nb = await createNotebook({
        name: name.trim(),
        openingBalance: openingBalancePaise,
        color: selectedColor,
        icon: selectedIcon,
      });

      setActiveNotebookId(nb.id);
      showUndoToast(`${t('savedToast')} — ${nb.name}`);
      router.push(`/notebook/view?id=${nb.id}`);
    } catch (err) {
      console.error('Failed to create notebook:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          id="new-nb-back-btn"
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--ink)]">{t('newNotebook')}</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Notebook Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('notebookName')} *
          </label>
          <input
            id="new-nb-name-input"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('notebookNamePlaceholder')}
            className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-3.5 text-base font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* 2. Opening Balance */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
              {t('openingBalance')}
            </label>
            <span className="text-xs text-[var(--ink-dim)]">{t('openingBalanceHint')}</span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--ink-dim)]">
              {getCurrencySymbol()}
            </span>
            <input
              id="new-nb-opening-balance-input"
              type="number"
              step="any"
              inputMode="decimal"
              value={openingBalanceStr}
              onChange={(e) => setOpeningBalanceStr(e.target.value)}
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl pl-9 pr-4 py-3 text-base font-bold num-tabular text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* 3. Color Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-2.5">
            {t('color')}
          </label>
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            {NOTEBOOK_COLORS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedColor(col.hex)}
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all ${
                  selectedColor === col.hex ? 'ring-3 ring-offset-2 ring-[var(--ink)] scale-105' : 'hover:scale-105 opacity-90'
                }`}
                style={{ backgroundColor: col.hex }}
                aria-label={col.label}
              >
                {selectedColor === col.hex && <Check className="w-5 h-5 text-white stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Icon Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-2.5">
            {t('icon')}
          </label>
          <div className="grid grid-cols-4 gap-3">
            {NOTEBOOK_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                className={`h-12 rounded-xl border flex items-center justify-center transition-all ${
                  selectedIcon === iconName
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-bold shadow-xs'
                    : 'border-[var(--rule)] bg-[var(--paper-card)] text-[var(--ink-dim)] hover:text-[var(--ink)]'
                }`}
              >
                <IconHelper name={iconName} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Action: Save Notebook */}
        <div className="pt-4">
          <button
            id="new-nb-submit-btn"
            type="submit"
            disabled={!canSave}
            className={`w-full min-h-[54px] rounded-full font-bold text-base transition-all shadow-md flex items-center justify-center cursor-pointer ${
              canSave
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-98'
                : 'bg-[var(--rule)] text-[var(--ink-dim)] cursor-not-allowed opacity-60'
            }`}
          >
            {t('saveNotebook')}
          </button>
        </div>
      </form>
    </div>
  );
}
