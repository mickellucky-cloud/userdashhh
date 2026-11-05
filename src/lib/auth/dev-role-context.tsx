'use client';

/**
 * lib/auth/dev-role-context.tsx
 *
 * Dev-only React context that lets developers preview the admin dashboard
 * as different roles (super_admin, admin, moderator, support) without
 * changing their actual session. When dev auth bypass is active, this
 * context overrides the role used for:
 *   - Sidebar nav filtering (getVisibleNav)
 *   - Settings tab visibility
 *   - Page access checks (client-side)
 *
 * The context does NOT bypass server-side requireRole() checks — those still
 * use the real session. This is for UI preview only.
 *
 * In production, the provider defaults to the session's real role and the
 * toggle component is never rendered.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AdminRole } from './permissions';

type DevRole = AdminRole | 'real';

interface DevRoleContextValue {
  /** The currently selected preview role, or 'real' to use the session role. */
  devRole: DevRole;
  /** The effective role to use for UI filtering (devRole if set, else realRole). */
  effectiveRole: AdminRole;
  /** Switch to a different role for preview. */
  setDevRole: (role: DevRole) => void;
  /** Whether the dev toggle is available (dev bypass active). */
  isDevMode: boolean;
}

const DevRoleContext = createContext<DevRoleContextValue>({
  devRole: 'real',
  effectiveRole: 'super_admin',
  setDevRole: () => {},
  isDevMode: false,
});

export function DevRoleProvider({
  realRole,
  children,
}: {
  realRole: AdminRole;
  children: ReactNode;
}) {
  // Check if dev bypass is active. This is evaluated client-side; the real
  // gate is in bypass.ts (server-side). We use a simple env check here
  // because NEXT_PUBLIC_DEV_AUTH_BYPASS is inlined at build time.
  const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  const [devRole, setDevRole] = useState<DevRole>('real');

  const effectiveRole: AdminRole = devRole === 'real' ? realRole : devRole;

  return (
    <DevRoleContext.Provider
      value={{ devRole, effectiveRole, setDevRole: useCallback(setDevRole, []), isDevMode }}
    >
      {children}
    </DevRoleContext.Provider>
  );
}

export function useDevRole() {
  return useContext(DevRoleContext);
}
