'use client';

/**
 * components/admin/dev-role-toggle.tsx
 *
 * A compact dropdown in the admin header that lets developers switch between
 * admin roles to preview what each role sees. Only visible when dev auth
 * bypass is active.
 *
 * UI/UX (ui-ux-pro-max):
 *   - 44px touch target (min-h-[44px])
 *   - aria-label for screen readers
 *   - Icon + text badge (not color alone)
 *   - Loading/disabled states
 *   - Consistent with UserMenu dropdown pattern
 */
import { UserCircle, ChevronDown } from 'lucide-react';
import { useDevRole } from '@/lib/auth/dev-role-context';
import type { AdminRole } from '@/lib/auth/permissions';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const ROLES: { value: AdminRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full access to everything' },
  { value: 'admin', label: 'Admin', description: 'Manage tasks, claims, sales, missions' },
  { value: 'moderator', label: 'Moderator', description: 'Manage tasks, approve rebinds' },
  { value: 'support', label: 'Support', description: 'View-only access to most pages' },
];

const ROLE_BADGE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-ios-blue/10 text-ios-blue',
  admin: 'bg-ios-green/10 text-ios-green',
  moderator: 'bg-ios-orange/10 text-ios-orange',
  support: 'bg-ios-gray/10 text-ios-gray',
};

export function DevRoleToggle() {
  const { devRole, effectiveRole, setDevRole, isDevMode } = useDevRole();

  // Only render in dev mode
  if (!isDevMode) return null;

  const currentRole = devRole === 'real' ? effectiveRole : devRole;
  const currentLabel = ROLES.find((r) => r.value === currentRole)?.label ?? currentRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Admin role preview: ${currentLabel}. Click to change.`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-background px-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserCircle className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium text-foreground">Viewing as</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              ROLE_BADGE_COLORS[currentRole],
            )}
          >
            {currentLabel}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[240px]">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dev: Preview as role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={devRole}
          onValueChange={(v) => setDevRole(v as typeof devRole)}
        >
          <DropdownMenuRadioItem value="real" className="min-h-[44px]">
            <div className="flex flex-col">
              <span className="font-medium">Real role</span>
              <span className="text-xs text-muted-foreground">Use your actual session role</span>
            </div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator />

          {ROLES.map((role) => (
            <DropdownMenuRadioItem key={role.value} value={role.value} className="min-h-[44px]">
              <div className="flex flex-col">
                <span className="font-medium">{role.label}</span>
                <span className="text-xs text-muted-foreground">{role.description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
