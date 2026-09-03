'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useI18n } from '@/lib/i18n';
import { Download, Share, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'banner';
  className?: string;
}

export function PWAInstallButton({ variant = 'header', className = '' }: PWAInstallButtonProps) {
  const { isMounted, isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If not mounted yet (SSR) or already running in standalone mode, do not show button
  if (!isMounted || isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else {
      // Show guided instructions for iOS Safari or browsers without beforeinstallprompt
      setShowModal(true);
    }
  };

  if (variant === 'drawer') {
    return (
      <>
        <button
          id="pwa-install-drawer-btn"
          type="button"
          onClick={handleClick}
          className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold shadow-xs hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{t('installApp')}</span>
        </button>

        <InstallGuideModal
          isOpen={showModal}
          isIOS={isIOS}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  // Default: Header button (compact & responsive)
  return (
    <>
      <button
        id="pwa-install-header-btn"
        type="button"
        onClick={handleClick}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${className}`}
        title={t('installAppDesc')}
      >
        {justInstalled ? (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{t('appInstalled')}</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 animate-bounce transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-bold hidden sm:inline">{t('installApp')}</span>
            <span className="text-[11px] font-bold sm:hidden">{t('installAppShort')}</span>
          </>
        )}
      </button>

      <InstallGuideModal
        isOpen={showModal}
        isIOS={isIOS}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

function InstallGuideModal({
  isOpen,
  isIOS,
  onClose,
}: {
  isOpen: boolean;
  isIOS: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[var(--paper-card)] border border-[var(--rule)] p-6 shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--ink)]">
                  {t('installGuideTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
              {t('installAppDesc')}
            </p>

            {isIOS ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] text-xs text-[var(--ink)]">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <div>{t('installGuideIOSStep1')}</div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>{t('installGuideIOSStep2')}</div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] text-xs text-[var(--ink)] space-y-2">
                <p>{t('installGuideAndroid')}</p>
                <p className="text-[11px] text-[var(--ink-dim)]">
                  In Chrome / Edge: Click the 3 dots menu &rarr; &quot;Install Khata&quot; or &quot;Add to Home Screen&quot;.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
