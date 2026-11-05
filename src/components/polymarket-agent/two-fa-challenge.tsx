'use client';

/**
 * polymarket-agent/two-fa-challenge.tsx — inline TOTP step-up.
 *
 * Rendered when a sensitive action answers 403 2fa_required: the user
 * enters a 6-digit code from their authenticator, the web edge verifies it
 * and sets the freshness cookie, and the caller retries the original
 * action. A 409 2fa_not_enrolled becomes guidance instead of a dead error.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyCopier2fa } from './copier-hooks';

interface TwoFaChallengeProps {
  /** Called after the code verifies (freshness cookie is set). */
  onVerified: () => void;
}

export function TwoFaChallenge({ onVerified }: TwoFaChallengeProps) {
  const t = useTranslations('dashboard.polymarketAgent.copier.twofa');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notEnrolled, setNotEnrolled] = useState(false);

  const valid = /^\d{6}$/.test(code.trim());

  const verify = async () => {
    setBusy(true);
    setError(null);
    const res = await verifyCopier2fa(code.trim());
    setBusy(false);
    if (res.ok) {
      onVerified();
    } else if (res.error?.code === '2fa_not_enrolled') {
      setNotEnrolled(true);
    } else {
      setError(res.error?.message ?? t('invalid'));
    }
  };

  if (notEnrolled) {
    return (
      <div role="alert" className="space-y-1 rounded-lg border border-ios-orange/40 bg-ios-orange/5 p-3 text-xs">
        <p className="flex items-center gap-1.5 font-medium text-ios-orange">
          <ShieldCheck className="size-4" />
          {t('notEnrolledTitle')}
        </p>
        <p className="text-muted-foreground">{t('notEnrolled')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="copier-2fa-code">{t('label')}</Label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <Input
          id="copier-2fa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('placeholder')}
        />
        <Button
          type="button"
          size="sm"
          className="cursor-pointer"
          disabled={busy || !valid}
          onClick={() => void verify()}
        >
          {busy ? t('verifying') : t('verify')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('help')}</p>
      {error && (
        <p role="alert" className="text-sm text-ios-red">
          {error}
        </p>
      )}
    </div>
  );
}
