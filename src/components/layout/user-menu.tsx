'use client';

/**
 * components/layout/user-menu.tsx
 *
 * Avatar button in the top-right of the dashboard header. Opens a dropdown
 * with quick links (Settings, Wallet, Referral), an inline theme toggle, and
 * a separated, destructive Sign-out action. (The language switcher lives in
 * the header itself, next to the notification bell.)
 *
 * Uses the locale-aware Link from @/i18n/navigation. Labels come from the
 * dashboard.userMenu message namespace.
 */
import { useTranslations } from 'next-intl';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaThemeSwitch, useDarkClass } from '@/components/layout/area-theme';
import { SocialIconRow } from '@/components/landing/social-sidebar';
import { useMe } from '@/lib/hooks/use-me';
import { ChevronDown, LogOut, Settings, Users, Wallet } from 'lucide-react';
import type { MeUser } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { apexOrigin } from '@/lib/domains';

/** Build a 1-2 character fallback from the user's name/username. */
function initialsOf(user: MeUser): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const fi = first[0];
  const li = last[0];
  if (fi && li) return (fi + li).toUpperCase();
  if (fi) return first.slice(0, 2).toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.walletAddress) return user.walletAddress.slice(2, 4).toUpperCase();
  return 'DE';
}

/** Dev-only placeholder shown when /api/me has resolved but no user row exists. */
const DEV_PLACEHOLDER_USER: MeUser = {
  id: '00000000-0000-0000-0000-000000000000',
  telegramId: '1234567890',
  username: 'okndev',
  firstName: 'Dan',
  lastName: 'Evans',
  photoUrl: null,
  email: 'dan.evans@example.com',
  emailVerifiedAt: null,
  walletAddress: null,
  walletBoundAt: null,
  adminRole: null,
  twoFactorEnabled: false,
  createdAt: new Date().toISOString(),
};

export function UserMenu() {
  const t = useTranslations('dashboard.userMenu');
  const tSocial = useTranslations('socialSidebar');
  const { data, isLoading } = useMe();
  const darkClass = useDarkClass();
  // Dev-only preview: when /api/me resolves to no user during local development
  // (no session, not onboarded), fall back to a placeholder so the avatar +
  // dropdown can be reviewed. Gated on NODE_ENV so a real production user whose
  // /me resolves to null (session exists, no DB row) NEVER sees a fake identity.
  const realUser = data?.user ?? null;
  const user =
    realUser ?? (process.env.NODE_ENV === 'development' ? DEV_PLACEHOLDER_USER : null);

  if (isLoading) {
    return <Skeleton className="size-9 rounded-full" aria-hidden />;
  }

  // No user in production (the layout guard should prevent this, but be
  // defensive). Show a sign-in affordance instead of the dropdown.
  if (!user) {
    return (
      <Link
        href={`${apexOrigin()}/login`}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {t('signIn')}
      </Link>
    );
  }

  // Display name: prefer first+last, then username, then a fallback.
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const fallbackId = user.telegramId
    ? user.telegramId.slice(-4)
    : user.walletAddress
      ? user.walletAddress.slice(2, 6)
      : 'anon';
  const displayName =
    first && last
      ? `${first} ${last}`
      : first ||
        user.username ||
        (user.walletAddress
          ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
          : t('userFallback', { id: fallbackId }));
  const subLine = user.username
    ? `@${user.username}`
    : user.telegramId
      ? t('telegramLabel', { id: user.telegramId })
      : user.walletAddress
        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
        : '';

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = `${apexOrigin()}/login`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('openMenu')}
          className="group flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] text-white font-extrabold text-sm shadow-[0_0_12px_rgba(122,18,245,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={displayName} className="size-10 rounded-full object-cover" />
          ) : (
            <span>{initialsOf(user)}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn('min-w-60', darkClass)}
      >
        {/* Identity header */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left">
            <Avatar size="sm">
              {user.photoUrl ? (
                <AvatarImage src={user.photoUrl} alt={displayName} />
              ) : null}
              <AvatarFallback>{initialsOf(user)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{subLine}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/app/settings">
              <Settings className="size-4" />
              {t('settings')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/wallet">
              <Wallet className="size-4" />
              {t('wallet')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/referral">
              <Users className="size-4" />
              {t('referral')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Community: social links are always reachable from the avatar menu.
            stopPropagation keeps the dropdown from interfering with the anchors. */}
        <div
          className="px-2 py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-muted-foreground">{tSocial('ariaLabel')}</span>
          <div className="mt-1">
            <SocialIconRow />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Inline appearance switch */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="text-sm text-muted-foreground">{t('appearance')}</span>
          <AreaThemeSwitch />
        </div>

        <DropdownMenuSeparator />

        {/* Separated, destructive: sign-out. */}
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="size-4" />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
