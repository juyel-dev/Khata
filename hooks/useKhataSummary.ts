'use client';

import { useState, useEffect } from 'react';
import { getOverallSummary, subscribeToDatabase } from '@/lib/db/operations';

export interface KhataSummary {
  totalToReceive: number;
  totalToPay: number;
  todayGot: number;
  todayGave: number;
  totalCash: number;
  totalCustomers: number;
}

export function useKhataSummary() {
  const [summary, setSummary] = useState<KhataSummary>({
    totalToReceive: 0,
    totalToPay: 0,
    todayGot: 0,
    todayGave: 0,
    totalCash: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      try {
        const res = await getOverallSummary();
        if (mounted) {
          setSummary(res);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in useKhataSummary:', err);
        if (mounted) setLoading(false);
      }
    };

    fetchSummary();
    const unsubscribe = subscribeToDatabase(fetchSummary);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { summary, loading };
}
