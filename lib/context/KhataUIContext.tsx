'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction } from '@/lib/db/schema';

export interface TransactionSheetConfig {
  isOpen: boolean;
  notebookId?: string;
  personId?: string;
  type?: 'gave' | 'got';
  transactionToEdit?: (Transaction & { personName?: string }) | null;
}

export interface UndoToastConfig {
  id: string;
  message: string;
  onUndo: (() => void) | null;
  timeoutId?: NodeJS.Timeout;
}

interface KhataUIContextType {
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string | null) => void;
  
  // Transaction Entry Sheet
  txSheet: TransactionSheetConfig;
  openTxSheet: (config?: Partial<TransactionSheetConfig>) => void;
  closeTxSheet: () => void;
  
  // Undo Toast
  undoToast: UndoToastConfig | null;
  showUndoToast: (message: string, onUndo?: () => void) => void;
  dismissUndoToast: () => void;

  // Hamburger menu drawer
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const KhataUIContext = createContext<KhataUIContextType | null>(null);

export function KhataUIProvider({ children }: { children: React.ReactNode }) {
  const [activeNotebookId, setActiveNotebookIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('khata_active_notebook');
    }
    return null;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [txSheet, setTxSheet] = useState<TransactionSheetConfig>({
    isOpen: false,
    type: 'got',
  });
  const [undoToast, setUndoToast] = useState<UndoToastConfig | null>(null);

  const setActiveNotebookId = (id: string | null) => {
    setActiveNotebookIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('khata_active_notebook', id);
      } else {
        localStorage.removeItem('khata_active_notebook');
      }
    }
  };

  const openTxSheet = (config?: Partial<TransactionSheetConfig>) => {
    setTxSheet({
      isOpen: true,
      notebookId: config?.notebookId || activeNotebookId || undefined,
      personId: config?.personId,
      type: config?.type || 'got',
      transactionToEdit: config?.transactionToEdit || null,
    });
  };

  const closeTxSheet = () => {
    setTxSheet((prev) => ({ ...prev, isOpen: false, transactionToEdit: null }));
  };

  const showUndoToast = (message: string, onUndo?: () => void) => {
    if (undoToast?.timeoutId) {
      clearTimeout(undoToast.timeoutId);
    }

    const toastId = Math.random().toString();
    const timeout = setTimeout(() => {
      setUndoToast((current) => (current?.id === toastId ? null : current));
    }, 5000);

    setUndoToast({
      id: toastId,
      message,
      onUndo: onUndo
        ? () => {
            clearTimeout(timeout);
            onUndo();
            setUndoToast(null);
          }
        : null,
      timeoutId: timeout,
    });
  };

  const dismissUndoToast = () => {
    if (undoToast?.timeoutId) {
      clearTimeout(undoToast.timeoutId);
    }
    setUndoToast(null);
  };

  return (
    <KhataUIContext.Provider
      value={{
        activeNotebookId,
        setActiveNotebookId,
        txSheet,
        openTxSheet,
        closeTxSheet,
        undoToast,
        showUndoToast,
        dismissUndoToast,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
      }}
    >
      {children}
    </KhataUIContext.Provider>
  );
}

export function useKhataUI() {
  const context = useContext(KhataUIContext);
  if (!context) {
    throw new Error('useKhataUI must be used within a KhataUIProvider');
  }
  return context;
}
