'use client';

/**
 * components/admin/admin-user-menu.tsx
 *
 * Avatar dropdown for the admin header — mirrors the user-facing UserMenu so
 * the admin shell has header parity: an identity affordance, a quick link to
 * the personal profile page (/admin/profile, where 2FA + appearance live), an
 * inline light/dark switch (previously admin had a theme toggle only on
 * mobile), and a separated, destructive sign-out.
 *
 * Admin is English-only; labels reuse the dashboard.userMenu namespace, which
 * is seeded into the admin layout's NextIntlClientProvider.
 */
import Link from 'next/link';
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
import { useMe } from '@/lib/hooks/use-me';
import { apexOrigin } from '@/lib/domains';
import { ChevronDown, LogOut, UserCircle } from 'lucide-react';
import type { MeUser } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/** Build a 1-2 character fallback from the admin's name/username. */
function initialsOf(user: MeUser): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const fi = first[0];
  const li = last[0];
  if (fi && li) return (fi + li).toUpperCase();
  if (fi) return first.slice(0, 2).toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.walletAddress) return user.walletAddress.slice(2, 4).toUpperCase();
  return '?';
}

export function AdminUserMenu() {
  const t = useTranslations('dashboard.userMenu');
  const { data, isLoading } = useMe();
  const darkClass = useDarkClass();
  const user = data?.user ?? null;

  if (isLoading) {
    return <Skeleton className="size-9 rounded-full" aria-hidden />;
  }

  if (!user) {
    // Defensive: the admin layout guard should prevent this, but if /me
    // resolves empty, offer a sign-in affordance instead of the dropdown.
    return (
      <Link
        href={`${apexOrigin()}/login`}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {t('signIn')}
      </Link>
    );
  }

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
  const subLine = user.adminRole
    ? user.adminRole.replace('_', ' ')
    : user.username
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
          className="group inline-flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar>
            {user.photoUrl ? (
              <AvatarImage src={user.photoUrl} alt={displayName} />
            ) : null}
            <AvatarFallback>{initialsOf(user)}</AvatarFallback>
          </Avatar>
          <ChevronDown
            className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
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
              <span className="truncate text-xs capitalize text-muted-foreground">{subLine}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/admin/profile">
              <UserCircle className="size-4" />
              {t('profile')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Inline appearance switch — the desktop theme fix for admin. */}
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
