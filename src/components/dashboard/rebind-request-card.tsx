'use client';

/**
 * components/dashboard/rebind-request-card.tsx — Phase 6.11 (Q-G)
 *
 * Lets a user request a wallet rebind. Requires the NEW wallet to be connected
 * (wagmi useAccount) so we can sign the proof-of-ownership message from it.
 * Flow:
 *   1. User connects the NEW wallet (via WalletConnect / appkit-button elsewhere).
 *   2. User opens this card, picks a reason, clicks "Request rebind".
 *   3. We sign a deterministic challenge via wagmi useSignMessage.
 *   4. We POST {newWallet, signature, message, reason} to /api/wallet/rebind.
 *   5. Request enters the moderator queue in /admin/users/rebind.
 *
 * The 30-day cooldown + signature re-verification happen server-side.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { ArrowLeftRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useSubmitRebind } from '@/lib/hooks/use-wallet';
import { toastError } from '@/lib/api/toast';
import type { RebindRequestInput } from '@/lib/api/client';
import { useDarkClass } from '@/components/layout/area-theme';
import { shortAddress } from '@/lib/utils';

export function RebindRequestCard({ currentWallet }: { currentWallet: string | null }) {
  const t = useTranslations('dashboard.rebind');
  const tToast = useTranslations('toasts.rebind');
  const { toast } = useToast();
  const { address } = useAccount();
  const submit = useSubmitRebind();
  const darkClass = useDarkClass();
  const [reason, setReason] = useState<string>('lost_key');

  // Hide the card entirely if the user has no wallet bound yet (use bind flow).
  if (!currentWallet) return null;

  const newIsSameAsCurrent =
    address && currentWallet && address.toLowerCase() === currentWallet.toLowerCase();

  function handleSubmit() {
    if (!address) return;
    if (newIsSameAsCurrent) return;
    submit.mutate(
      { newWallet: address, reason: reason as RebindRequestInput['reason'] },
      {
        onSuccess: (res) => {
          toast({
            title: tToast('successTitle'),
            description: res.message ?? tToast('successDesc'),
          });
        },
        onError: (err) =>
          toastError(err, 'Could not submit the rebind request.', tToast('failedTitle')),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border p-3 text-sm">
          <p className="text-xs text-muted-foreground">{t('currentWallet')}</p>
          <p className="font-mono">{shortAddress(currentWallet)}</p>
        </div>

        {!address ? (
          <p className="text-sm text-muted-foreground">
            {t('connectNew')}
          </p>
        ) : newIsSameAsCurrent ? (
          <p className="text-sm text-muted-foreground">
            {t('sameWallet')}
          </p>
        ) : (
          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{t('newWallet')}</p>
            <p className="font-mono">{shortAddress(address)}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="rebind-reason">{t('reasonLabel')}</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="rebind-reason" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={darkClass}>
              <SelectItem value="lost_key">{t('reasonLostKey')}</SelectItem>
              <SelectItem value="compromised">{t('reasonCompromised')}</SelectItem>
              <SelectItem value="upgrade">{t('reasonUpgrade')}</SelectItem>
              <SelectItem value="admin_fix">{t('reasonAdminFix')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          disabled={!address || newIsSameAsCurrent || submit.isPending}
          onClick={handleSubmit}
          className="w-full sm:w-auto"
        >
          <ArrowLeftRight className="size-4" />
          {submit.isPending ? t('btnPending') : t('btnIdle')}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t('signNote')}
        </p>
      </CardContent>
    </Card>
  );
}
