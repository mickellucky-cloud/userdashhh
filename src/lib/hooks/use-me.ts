/**
 * lib/hooks/use-me.ts — current session user profile.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileInput } from '@okn/shared';
import { api } from '../api/client';

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: api.getMe });
}

/**
 * Self-service profile update (display name + email). On success the ['me']
 * cache is invalidated so the avatar, settings page, and any other consumer
 * pick up the new values without a manual refetch.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.updateProfile(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/**
 * Send a 6-digit verification code to the user's bound email. In dev (no
 * RESEND_API_KEY) the server returns the code as `devCode` so the UI can
 * surface it for local testing. Returns the raw API result so the caller can
 * read `devCode`.
 */
export function useSendEmailVerification() {
  return useMutation({ mutationFn: () => api.sendEmailVerification() });
}

/**
 * Verify a submitted code. On success the ['me'] cache is invalidated so the
 * email badge flips to "Verified" across the app.
 */
export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.verifyEmail(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
