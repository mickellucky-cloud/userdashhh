/**
 * lib/hooks/use-2fa.ts — TOTP two-factor auth mutations.
 *
 * Mirrors the use-me.ts pattern. All three invalidates ['me'] on success so
 * the Security tab + any consumer of twoFactorEnabled pick up the new state.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export interface Setup2faResult {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}

export function useSetup2fa() {
  return useMutation({ mutationFn: () => api.setup2fa() });
}

export function useEnable2fa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.enable2fa(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDisable2fa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.disable2fa(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
