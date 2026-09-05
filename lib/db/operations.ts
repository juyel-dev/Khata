import { db, Notebook, Transaction, NotebookWithStats, IndividualSummary } from './schema';

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
    const allNotebooks = await db.notebooks.toArray();
    const filtered = allNotebooks.filter((n) => {
      if (n.deletedAt) return false;
      if (!includeArchived && n.archived) return false;
      return true;
    });

    const result: NotebookWithStats[] = [];
    for (const nb of filtered) {
      const stats = await getNotebookStats(nb.id);
      result.push({
        ...nb,
        currentBalance: stats.currentBalance,
        transactionCount: stats.transactionCount,
      });
    }

    // Pinned first, then most recently updated
    return result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  } catch (err) {
    console.error('Error in getNotebooks:', err);
    return [];
  }
}

export async function getNotebook(id: string): Promise<NotebookWithStats | null> {
  try {
    const nb = await db.notebooks.get(id);
    if (!nb || nb.deletedAt) return null;
    const stats = await getNotebookStats(id);
    return {
      ...nb,
      currentBalance: stats.currentBalance,
      transactionCount: stats.transactionCount,
    };
  } catch (err) {
    console.error('Error in getNotebook:', err);
    return null;
  }
}

export async function getNotebookStats(notebookId: string): Promise<{
  currentBalance: number;
  transactionCount: number;
}> {
  const nb = await db.notebooks.get(notebookId);
  const openingBalance = nb?.openingBalance || 0;

  const txs = (await db.transactions.where('notebookId').equals(notebookId).toArray()).filter(
    (t) => !t.deletedAt
  );

  let totalGot = 0;
  let totalGave = 0;

  for (const t of txs) {
    if (t.type === 'got') {
      totalGot += t.amount;
    } else {
      totalGave += t.amount;
    }
  }

  const currentBalance = openingBalance + totalGot - totalGave;

  return {
    currentBalance,
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
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.notebooks.add(newNb);
  notifyChange();
  return newNb;
}

export async function updateNotebook(
  id: string,
  data: Partial<Pick<Notebook, 'name' | 'openingBalance' | 'color' | 'icon' | 'archived' | 'pinned'>>
): Promise<void> {
  await db.notebooks.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
  notifyChange();
}

export async function renameNotebook(id: string, name: string): Promise<void> {
  await db.notebooks.update(id, { name: name.trim(), updatedAt: Date.now() });
  notifyChange();
}

export async function pinNotebook(id: string, pinned = true): Promise<void> {
  await db.notebooks.update(id, { pinned, updatedAt: Date.now() });
  notifyChange();
}

export async function archiveNotebook(id: string, archive = true): Promise<void> {
  await db.notebooks.update(id, {
    archived: archive,
    updatedAt: Date.now(),
  });
  notifyChange();
}

// Soft-delete: khata "Recently Deleted"-e jay. Under-e thaka transaction gula
// আলাদা করে deleted dekhabo na - parent khata-i deleted bola jothesto (conflict এড়াতে)।
export async function deleteNotebook(id: string): Promise<Notebook | null> {
  const existing = await db.notebooks.get(id);
  if (!existing) return null;
  await db.notebooks.update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
  notifyChange();
  return existing;
}

export async function restoreNotebook(id: string): Promise<void> {
  await db.notebooks.update(id, { deletedAt: undefined, updatedAt: Date.now() });
  notifyChange();
}

// Hard delete - shudhu "Recently Deleted" theke "Delete forever" chapley, ba auto-purge-e
export async function deleteNotebookPermanently(id: string): Promise<void> {
  await db.transaction('rw', db.notebooks, db.transactions, async () => {
    await db.transactions.where('notebookId').equals(id).delete();
    await db.notebooks.delete(id);
  });
  notifyChange();
}

// -------------------------------------------------------------
// Individual (person-name grouped view) - no separate entity
// -------------------------------------------------------------

export async function getIndividualSummaries(notebookId: string): Promise<IndividualSummary[]> {
  const txs = (await db.transactions.where('notebookId').equals(notebookId).toArray()).filter(
    (t) => !t.deletedAt
  );

  const map = new Map<string, IndividualSummary>();

  for (const t of txs) {
    const key = t.personName || 'Unknown';
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        totalGiven: 0,
        totalGot: 0,
        net: 0,
        transactionCount: 0,
        lastTransaction: undefined,
      });
    }
    const entry = map.get(key)!;
    if (t.type === 'gave') {
      entry.totalGiven += t.amount;
    } else {
      entry.totalGot += t.amount;
    }
    entry.net = entry.totalGot - entry.totalGiven;
    entry.transactionCount += 1;
    if (!entry.lastTransaction || t.occurredAt > entry.lastTransaction.occurredAt) {
      entry.lastTransaction = t;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.lastTransaction?.occurredAt || 0) - (a.lastTransaction?.occurredAt || 0)
  );
}

// Distinct names used before in this notebook - datalist suggestions when adding a transaction
export async function getPersonNameSuggestions(notebookId: string): Promise<string[]> {
  const txs = (await db.transactions.where('notebookId').equals(notebookId).toArray())
    .filter((t) => !t.deletedAt)
    .sort((a, b) => b.occurredAt - a.occurredAt);

  const seen = new Set<string>();
  const names: string[] = [];
  for (const t of txs) {
    if (t.personName && !seen.has(t.personName)) {
      seen.add(t.personName);
      names.push(t.personName);
    }
  }
  return names;
}

// -------------------------------------------------------------
// Transaction Operations
// -------------------------------------------------------------

export async function getTransactions(options?: {
  notebookId?: string;
  personName?: string;
  type?: 'gave' | 'got';
  limit?: number;
  includeDeleted?: boolean;
}): Promise<(Transaction & { notebookName?: string; notebookColor?: string })[]> {
  let txs: Transaction[] = [];

  if (options?.notebookId) {
    txs = await db.transactions.where('notebookId').equals(options.notebookId).toArray();
  } else {
    txs = await db.transactions.toArray();
  }

  if (!options?.includeDeleted) {
    txs = txs.filter((t) => !t.deletedAt);
  } else {
    txs = txs.filter((t) => !!t.deletedAt);
  }

  if (options?.personName) {
    txs = txs.filter((t) => t.personName === options.personName);
  }

  if (options?.type) {
    txs = txs.filter((t) => t.type === options.type);
  }

  // Sort newest first
  txs.sort((a, b) => b.occurredAt - a.occurredAt);

  if (options?.limit && options.limit > 0) {
    txs = txs.slice(0, options.limit);
  }

  const nbMap = new Map<string, { name: string; color: string }>();
  const notebooks = await db.notebooks.toArray();
  notebooks.forEach((n) => nbMap.set(n.id, { name: n.name, color: n.color }));

  return txs.map((t) => {
    const nb = nbMap.get(t.notebookId);
    return {
      ...t,
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
  personName: string;
  type: 'gave' | 'got';
  amount: number; // in integer paise
  note?: string;
  occurredAt?: number;
}): Promise<Transaction> {
  const now = Date.now();
  const tx: Transaction = {
    id: generateId(),
    notebookId: data.notebookId,
    personName: data.personName.trim(),
    type: data.type,
    amount: Math.abs(Math.round(data.amount)),
    note: data.note?.trim() || undefined,
    occurredAt: data.occurredAt || now,
    createdAt: now,
    updatedAt: now,
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
  data: Partial<Pick<Transaction, 'type' | 'amount' | 'note' | 'occurredAt' | 'personName'>>
): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) return;

  const now = Date.now();
  const updates: Partial<Transaction> = {
    ...data,
    updatedAt: now,
  };
  if (data.amount !== undefined) {
    updates.amount = Math.abs(Math.round(data.amount));
  }
  if (data.note !== undefined) {
    updates.note = data.note.trim() || undefined;
  }
  if (data.personName !== undefined) {
    updates.personName = data.personName.trim();
  }

  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    await db.transactions.update(id, updates);
    await db.notebooks.update(existing.notebookId, { updatedAt: now });
  });

  notifyChange();
}

// Soft-delete - "Recently Deleted"-e dekhabe, restore kora jabe
export async function deleteTransaction(id: string): Promise<Transaction | null> {
  const existing = await db.transactions.get(id);
  if (!existing) return null;

  const now = Date.now();
  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    await db.transactions.update(id, { deletedAt: now, updatedAt: now });
    await db.notebooks.update(existing.notebookId, { updatedAt: now });
  });

  notifyChange();
  return existing;
}

export async function restoreTransaction(tx: Transaction | string): Promise<void> {
  const id = typeof tx === 'string' ? tx : tx.id;
  await db.transaction('rw', db.transactions, db.notebooks, async () => {
    const existing = await db.transactions.get(id);
    if (!existing) return;
    await db.transactions.update(id, { deletedAt: undefined, updatedAt: Date.now() });
    await db.notebooks.update(existing.notebookId, { updatedAt: Date.now() });
  });
  notifyChange();
}

export async function deleteTransactionPermanently(id: string): Promise<void> {
  await db.transactions.delete(id);
  notifyChange();
}

// -------------------------------------------------------------
// Recently Deleted (khata + transaction, unified)
// -------------------------------------------------------------

export interface RecentlyDeletedItem {
  kind: 'notebook' | 'transaction';
  id: string;
  title: string;
  subtitle: string;
  deletedAt: number;
  notebookId?: string;
}

export async function getRecentlyDeleted(): Promise<RecentlyDeletedItem[]> {
  const notebooks = await db.notebooks.toArray();
  const deletedNotebooks = notebooks.filter((n) => !!n.deletedAt);
  const deletedNotebookIds = new Set(deletedNotebooks.map((n) => n.id));

  const allTxs = await db.transactions.toArray();
  // Ekta transaction shudhu tokhon-i "recently deleted"-e alada kore dekhano hobe jokhon
  // ota nijei deleted, kintu tar khata deleted na (nahole double-count/conflict hoy).
  const deletedTxs = allTxs.filter((t) => !!t.deletedAt && !deletedNotebookIds.has(t.notebookId));

  const nbMap = new Map<string, Notebook>();
  notebooks.forEach((n) => nbMap.set(n.id, n));

  const items: RecentlyDeletedItem[] = [];

  deletedNotebooks.forEach((n) => {
    items.push({
      kind: 'notebook',
      id: n.id,
      title: n.name,
      subtitle: 'khata',
      deletedAt: n.deletedAt!,
    });
  });

  deletedTxs.forEach((t) => {
    const nb = nbMap.get(t.notebookId);
    items.push({
      kind: 'transaction',
      id: t.id,
      title: t.personName,
      subtitle: nb?.name || '',
      deletedAt: t.deletedAt!,
      notebookId: t.notebookId,
    });
  });

  return items.sort((a, b) => b.deletedAt - a.deletedAt);
}

export async function restoreRecentlyDeletedItem(item: RecentlyDeletedItem): Promise<void> {
  if (item.kind === 'notebook') {
    await restoreNotebook(item.id);
  } else {
    await restoreTransaction(item.id);
  }
}

export async function deleteRecentlyDeletedItemForever(item: RecentlyDeletedItem): Promise<void> {
  if (item.kind === 'notebook') {
    await deleteNotebookPermanently(item.id);
  } else {
    await deleteTransactionPermanently(item.id);
  }
}

// Auto-purge items older than 30 days from trash. Call opportunistically (e.g. app load).
export async function purgeOldDeletedItems(maxAgeDays = 30): Promise<void> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const notebooks = await db.notebooks.toArray();
  for (const n of notebooks) {
    if (n.deletedAt && n.deletedAt < cutoff) {
      await deleteNotebookPermanently(n.id);
    }
  }
  const txs = await db.transactions.toArray();
  for (const t of txs) {
    if (t.deletedAt && t.deletedAt < cutoff) {
      await deleteTransactionPermanently(t.id);
    }
  }
}

// -------------------------------------------------------------
// Backup & Restore Operations
// -------------------------------------------------------------

export interface KhataBackupData {
  version: 1 | 2;
  exportedAt: number;
  appName: string;
  notebooks: Notebook[];
  people?: { id: string; notebookId: string; name: string }[]; // v1 legacy only
  transactions: Transaction[];
}

export async function exportAllData(): Promise<KhataBackupData> {
  const notebooks = await db.notebooks.toArray();
  const transactions = await db.transactions.toArray();

  return {
    version: 2,
    exportedAt: Date.now(),
    appName: 'Khata',
    notebooks,
    transactions,
  };
}

export async function importBackupData(
  jsonData: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; notebooksCount: number; txCount: number; error?: string }> {
  try {
    const data = JSON.parse(jsonData) as KhataBackupData;
    if (!data.notebooks || !data.transactions) {
      return { success: false, notebooksCount: 0, txCount: 0, error: 'Invalid backup file format' };
    }

    // v1 legacy backups had personId on transactions + a people[] array - migrate to personName.
    const peopleMap = new Map<string, string>();
    if (data.version === 1 && Array.isArray(data.people)) {
      data.people.forEach((p) => peopleMap.set(p.id, p.name));
    }

    await db.transaction('rw', db.notebooks, db.transactions, async () => {
      if (mode === 'replace') {
        await db.transactions.clear();
        await db.notebooks.clear();
      }

      const now = Date.now();
      for (const nb of data.notebooks) {
        await db.notebooks.put({
          ...nb,
          pinned: (nb as any).pinned || false,
          updatedAt: nb.updatedAt || nb.createdAt || now,
        });
      }
      for (const t of data.transactions as any[]) {
        const personName = t.personName || peopleMap.get(t.personId) || 'Unknown';
        const { personId, ...rest } = t;
        await db.transactions.put({
          ...rest,
          personName,
          updatedAt: t.updatedAt || t.createdAt || now,
        } as Transaction);
      }
    });

    notifyChange();
    return {
      success: true,
      notebooksCount: data.notebooks.length,
      txCount: data.transactions.length,
    };
  } catch (err: any) {
    return {
      success: false,
      notebooksCount: 0,
      txCount: 0,
      error: err.message || 'Failed to parse backup',
    };
  }
}
