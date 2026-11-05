'use client';

/**
 * components/settings/two-factor-card.tsx
 *
 * Shared TOTP two-factor auth card. Used by BOTH the user settings page
 * (/app/settings) and the admin profile page (/admin/profile). This is where
 * an account holder — including an admin — activates, reviews, or disables 2FA.
 *
 * For admins this closes the gap with lib/auth/2fa-guard.ts, whose error says
 * "Enable it in your profile settings first": this card is that place.
 *
 * Three states driven by `user.twoFactorEnabled` + a local `stage`:
 *   - disabled -> "Enable" button starts setup (QR + secret) -> verify code
 *   - enabled  -> "Disable" button -> verify code to turn off
 * Backup codes are shown once after enabling.
 *
 * All writes go through the existing /api/profile/2fa/* routes (shared by user
 * and admin sessions) via the use-2fa hooks, and invalidate ['me'] on success.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useSetup2fa, useEnable2fa, useDisable2fa } from '@/lib/hooks/use-2fa';
import { toastError } from '@/lib/api/toast';
import type { MeUser } from '@/lib/api/client';

export interface TwoFactorCardProps {
  user: MeUser | null;
  isLoading: boolean;
  /** When true (no session / settled empty), render a compact note instead of
   *  the interactive card. Callers that always have a user can ignore this. */
  showGuest?: boolean;
}

export function TwoFactorCard({ user, isLoading, showGuest }: TwoFactorCardProps) {
  const t = useTranslations('dashboard.settings');
  const tToast = useTranslations('toasts.settings');
  const { toast } = useToast();
  const setup = useSetup2fa();
  const enable = useEnable2fa();
  const disable = useDisable2fa();
  const [stage, setStage] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (showGuest || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            {t('twoFactorTitle')}
          </CardTitle>
          <CardDescription>{t('notSignedInDesc')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const startSetup = () => {
    setCode('');
    setStage('setup');
    setup.mutate(undefined, {
      onSuccess: () => {},
      onError: (err) =>
        toastError(err, 'Could not start two-factor setup.', tToast('verificationFailed')),
    });
  };

  const handleEnable = (e: React.FormEvent) => {
    e.preventDefault();
    enable.mutate(code.trim(), {
      onSuccess: (res) => {
        setBackupCodes(res.backupCodes);
        setStage('idle');
        setCode('');
        toast({ title: t('twoFactorEnabledTitle'), description: t('twoFactorEnabledDesc') });
      },
      onError: (err) =>
        toastError(err, 'Could not enable two-factor authentication.', tToast('verificationFailed')),
    });
  };

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    disable.mutate(code.trim(), {
      onSuccess: () => {
        setStage('idle');
        setCode('');
        toast({ title: t('twoFactorDisabledTitle') });
      },
      onError: (err) =>
        toastError(err, 'Could not disable two-factor authentication.', tToast('verificationFailed')),
    });
  };

  const enabled = user.twoFactorEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          {t('twoFactorTitle')}
          {enabled ? (
            <Badge variant="outline" className="bg-ios-green/10 text-ios-green">
              <ShieldCheck className="mr-1 size-3" />
              {t('verified')}
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>{t('twoFactorDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          stage === 'disable' ? (
            <form onSubmit={handleDisable} className="space-y-3">
              <Label htmlFor="disable-code">{t('enterCode')}</Label>
              <Input
                id="disable-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="font-mono text-lg tracking-[0.4em]"
                placeholder={t('codePlaceholder')}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={code.length !== 6 || disable.isPending}>
                  {disable.isPending ? <Loader2 className="animate-spin" /> : null}
                  {t('twoFactorDisable')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStage('idle')}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t('twoFactorOnDesc')}</p>
              <Button variant="outline" onClick={() => { setCode(''); setStage('disable'); }}>
                {t('twoFactorDisable')}
              </Button>
            </>
          )
        ) : stage === 'setup' ? (
          setup.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" /> {t('twoFactorPreparing')}
            </div>
          ) : setup.data ? (
            <form onSubmit={handleEnable} className="space-y-4">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element -- QR is a data URL from a trusted source */}
                <img src={setup.data.qrDataUrl} alt="QR code" width={160} height={160} className="rounded-ios" />
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">{t('twoFactorScanHint')}</p>
                  <p className="text-muted-foreground">{t('twoFactorManualHint')}</p>
                  <code className="block break-all rounded-ios bg-muted px-2 py-1 font-mono text-xs">
                    {setup.data.secret}
                  </code>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="enable-code">{t('enterCode')}</Label>
                <Input
                  id="enable-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="font-mono text-lg tracking-[0.4em]"
                  placeholder={t('codePlaceholder')}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={code.length !== 6 || enable.isPending}>
                  {enable.isPending ? <Loader2 className="animate-spin" /> : null}
                  {t('twoFactorEnable')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStage('idle')}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : null
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t('twoFactorOffDesc')}</p>
            <Button onClick={startSetup}>
              <Shield className="size-4" />
              {t('twoFactorEnable')}
            </Button>
          </>
        )}

        {/* Backup codes shown once after enabling. */}
        {backupCodes ? (
          <div className="rounded-ios-lg border border-ios-orange/30 bg-ios-orange/5 p-4">
            <p className="text-sm font-semibold">{t('backupCodesTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('backupCodesDesc')}</p>
            <div className="mt-3 grid grid-cols-2 gap-1 font-mono text-sm">
              {backupCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setBackupCodes(null)}
            >
              {t('backupCodesDone')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
