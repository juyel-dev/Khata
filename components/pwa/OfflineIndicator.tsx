'use client';

import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { useI18n } from '@/lib/i18n';
import { WifiOff, Wifi, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineIndicator() {
  const { isSyncing, user } = useFirebaseAuth();
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-3 left-0 right-0 z-50 flex justify-center px-4">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            key="offline-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg backdrop-blur-xs"
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>{t('offlineMode')}</span>
          </motion.div>
        )}

        {isOnline && showReconnected && (
          <motion.div
            key="online-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg backdrop-blur-xs"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{user ? t('onlineBack') : 'Back Online'}</span>
          </motion.div>
        )}

        {isOnline && !showReconnected && isSyncing && (
          <motion.div
            key="syncing-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 text-white text-[11px] font-medium shadow-md backdrop-blur-xs"
          >
            <CloudUpload className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>{t('syncing')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
