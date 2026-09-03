'use client';

import React from 'react';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { KhataUIProvider } from '@/lib/context/KhataUIContext';
import { FirebaseAuthProvider } from '@/lib/context/FirebaseAuthContext';
import { BottomNav } from '@/components/nav/BottomNav';
import { HamburgerDrawer } from '@/components/nav/HamburgerDrawer';
import { TransactionSheet } from '@/components/transaction/TransactionSheet';
import { UndoToast } from '@/components/shared/UndoToast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseAuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <KhataUIProvider>
            <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
              <main className="flex-1 pb-20">{children}</main>
              <BottomNav />
              <HamburgerDrawer />
              <TransactionSheet />
              <UndoToast />
            </div>
          </KhataUIProvider>
        </I18nProvider>
      </ThemeProvider>
    </FirebaseAuthProvider>
  );
}
