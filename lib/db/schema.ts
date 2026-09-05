import Dexie, { type Table } from 'dexie';

export interface Notebook {
  id: string;
  name: string;
  openingBalance: number; // in integer paise
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  pinned: boolean;
  color: string;
  icon: string;
  deletedAt?: number; // soft-delete: khata "recently deleted"-e jay, hard-delete na
}

export interface Transaction {
  id: string;
  notebookId: string;
  personName: string; // free-text name, no separate Person entity
  type: 'gave' | 'got'; // gave = '-', got = '+'
  amount: number; // in integer paise
  note?: string;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number; // soft-delete
}

export interface NotebookWithStats extends Notebook {
  currentBalance: number; // openingBalance + sum(got) - sum(gave)
  transactionCount: number;
}

// Computed from transactions grouped by personName - no separate table
export interface IndividualSummary {
  name: string;
  totalGiven: number; // paise, type === 'gave'
  totalGot: number; // paise, type === 'got'
  net: number; // totalGot - totalGiven
  transactionCount: number;
  lastTransaction?: Transaction;
}

export class KhataDatabase extends Dexie {
  notebooks!: Table<Notebook, string>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super('KhataDatabase');
    this.version(1).stores({
      notebooks: 'id, archived, createdAt, updatedAt',
      people: 'id, notebookId, name, createdAt',
      transactions: 'id, notebookId, personId, occurredAt, type, createdAt',
    });
    this.version(2)
      .stores({
        notebooks: 'id, archived, createdAt, updatedAt',
        people: 'id, notebookId, name, createdAt, updatedAt',
        transactions: 'id, notebookId, personId, occurredAt, type, createdAt, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('people')
          .toCollection()
          .modify((p: any) => {
            p.updatedAt = p.updatedAt || p.createdAt || Date.now();
          });
        await tx
          .table('transactions')
          .toCollection()
          .modify((t: any) => {
            t.updatedAt = t.updatedAt || t.createdAt || Date.now();
          });
        const nbs = (await tx.table('notebooks').toArray()) as any[];
        const defaults = nbs
          .filter((n) => (n.name || '').trim() === 'সাধারণ খাতা')
          .sort((a, b) => a.createdAt - b.createdAt);
        if (defaults.length > 1) {
          const people = (await tx.table('people').toArray()) as any[];
          const txs = (await tx.table('transactions').toArray()) as any[];
          for (const d of defaults.slice(1)) {
            const hasP = people.some((p) => p.notebookId === d.id);
            const hasT = txs.some((t) => t.notebookId === d.id);
            if (!hasP && !hasT) {
              await tx.table('notebooks').delete(d.id);
            }
          }
        }
      });

    // v3: lending/Person system removed - surgical simple ledger.
    // personId -> personName (migrated by name lookup, no data loss).
    // Notebook gets pinned + deletedAt, Transaction gets deletedAt. `people` table dropped.
    this.version(3)
      .stores({
        notebooks: 'id, archived, pinned, createdAt, updatedAt, deletedAt',
        people: null,
        transactions: 'id, notebookId, occurredAt, type, createdAt, updatedAt, deletedAt',
      })
      .upgrade(async (tx) => {
        const people = (await tx.table('people').toArray()) as any[];
        const peopleMap = new Map<string, string>();
        people.forEach((p) => peopleMap.set(p.id, p.name));

        await tx
          .table('transactions')
          .toCollection()
          .modify((t: any) => {
            if (!t.personName) {
              t.personName = peopleMap.get(t.personId) || 'Unknown';
            }
            delete t.personId;
          });

        await tx
          .table('notebooks')
          .toCollection()
          .modify((n: any) => {
            if (n.pinned === undefined) n.pinned = false;
          });
      });
  }
}

// Global db instance
export const db = new KhataDatabase();

// Color palette options for notebooks
export const NOTEBOOK_COLORS = [
  { id: 'emerald', hex: '#2F6B4F', label: 'Ledger Green' },
  { id: 'terracotta', hex: '#B4491F', label: 'Terracotta' },
  { id: 'navy', hex: '#1E3A8A', label: 'Indigo' },
  { id: 'amber', hex: '#B45309', label: 'Warm Amber' },
  { id: 'teal', hex: '#0F766E', label: 'Teal' },
  { id: 'rose', hex: '#BE123C', label: 'Rose' },
  { id: 'slate', hex: '#334155', label: 'Slate' },
  { id: 'plum', hex: '#6B21A8', label: 'Plum' },
];

export const NOTEBOOK_ICONS = [
  'book',
  'store',
  'wallet',
  'users',
  'shopping-cart',
  'briefcase',
  'piggy-bank',
  'home',
];
