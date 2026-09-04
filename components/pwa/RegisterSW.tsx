'use client';

import { useEffect } from 'react';

// অ্যাপ খুললেই Service Worker চালু করে — কোনো বাটনের অপেক্ষা করে না।
// ফলে প্রথম ভিজিটেই পুরো অ্যাপ ক্যাশে জমে, পরে নেট ছাড়াই সব পেজ খোলে।
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        if (!cancelled && reg) {
          // নতুন version এলে পুরনো ট্যাবে আটকে না থেকে আপডেট নেয়
          reg.addEventListener('updatefound', () => {});
        }
      } catch (err) {
        console.warn('Khata SW registration notice:', err);
      }
    };

    register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
