'use client';

import React, { useEffect, useState } from 'react';
import { useKhataUI, UndoToastConfig } from '@/lib/context/KhataUIContext';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

function ToastItem({ toast }: { toast: UndoToastConfig }) {
  const { t } = useI18n();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id]);

  return (
    <motion.div
      id="khata-undo-toast"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 overflow-hidden rounded-xl shadow-lg bg-[var(--ink)] text-[var(--paper)] py-3 px-4 flex items-center justify-between gap-3 select-none"
    >
      <span className="text-sm font-medium truncate">{toast.message}</span>
      <button
        id="undo-toast-btn"
        type="button"
        onClick={toast.onUndo}
        className="text-sm font-bold text-[#6EE7B7] hover:text-white underline underline-offset-2 shrink-0 py-1 px-2 cursor-pointer transition-colors"
      >
        {t('undo')}
      </button>

      {/* 5-second progress indicator line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-[#6EE7B7]/40 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </motion.div>
  );
}

export function UndoToast() {
  const { undoToast } = useKhataUI();

  return (
    <AnimatePresence>
      {undoToast && <ToastItem key={undoToast.id} toast={undoToast} />}
    </AnimatePresence>
  );
}
