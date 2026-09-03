import Dexie, { type Table } from 'dexie';

export interface Notebook {
  id: string;
  name: string;
  openingBalance: number; // in integer paise
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  color: string;
  icon: string;
}

export interface Person {
  id: string;
  notebookId: string;
  name: string;
  phone?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  notebookId: string;
  personId: string;
  type: 'gave' | 'got';
  amount: number; // in integer paise
  note?: string;
  occurredAt: number;
  createdAt: number;
}

export interface PersonWithBalance extends Person {
  totalGiven: number; // in paise
  totalTaken: number; // in paise
  net: number; // totalGiven - totalTaken
  lastTransaction?: Transaction;
  transactionCount: number;
}

export interface NotebookWithStats extends Notebook {
  currentBalance: number; // openingBalance + sum(got) - sum(gave)
  peopleCount: number;
  transactionCount: number;
}

export class KhataDatabase extends Dexie {
  notebooks!: Table<Notebook, string>;
  people!: Table<Person, string>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super('KhataDatabase');
    this.version(1).stores({
      notebooks: 'id, archived, createdAt, updatedAt',
      people: 'id, notebookId, name, createdAt',
      transactions: 'id, notebookId, personId, occurredAt, type, createdAt',
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
