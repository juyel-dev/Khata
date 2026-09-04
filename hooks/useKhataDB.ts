'use client';

import { useState, useEffect } from 'react';
import {
  NotebookWithStats,
  PersonWithBalance,
  Transaction,
} from '@/lib/db/schema';
import {
  getNotebooks,
  getNotebook,
  getPeopleWithBalances,
  getAllPeopleWithBalances,
  getPersonWithBalance,
  getTransactions,
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
        // খালি থাকলে খালিই — "প্রথম খাতা বানান" পথ দেখাবে, auto-খাতা নয়।
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

export function useAllPeople() {
  const [people, setPeople] = useState<
    (PersonWithBalance & { notebookName?: string; notebookColor?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAllPeople = async () => {
      try {
        const data = await getAllPeopleWithBalances();
        if (isMounted) {
          setPeople(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load all people:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchAllPeople();
    const unsubscribe = subscribeToDatabase(fetchAllPeople);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { people, loading };
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

export function usePeople(notebookId: string | null) {
  const [people, setPeople] = useState<PersonWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!notebookId) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setPeople([]);
          setLoading(false);
        }
      });
      return;
    }

    const fetchPeople = () => {
      getPeopleWithBalances(notebookId)
        .then((data) => {
          if (isMounted) {
            setPeople(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load people:', err);
          if (isMounted) setLoading(false);
        });
    };

    fetchPeople();
    const unsubscribe = subscribeToDatabase(fetchPeople);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [notebookId]);

  return { people, loading };
}

export function usePerson(personId: string | null) {
  const [person, setPerson] = useState<PersonWithBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!personId) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setPerson(null);
          setLoading(false);
        }
      });
      return;
    }

    const fetchPerson = () => {
      getPersonWithBalance(personId)
        .then((data) => {
          if (isMounted) {
            setPerson(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load person:', err);
          if (isMounted) setLoading(false);
        });
    };

    fetchPerson();
    const unsubscribe = subscribeToDatabase(fetchPerson);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [personId]);

  return { person, loading };
}

export function useTransactions(options?: {
  notebookId?: string;
  personId?: string;
  type?: 'gave' | 'got';
  limit?: number;
}) {
  const [transactions, setTransactions] = useState<
    (Transaction & { personName?: string; notebookName?: string; notebookColor?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const nbId = options?.notebookId;
  const pId = options?.personId;
  const txType = options?.type;
  const limitVal = options?.limit;

  useEffect(() => {
    let isMounted = true;

    const fetchTxs = () => {
      getTransactions({
        notebookId: nbId,
        personId: pId,
        type: txType,
        limit: limitVal,
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
  }, [nbId, pId, txType, limitVal]);

  return { transactions, loading };
}
