'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import { useKhataUI } from '@/lib/context/KhataUIContext';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { exportAllData, importBackupData } from '@/lib/db/operations';
import { formatDateTime } from '@/lib/money';
import {
  ArrowLeft,
  Download,
  Upload,
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function EmailSignInForm({
  onSignIn,
  onSignUp,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);

  const canGo = !busy && /.+@.+\..+/.test(email.trim()) && password.length >= 6;

  const handleGo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGo) return;
    try {
      setBusy(true);
      if (mode === 'in') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch {
      // error FirebaseAuthContext-এ দেখায়
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleGo} className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink-dim)]">
        <button
          type="button"
          onClick={() => setMode('in')}
          className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
            mode === 'in' ? 'bg-[var(--ink)] text-[var(--paper)]' : ''
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('up')}
          className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
            mode === 'up' ? 'bg-[var(--ink)] text-[var(--paper)]' : ''
          }`}
        >
          New account
        </button>
      </div>
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full bg-[var(--paper)] border border-[var(--rule)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-dim)]/50 focus:outline-none focus:border-[var(--accent)] font-medium"
      />
      <input
        type="password"
        autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 6)"
        className="w-full bg-[var(--paper)] border border-[var(--rule)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-dim)]/50 focus:outline-none focus:border-[var(--accent)] font-medium"
      />
      <button
        type="submit"
        disabled={!canGo}
        className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-xs hover:bg-[var(--accent-hover)] transition-all cursor-pointer disabled:opacity-50"
      >
        {mode === 'in' ? 'Sign in with Email' : 'Create account'}
      </button>
    </form>
  );
}

export default function BackupPage() {  const router = useRouter();
  const { t, lang } = useI18n();
  const { showUndoToast } = useKhataUI();
  const {
    user,
    loading: authLoading,
    isSyncing,
    lastSyncedAt,
    error: cloudError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    syncLocalToCloud,
    syncCloudToLocal,
    clearError,
  } = useFirebaseAuth();

  const [lastBackupTime, setLastBackupTime] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('khata_last_backup');
      if (saved) return parseInt(saved, 10);
    }
    return null;
  });
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCloudBackup = async () => {
    try {
      const res = await syncLocalToCloud();
      if (res) {
        showUndoToast(t('cloudSyncSuccess'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloudRestore = async () => {
    try {
      const res = await syncCloudToLocal('merge');
      if (res) {
        showUndoToast(t('cloudRestoreSuccess'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const data = await exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const now = Date.now();
      const dateString = new Date().toISOString().slice(0, 10);
      const filename = `khata-backup-${dateString}.json`;

      // Save last backup time
      setLastBackupTime(now);
      localStorage.setItem('khata_last_backup', String(now));

      // Try native share if file sharing is supported
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({
          files: [new File([blob], filename, { type: 'application/json' })],
        })
      ) {
        await navigator.share({
          files: [new File([blob], filename, { type: 'application/json' })],
          title: 'Khata Backup',
        });
      } else {
        // Standard browser download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      showUndoToast(t('exportSuccess'));
    } catch (err) {
      console.error('Failed to export backup:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!selectedFileContent) return;

    try {
      setIsProcessing(true);
      const result = await importBackupData(selectedFileContent, importMode);

      if (result.success) {
        showUndoToast(t('importSuccess'));
        setSelectedFileContent(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        router.push('/');
      } else {
        alert(result.error || 'Failed to import backup');
      }
    } catch (err: any) {
      alert(err.message || 'Error importing backup');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6 pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          id="backup-back-btn"
          type="button"
          onClick={() => router.push('/settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--ink)]">{t('backupAndRestore')}</h1>
      </header>

      <div className="space-y-6">
        {/* Firebase Cloud Sync Card */}
        <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--ink)]">
                    {t('cloudSync')}
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                    Firebase
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-dim)] mt-0.5 leading-relaxed">
                  {t('cloudSyncDesc')}
                </p>
              </div>
            </div>
          </div>

          {cloudError && (
            <div className="p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--danger)] flex items-center justify-between">
              <span>{cloudError}</span>
              <button
                type="button"
                onClick={clearError}
                className="underline font-bold ml-2 text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {authLoading ? (
            <div className="py-3 text-center text-xs text-[var(--ink-dim)] animate-pulse">
              Connecting to Firebase...
            </div>
          ) : user ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--paper)] border border-[var(--rule)]">
                <div className="flex items-center gap-3 overflow-hidden">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border border-[var(--rule)] shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[var(--ink)] truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('connectedToFirebase')}
                    </p>
                  </div>
                </div>

                <button
                  id="cloud-signout-btn"
                  type="button"
                  onClick={signOutUser}
                  className="px-2.5 py-1 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--danger)] rounded-lg hover:bg-[var(--rule)]/40 transition-colors"
                >
                  {t('signOut')}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--ink-dim)] px-1">
                <span>{t('lastCloudSync')}:</span>
                <span className="font-semibold text-[var(--ink)] num-tabular">
                  {lastSyncedAt ? formatDateTime(lastSyncedAt, lang) : t('neverBackedUp')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="cloud-backup-now-btn"
                  type="button"
                  disabled={isSyncing}
                  onClick={handleCloudBackup}
                  className="py-2.5 px-3 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-xs hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>{isSyncing ? t('syncing') : t('syncNow')}</span>
                </button>

                <button
                  id="cloud-restore-now-btn"
                  type="button"
                  disabled={isSyncing}
                  onClick={handleCloudRestore}
                  className="py-2.5 px-3 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] text-xs font-bold hover:bg-[var(--rule)]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>{t('restoreFromCloud')}</span>
                </button>
              </div>

              <Link
                id="settings-goto-delete-account"
                href="/settings/delete-account"
                className="block text-center py-2 text-[11px] font-semibold text-[var(--danger)]/80 hover:text-[var(--danger)] transition-colors"
              >
                {t('deleteAccount')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <button
                id="cloud-google-signin-btn"
                type="button"
                onClick={signInWithGoogle}
                className="w-full py-3 px-4 rounded-xl border border-[var(--rule)] bg-[var(--paper)] hover:bg-[var(--rule)]/30 text-xs font-bold text-[var(--ink)] transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t('signInWithGoogle')}</span>
              </button>
              <EmailSignInForm
                onSignIn={signInWithEmail}
                onSignUp={signUpWithEmail}
              />
            </div>
          )}
        </div>

        {/* Export Card */}
        <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">
                {t('exportBackup')}
              </h2>
              <p className="text-xs text-[var(--ink-dim)] mt-0.5 leading-relaxed">
                {t('exportBackupDesc')}
              </p>
            </div>
          </div>

          <div className="text-xs text-[var(--ink-dim)] bg-[var(--paper)] p-3 rounded-xl border border-[var(--rule)] flex items-center justify-between">
            <span>{t('lastBackup')}:</span>
            <span className="font-semibold text-[var(--ink)]">
              {lastBackupTime ? formatDateTime(lastBackupTime, lang) : t('neverBackedUp')}
            </span>
          </div>

          <button
            id="backup-export-btn"
            type="button"
            onClick={handleExport}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-full bg-[var(--accent)] text-white font-bold text-sm shadow-md hover:bg-[var(--accent-hover)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportBackup')}</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-[var(--paper-card)] border border-[var(--rule)] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--rule)]/40 text-[var(--ink)] flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">
                {t('importBackup')}
              </h2>
              <p className="text-xs text-[var(--ink-dim)] mt-0.5 leading-relaxed">
                {t('importBackupDesc')}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            id="backup-file-input"
          />

          {!selectedFileContent ? (
            <button
              id="backup-select-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-full border-2 border-dashed border-[var(--rule)] hover:border-[var(--accent)] text-[var(--ink)] font-bold text-sm hover:bg-[var(--paper)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select Backup JSON File</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)]/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backup file ready to import</span>
              </div>

              <div className="text-xs text-[var(--ink-dim)] space-y-2">
                <p>{t('importWarning')}</p>

                <div className="space-y-1.5 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-[var(--accent)]"
                    />
                    <span className="font-medium text-[var(--ink)]">
                      {t('importModeMerge')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-[var(--accent)]"
                    />
                    <span className="font-medium text-[var(--danger)]">
                      {t('importModeReplace')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFileContent(null)}
                  className="flex-1 py-2 rounded-full border border-[var(--rule)] text-xs font-semibold text-[var(--ink-dim)]"
                >
                  {t('cancel')}
                </button>
                <button
                  id="backup-confirm-import-btn"
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="flex-1 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-bold shadow-xs hover:bg-[var(--accent-hover)]"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
