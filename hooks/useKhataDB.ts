'use client';

import { useState, useEffect } from 'react';
import { NotebookWithStats, Transaction, IndividualSummary } from '@/lib/db/schema';
import {
  getNotebooks,
  getNotebook,
  getTransactions,
  getIndividualSummaries,
  subscribeToDatabase,
} from '@/lib/db/operations';

export function useNotebooks(includeArchived = false) {
  const [notebooks, setNotebooks] = useState<NotebookWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchNotebooks = async () => {
      try {
        const data = await getNotebooks(includeArchived);
        if (isMounted) {
          setNotebooks(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load notebooks:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchNotebooks();
    const unsubscribe = subscribeToDatabase(fetchNotebooks);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [includeArchived]);

  return { notebooks, loading };
}

export function useNotebook(id: string | null) {
  const [notebook, setNotebook] = useState<NotebookWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setNotebook(null);
          setLoading(false);
        }
      });
      return;
    }

    const fetchNotebook = () => {
      getNotebook(id)
        .then((data) => {
          if (isMounted) {
            setNotebook(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load notebook:', err);
          if (isMounted) setLoading(false);
        });
    };

    fetchNotebook();
    const unsubscribe = subscribeToDatabase(fetchNotebook);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [id]);

  return { notebook, loading };
}

export function useIndividualSummaries(notebookId: string | null) {
  const [individuals, setIndividuals] = useState<IndividualSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!notebookId) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setIndividuals([]);
          setLoading(false);
        }
      });
      return;
    }

    const fetchData = () => {
      getIndividualSummaries(notebookId)
        .then((data) => {
          if (isMounted) {
            setIndividuals(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load individual summaries:', err);
          if (isMounted) setLoading(false);
        });
    };

    fetchData();
    const unsubscribe = subscribeToDatabase(fetchData);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [notebookId]);

  return { individuals, loading };
}

export function useTransactions(options?: {
  notebookId?: string;
  personName?: string;
  type?: 'gave' | 'got';
  limit?: number;
  includeDeleted?: boolean;
}) {
  const [transactions, setTransactions] = useState<
    (Transaction & { notebookName?: string; notebookColor?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const nbId = options?.notebookId;
  const pName = options?.personName;
  const txType = options?.type;
  const limitVal = options?.limit;
  const includeDeleted = options?.includeDeleted;

  useEffect(() => {
    let isMounted = true;

    const fetchTxs = () => {
      getTransactions({
        notebookId: nbId,
        personName: pName,
        type: txType,
        limit: limitVal,
        includeDeleted,
      })
        .then((data) => {
          if (isMounted) {
            setTransactions(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load transactions:', err);
          if (isMounted) setLoading(false);
        });
    };

    fetchTxs();
    const unsubscribe = subscribeToDatabase(fetchTxs);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [nbId, pName, txType, limitVal, includeDeleted]);

  return { transactions, loading };
}
