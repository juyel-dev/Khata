'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { getAdminBanners, MAX_BANNER_SLIDES, MAX_TIP_SLIDES, type AdminBanner } from '@/lib/banners';
import { Sparkles, ShieldCheck, Languages, X, ExternalLink, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TipSlide {
  kind: 'tip';
  id: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  desc: string;
}

interface ImageSlide {
  kind: 'image';
  banner: AdminBanner;
}

type Slide = TipSlide | ImageSlide;

export function HomeBanners() {
  const { lang, t } = useI18n();
  const { showUndoToast } = useKhataUI();
  const [admin, setAdmin] = useState<AdminBanner[]>([]);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [popup, setPopup] = useState<AdminBanner | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let alive = true;
    getAdminBanners().then((items) => {
      if (alive) setAdmin(items);
    });
    return () => {
      alive = false;
    };
  }, []);

  const tips: TipSlide[] = [
    {
      kind: 'tip',
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
      kind: 'tip',
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
      kind: 'tip',
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

  // নিয়ম: tips আগে, তারপর admin ছবি — মোট সর্বোচ্চ ৫টা।
  // 0 ছবি → ৩ tips | 1 → ৩+১ | 2 → ৩+২ | 3 → ২+৩ | 4 → ১+৪ | 5 → শুধু ৫ ছবি
  const visibleAdmin = admin.filter((b) => !failedIds.has(b.id)).slice(0, MAX_BANNER_SLIDES);
  const tipCount = Math.max(0, Math.min(MAX_TIP_SLIDES, MAX_BANNER_SLIDES - visibleAdmin.length));
  const slides: Slide[] = [
    ...tips.slice(0, tipCount),
    ...visibleAdmin.map((banner) => ({ kind: 'image' as const, banner })),
  ];

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length]);

  if (slides.length === 0) return null;
  const safeIndex = currentIndex % slides.length;
  const current = slides[safeIndex];

  const markFailed = (id: string) => {
    setFailedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showUndoToast(t('linkCopied'));
    } catch {
      showUndoToast(url);
    }
  };

  return (
    <div
      id="home-banner-container"
      className="select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--paper-card)] shadow-xs">
        {current.kind === 'tip' ? (
          <div className="p-4">
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
        ) : (
          <button
            type="button"
            onClick={() => setPopup(current.banner)}
            className="block w-full cursor-pointer"
            aria-label={current.banner.title || 'Banner'}
          >
            <img
              src={current.banner.imageUrl}
              alt={current.banner.title || 'Khata'}
              loading="lazy"
              onError={() => markFailed(current.banner.id)}
              className="w-full aspect-[2/1] object-cover"
            />
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {slides.map((s, idx) => (
            <button
              key={s.kind === 'tip' ? s.id : `img-${s.banner.id}`}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                safeIndex === idx
                  ? 'w-5 bg-[var(--accent)]'
                  : 'w-1.5 bg-[var(--rule)] hover:bg-[var(--ink-dim)]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Banner popup: Open + Copy link */}
      <AnimatePresence>
        {popup && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPopup(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[var(--paper-card)] border border-[var(--rule)] p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--ink)] truncate pr-2">
                  {popup.title || 'Khata'}
                </h3>
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="p-1.5 rounded-lg text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[var(--rule)]">
                <img
                  src={popup.imageUrl}
                  alt={popup.title || 'Khata'}
                  className="w-full aspect-[2/1] object-cover"
                />
              </div>

              {popup.linkUrl ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(popup.linkUrl, '_blank')}
                    className="py-2.5 px-3 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t('open')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(popup.linkUrl as string)}
                    className="py-2.5 px-3 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] text-xs font-bold hover:bg-[var(--rule)]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('copyLink')}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
                >
                  OK
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
