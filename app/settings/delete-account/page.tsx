'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useFirebaseAuth } from '@/lib/context/FirebaseAuthContext';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, deleteAccount } = useFirebaseAuth();

  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPasswordProvider = user?.providerData[0]?.providerId === 'password';
  const requiredPhrase = 'DELETE';
  const canSubmit =
    confirmText.trim().toUpperCase() === requiredPhrase &&
    (!isPasswordProvider || password.length >= 6) &&
    !isDeleting;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm text-[var(--ink-dim)] mb-4">
          {t('deleteAccountSignInFirst')}
        </p>
        <button
          type="button"
          onClick={() => router.push('/settings/backup')}
          className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-bold"
        >
          {t('back')}
        </button>
      </div>
    );
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await deleteAccount(isPasswordProvider ? password : undefined);
      router.replace('/');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
      <header className="flex items-center gap-3 mb-6">
        <button
          id="delete-account-back-btn"
          type="button"
          onClick={() => router.push('/settings/backup')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--danger)]">{t('deleteAccount')}</h1>
      </header>

      <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-4 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--ink)] leading-relaxed space-y-1.5">
          <p className="font-bold">{t('deleteAccountWarningTitle')}</p>
          <p>{t('deleteAccountWarningBody')}</p>
        </div>
      </div>

      <form onSubmit={handleDelete} className="space-y-4">
        {isPasswordProvider && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
              {t('confirmPassword')}
            </label>
            <input
              id="delete-account-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--ink)] focus:outline-none focus:border-[var(--danger)]"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] mb-1.5">
            {t('typeDeleteToConfirm')}
          </label>
          <input
            id="delete-account-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            className="w-full bg-[var(--paper-card)] border border-[var(--rule)] rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest text-[var(--ink)] focus:outline-none focus:border-[var(--danger)]"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-[var(--danger)] font-medium">{errorMsg}</p>
        )}

        <button
          id="delete-account-submit-btn"
          type="submit"
          disabled={!canSubmit}
          className={`w-full min-h-[52px] rounded-full font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
            canSubmit
              ? 'bg-[var(--danger)] text-white hover:opacity-90 active:scale-98'
              : 'bg-[var(--rule)] text-[var(--ink-dim)] cursor-not-allowed opacity-60'
          }`}
        >
          {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('deleteAccountConfirmButton')}
        </button>
      </form>
    </div>
  );
}
