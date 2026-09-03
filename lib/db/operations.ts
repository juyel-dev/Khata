import { db, Notebook, Person, Transaction, NotebookWithStats, PersonWithBalance } from './schema';

// Simple pub/sub for database changes to keep all React views synchronized
type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

export function subscribeToDatabase(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChange() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error('Error in database subscriber:', err);
    }
  });
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// -------------------------------------------------------------
// Notebook Operations
// -------------------------------------------------------------

export async function getNotebooks(includeArchived = false): Promise<NotebookWithStats[]> {
  try {
    let collection = db.notebooks.toCollection();
    if (!includeArchived) {
      collection = db.notebooks.where('archived').equals(0 as any); // dexie boolean index
    }
    const notebooks = await collection.toArray();
    // Filter manually just in case boolean index behaves differently across browsers
    const filtered = includeArchived ? notebooks : notebooks.filter((n) => !n.archived);

    // Compute stats for each
    const result: NotebookWithStats[] = [];
    for (const nb of filtered) {
      const stats = await getNotebookStats(nb.id);
      result.push({
        ...nb,
        currentBalance: stats.currentBalance,
        peopleCount: stats.peopleCount,
        transactionCount: stats.transactionCount,
      });
    }

    // Sort by most recently updated
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Error in getNotebooks:', err);
    return [];
  }
}

export async function getNotebook(id: string): Promise<NotebookWithStats | null> {
  try {
    const nb = await db.notebooks.get(id);
    if (!nb) return null;
    const stats = await getNotebookStats(id);
    return {
      ...nb,
      currentBalance: stats.currentBalance,
      peopleCount: stats.peopleCount,
      transactionCount: stats.transactionCount,
    };
  } catch (err) {
    console.error('Error in getNotebook:', err);
    return null;
  }
}

export async function getNotebookStats(notebookId: string): Promise<{
  currentBalance: number;
  peopleCount: number;
  transactionCount: number;
}> {
  const nb = await db.notebooks.get(notebookId);
  const openingBalance = nb?.openingBalance || 0;

  const txs = await db.transactions.where('notebookId').equals(notebookId).toArray();
  const people = await db.people.where('notebookId').equals(notebookId).toArray();

  let totalGot = 0;
  let totalGave = 0;

  for (const t of txs) {
    if (t.type === 'got') {
      totalGot += t.amount;
    } else {
      totalGave += t.amount;
    }
  }

  // currentBalance = openingBalance + sum(got) - sum(gave)
  const currentBalance = openingBalance + totalGot - totalGave;

  return {
    currentBalance,
    peopleCount: people.length,
    transactionCount: txs.length,
  };
}

export async function createNotebook(data: {
  name: string;
  openingBalance: number;
  color?: string;
  icon?: string;
}): Promise<Notebook> {
  const now = Date.now();
  const newNb: Notebook = {
    id: generateId(),
    name: data.name.trim(),
    openingBalance: Math.round(data.openingBalance || 0),
    color: data.color || '#2F6B4F',
    icon: data.icon || 'book',
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.notebooks.add(newNb);
  notifyChange();
  return newNb;
}

export async function updateNotebook(
  id: string,
  data: Partial<Pick<Notebook, 'name' | 'openingBalance' | 'color' | 'icon' | 'archived'>>
): Promise<void> {
  await db.notebooks.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
  notifyChange();
}

export async function archiveNotebook(id: string, archive = true): Promise<void> {
  await db.notebooks.update(id, {
    archived: archive,
    updatedAt: Date.now(),
  });
  notifyChange();
}

export async function deleteNotebookPermanently(id: string): Promise<void> {
  await db.transaction('rw', db.notebooks, db.people, db.transactions, async () => {
    await db.transactions.where('notebookId').equals(id).delete();
    await db.people.where('notebookId').equals(id).delete();
    await db.notebooks.delete(id);
  });
  notifyChange();
}

// -------------------------------------------------------------
// Person Operations
// -------------------------------------------------------------

export async function getPeopleWithBalances(notebookId: string): Promise<PersonWithBalance[]> {
  const people = await db.people.where('notebookId').equals(notebookId).toArray();
  const txs = await db.transactions.where('notebookId').equals(notebookId).toArray();

  const result: PersonWithBalance[] = people.map((person) => {
    const personTxs = txs.filter((t) => t.personId === person.id);
    let totalGiven = 0;
    let totalTaken = 0;

    // Sort txs newest first
    personTxs.sort((a, b) => b.occurredAt - a.occurredAt);

    for (const t of personTxs) {
      if (t.type === 'gave') {
        totalGiven += t.amount;
      } else {
        totalTaken += t.amount;
      }
    }

    return {
      ...person,
      totalGiven,
      totalTaken,
      net: totalGiven - totalTaken,
      lastTransaction: personTxs[0],
      transactionCount: personTxs.length,
    };
  });

  // Sort by most recent transaction, then by creation date
  return result.sort((a, b) => {
    const aTime = a.lastTransaction?.occurredAt || a.createdAt;
    const bTime = b.lastTransaction?.occurredAt || b.createdAt;
    return bTime - aTime;
  });
}

export async function getPersonWithBalance(personId: string): Promise<PersonWithBalance | null> {
  const person = await db.people.get(personId);
  if (!person) return null;

  const personTxs = await db.transactions.where('personId').equals(personId).toArray();
  let totalGiven = 0;
  let totalTaken = 0;

  personTxs.sort((a, b) => b.occurredAt - a.occurredAt);

  for (const t of personTxs) {
    if (t.type === 'gave') {
      totalGiven += t.amount;
    } else {
      totalTaken += t.amount;
    }
  }

  return {
    ...person,
    totalGiven,
    totalTaken,
    net: totalGiven - totalTaken,
    lastTransaction: personTxs[0],
    transactionCount: personTxs.length,
  };
}

export async function getOrCreatePerson(notebookId: string, name: string): Promise<Person> {
  const cleanName = name.trim();
  const existing = await db.people
    .where('notebookId')
    .equals(notebookId)
    .filter((p) => p.name.toLowerCase() === cleanName.toLowerCase())
    .first();

  if (existing) {
    return existing;
  }

  const newPerson: Person = {
    id: generateId(),
    notebookId,
    name: cleanName,
    createdAt: Date.now(),
  };

  await db.people.add(newPerson);
  notifyChange();
  return newPerson;
}

export async function updatePerson(id: string, name: string): Promise<void> {
  await db.people.update(id, { name: name.trim() });
  notifyChange();
}

export async function deletePerson(personId: string): Promise<boolean> {
  // Only allow if no transactions exist
  const count = await db.transactions.where('personId').equals(personId).count();
  if (count > 0) {
    return false;
  }
  await db.people.delete(personId);
  notifyChange();
  return true;
}

// -------------------------------------------------------------
// Transaction Operations
// -------------------------------------------------------------

export async function getTransactions(options?: {
  notebookId?: string;
  personId?: string;
  type?: 'gave' | 'got';
  limit?: number;
}): Promise<(Transaction & { personName?: string; notebookName?: string; notebookColor?: string })[]> {
  let txs: Transaction[] = [];

  if (options?.personId) {
    txs = await db.transactions.where('personId').equals(options.personId).toArray();
  } else if (options?.notebookId) {
    txs = await db.transactions.where('notebookId').equals(options.notebookId).toArray();
  } else {
    txs = await db.transactions.toArray();
  }

  if (options?.type) {
    txs = txs.filter((t) => t.type === options.type);
  }

  // Sort newest first
  txs.sort((a, b) => b.occurredAt - a.occurredAt);

  if (options?.limit && options.limit > 0) {
    txs = txs.slice(0, options.limit);
  }

  // Pre-fetch people and notebooks for enrichment
  const peopleMap = new Map<string, string>();
  const nbMap = new Map<string, { name: string; color: string }>();

  const people = await db.people.toArray();
  people.forEach((p) => peopleMap.set(p.id, p.name));

  const notebooks = await db.notebooks.toArray();
  notebooks.forEach((n) => nbMap.set(n.id, { name: n.name, color: n.color }));

  return txs.map((t) => {
    const nb = nbMap.get(t.notebookId);
    return {
      ...t,
      personName: peopleMap.get(t.personId) || 'Unknown',
      notebookName: nb?.name || '',
      notebookColor: nb?.color || '#2F6B4F',
    };
  });
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const tx = await db.transactions.get(id);
  return tx || null;
}

export async function createTransaction(data: {
  notebookId: string;
  personId: string;
  type: 'gave' | 'got';
  amount: number; // in integer paise
  note?: string;
  occurredAt?: number;
}): Promise<Transaction> {
  const now = Date.now();
  const tx: Transaction = {
    id: generateId(),
    notebookId: data.notebookId,
    personId: data.personId,
    type: data.type,
    amount: Math.abs(Math.round(data.amount)),
    note: data.note?.trim() || undefined,
    occurredAt: data.occurredAt || now,
    createdAt: now,
  };

  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    await db.transactions.add(tx);
    await db.notebooks.update(data.notebookId, { updatedAt: now });
  });

  notifyChange();
  return tx;
}

export async function updateTransaction(
  id: string,
  data: Partial<Pick<Transaction, 'type' | 'amount' | 'note' | 'occurredAt' | 'personId' | 'notebookId'>>
): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) return;

  const now = Date.now();
  const updates: Partial<Transaction> = {
    ...data,
  };
  if (data.amount !== undefined) {
    updates.amount = Math.abs(Math.round(data.amount));
  }
  if (data.note !== undefined) {
    updates.note = data.note.trim() || undefined;
  }

  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    await db.transactions.update(id, updates);
    await db.notebooks.update(existing.notebookId, { updatedAt: now });
  });

  notifyChange();
}

export async function deleteTransaction(id: string): Promise<Transaction | null> {
  const existing = await db.transactions.get(id);
  if (!existing) return null;

  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    await db.transactions.delete(id);
    await db.notebooks.update(existing.notebookId, { updatedAt: Date.now() });
  });

  notifyChange();
  return existing;
}

export async function restoreTransaction(tx: Transaction): Promise<void> {
  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    await db.transactions.add(tx);
    await db.notebooks.update(tx.notebookId, { updatedAt: Date.now() });
  });
  notifyChange();
}

// -------------------------------------------------------------
// Backup & Restore Operations
// -------------------------------------------------------------

export interface KhataBackupData {
  version: 1;
  exportedAt: number;
  appName: string;
  notebooks: Notebook[];
  people: Person[];
  transactions: Transaction[];
}

export async function exportAllData(): Promise<KhataBackupData> {
  const notebooks = await db.notebooks.toArray();
  const people = await db.people.toArray();
  const transactions = await db.transactions.toArray();

  return {
    version: 1,
    exportedAt: Date.now(),
    appName: 'Khata',
    notebooks,
    people,
    transactions,
  };
}

export async function importBackupData(
  jsonData: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; notebooksCount: number; peopleCount: number; txCount: number; error?: string }> {
  try {
    const data = JSON.parse(jsonData) as KhataBackupData;
    if (!data.notebooks || !data.people || !data.transactions) {
      return { success: false, notebooksCount: 0, peopleCount: 0, txCount: 0, error: 'Invalid backup file format' };
    }

    await db.transaction('rw', db.notebooks, db.people, db.transactions, async () => {
      if (mode === 'replace') {
        await db.transactions.clear();
        await db.people.clear();
        await db.notebooks.clear();
      }

      for (const nb of data.notebooks) {
        await db.notebooks.put(nb);
      }
      for (const p of data.people) {
        await db.people.put(p);
      }
      for (const t of data.transactions) {
        await db.transactions.put(t);
      }
    });

    notifyChange();
    return {
      success: true,
      notebooksCount: data.notebooks.length,
      peopleCount: data.people.length,
      txCount: data.transactions.length,
    };
  } catch (err: any) {
    return {
      success: false,
      notebooksCount: 0,
      peopleCount: 0,
      txCount: 0,
      error: err.message || 'Failed to parse backup',
    };
  }
}
