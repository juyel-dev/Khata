'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrencySymbol, setCurrencySymbol, type CurrencySymbol } from './money';

// মুদ্রা বদলালে সব পর্দা সাথে সাথে বদলায়।
export function useCurrency(): [CurrencySymbol, (s: CurrencySymbol) => void] {
  const [currency, setCurrency] = useState<CurrencySymbol>(() => getCurrencySymbol());

  useEffect(() => {
    const handler = () => setCurrency(getCurrencySymbol());
    window.addEventListener('currencychange', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('currencychange', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const change = useCallback((s: CurrencySymbol) => {
    setCurrencySymbol(s);
    setCurrency(s);
  }, []);

  return [currency, change];
}

export const CURRENCY_OPTIONS: { symbol: CurrencySymbol; code: string }[] = [
  { symbol: '₹', code: 'INR' },
  { symbol: '৳', code: 'BDT' },
  { symbol: '$', code: 'USD' },
];
