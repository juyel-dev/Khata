'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { Sparkles, ShieldCheck, Languages, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function HomeBanner() {
  const { lang, t } = useI18n();
  const { showUndoToast } = useKhataUI();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const banners = [
    {
      id: 'tip-1',
      icon: <Sparkles className="w-5 h-5 text-[var(--accent)] shrink-0" />,
      tag: lang === 'bn' ? 'টিপস' : 'Quick Tip',
      title: lang === 'bn' ? 'সহজ হিসাব রাখা' : 'Simple Bookkeeping',
      desc:
        lang === 'bn'
          ? 'গ্রাহক নগদ পরিশোধ করলে ‘পেলাম’ এবং বাকিতে নিলে ‘দিলাম’ চাপুন।'
          : 'Tap "Got" when cash is received and "Gave" when cash or credit is given.',
    },
    {
      id: 'tip-2',
      icon: <ShieldCheck className="w-5 h-5 text-[#2F6B4F] shrink-0" />,
      tag: lang === 'bn' ? 'গোপনীয়তা' : 'Private & Offline',
      title: lang === 'bn' ? '১০০% অফলাইন নিরাপত্তা' : 'Your Data Stays on Device',
      desc:
        lang === 'bn'
          ? 'কোনো অ্যাকাউন্ট বা ইন্টারনেটের প্রয়োজন নেই। সব তথ্য আপনার ফোনেই সুরক্ষিত।'
          : 'No login, no cloud tracker. All your records stay safe right here in your browser.',
    },
    {
      id: 'tip-3',
      icon: <Languages className="w-5 h-5 text-[#B4491F] shrink-0" />,
      tag: lang === 'bn' ? 'ভাষা' : 'Bilingual',
      title: lang === 'bn' ? 'বাংলা ও ইংরেজি' : 'English & Bengali',
      desc:
        lang === 'bn'
          ? 'মেনু থেকে যেকোনো সময় ইংরেজি ও বাংলা ভাষায় পরিবর্তন করতে পারেন।'
          : 'Easily toggle between English and Bengali anytime from the top menu.',
    },
  ];

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, banners.length]);

  const handleBannerClick = () => {
    // Copy app URL to clipboard and show toast
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      showUndoToast(t('linkCopied'), () => {});
    }
  };

  const current = banners[currentIndex];

  return (
    <div
      id="home-banner-container"
      className="mb-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        onClick={handleBannerClick}
        className="cursor-pointer relative overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--paper-card)] p-4 shadow-xs hover:border-[var(--accent)]/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                {current.tag}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-[var(--ink)] mt-1 truncate">
              {current.title}
            </h3>
            <p className="text-xs text-[var(--ink-dim)] mt-0.5 line-clamp-2 leading-relaxed">
              {current.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {banners.map((b, idx) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx
                ? 'w-5 bg-[var(--accent)]'
                : 'w-1.5 bg-[var(--rule)] hover:bg-[var(--ink-dim)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
