'use client';

/**
 * components/dashboard/unbind-wallet-card.tsx
 *
 * Self-service wallet disconnect. Lets a user remove their bound wallet
 * themselves so they can bind a different one, BUT only after proving they
 * still control the wallet currently bound to their account (an EIP-191
 * signature from it). This is the security gate against a hijacked Telegram
 * account silently swapping to an attacker wallet.
 *
 * Flow:
 *   1. User connects the wallet that is currently bound to their account
 *      (via WalletConnect / appkit-button elsewhere on the page).
 *   2. User opens this card and clicks "Disconnect wallet".
 *   3. A confirm dialog explains the consequence (no more claim/buy until a
 *      new wallet is bound) and asks them to confirm.
 *   4. On confirm, we sign a deterministic challenge with the connected wallet
 *      via wagmi useSignMessage (EIP-191 personal_sign).
 *   5. We POST { message, signature } to /api/wallet/unbind.
 *   6. The server derives the bound address from the DB and verifies the
 *      signature against it, then NULLs the wallet.
 *
 * The card hides itself if no wallet is bound (the bind flow applies instead).
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { Unlink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useUnbindWallet } from '@/lib/hooks/use-wallet';
import { toastError } from '@/lib/api/toast';
import { useDarkClass } from '@/components/layout/area-theme';
import { shortAddress } from '@/lib/utils';

export function UnbindWalletCard({ currentWallet }: { currentWallet: string | null }) {
  const t = useTranslations('dashboard.unbind');
  const tToast = useTranslations('toasts.unbind');
  const { toast } = useToast();
  const qc = useQueryClient();
  const { address } = useAccount();
  const unbind = useUnbindWallet();
  const darkClass = useDarkClass();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hide entirely when no wallet is bound (the bind flow applies instead).
  if (!currentWallet) return null;

  // The connected browser wallet must match the bound wallet for the signature
  // to verify server-side. If a different (or no) wallet is connected, we hint
  // instead of disabling silently so the user knows what to do.
  const connectedMatchesBound =
    !!address && address.toLowerCase() === currentWallet.toLowerCase();

  function handleConfirm() {
    if (!connectedMatchesBound) return;
    unbind.mutate(
      { boundWallet: address! },
      {
        onSuccess: () => {
          toast({ title: tToast('successTitle'), description: tToast('successDesc') });
          setConfirmOpen(false);
          // Flip the dashboard to the "not bound" state and refresh wallet reads.
          void qc.invalidateQueries({ queryKey: ['me'] });
          void qc.invalidateQueries({ queryKey: ['wallet'] });
        },
        onError: (err) => {
          toastError(err, 'Could not unbind the wallet.', tToast('failedTitle'));
          setConfirmOpen(false);
        },
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
          <p className="text-sm text-muted-foreground">{t('connectHint')}</p>
        ) : !connectedMatchesBound ? (
          <p className="text-sm text-muted-foreground">{t('connectHint')}</p>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          disabled={!connectedMatchesBound || unbind.isPending}
          onClick={() => setConfirmOpen(true)}
          aria-label={t('btnIdle')}
          className="h-11 w-full sm:w-auto"
        >
          <Unlink className="size-4" />
          {unbind.isPending ? t('btnPending') : t('btnIdle')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('signNote')}</p>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!unbind.isPending) setConfirmOpen(o); }}>
        <DialogContent className={darkClass}>
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription>{t('dialogDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={unbind.isPending}
            >
              {t('dialogCancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={unbind.isPending}
            >
              {unbind.isPending ? t('btnPending') : t('dialogConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
