'use client';

/**
 * components/layout/okn-sidebar.tsx
 * $OKN-branded sidebar built on the shadcn sidebar primitives.
 * Renders as a fixed sidebar on desktop (md+) and as a sheet on mobile.
 * Nav items are plain data (serializable) so server layouts can pass them.
 *
 * Shared by app (translated) and admin (English-only). When a nav item has a
 * `labelKey`, the display label is resolved from the dashboard.nav message
 * namespace; otherwise the literal `label` is used (admin items).
 *
 * Visual language: coin brand mark, nav filter, uppercase section label,
 * soft-tint active pill (solid fill in the collapsed icon rail), promo card,
 * area switch, and a light/dark pill in the footer.
 */
import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Bot,
  Gift,
  GitMerge,
  GraduationCap,
  Coins,
  Home,
  LayoutDashboard,
  ListTodo,
  Lock,
  Newspaper,
  PieChart,
  Receipt,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Target,
  TrendingUpDown,
  Trophy,
  Users,
  UserCircle,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, usePathname } from '@/i18n/navigation';
import { appOrigin, adminOrigin, bareAppHref } from '@/lib/domains';
import { ModerationQueueBadge } from '@/components/admin/queue-badge';
import { cn } from '@/lib/utils';

export interface OknNavItem {
  href: string;
  label?: string; // literal label (admin items)
  labelKey?: string; // translation key under dashboard.nav (app items)
}

const ICONS: Record<string, LucideIcon> = {
  '/app': Home,
  '/app/portfolio': PieChart,
  '/app/leaderboard': Trophy,
  '/app/missions': Target,
  '/app/tasks': ListTodo,
  '/app/claim': Gift,
  '/app/buy': ShoppingCart,
  '/app/trade-bot': Bot,
  '/app/polymarket-agent': TrendingUpDown,
  '/app/prediction-markets': BarChart3,
  '/app/staking': Lock,
  '/app/news': Newspaper,
  '/app/learn': GraduationCap,
  '/app/wallet': Wallet,
  '/app/referral': Users,
  '/admin': LayoutDashboard,
  '/admin/token': Coins,
  '/admin/users': Users,
  '/admin/tasks': ListTodo,
  '/admin/claims': GitMerge,
  '/admin/missions': Target,
  '/admin/leaderboard': Trophy,
  '/admin/settings': Settings,
  '/admin/profile': UserCircle,
  '/admin/transactions': ShieldCheck,
  '/admin/audit-logs': ScrollText,
  '/admin/activity': Activity,
  '/admin/purchases': Receipt,
  '/admin/system': Server,
};

/** Soft tint when expanded, solid fill when collapsed to the icon rail. */
const ITEM_CLASSES = cn(
  'h-10 rounded-xl px-3 text-sm font-medium transition-all duration-200',
  'hover:bg-[var(--line)]/50 hover:translate-x-1',
  'data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#7A12F5] data-[active=true]:to-[#8C38F7] data-[active=true]:font-bold data-[active=true]:!text-white data-[active=true]:shadow-[0_4px_14px_rgba(122,18,245,0.35)]',
  'data-[active=true]:[&_*]:!text-white data-[active=true]:[&_svg]:!stroke-white',
  'group-data-[collapsible=icon]:data-[active=true]:bg-[#7A12F5] group-data-[collapsible=icon]:data-[active=true]:!text-white',
);

interface OknSidebarProps {
  area: 'app' | 'admin';
  navItems: readonly OknNavItem[];
  isAdmin?: boolean;
  roleLabel?: string;
}

export function OknSidebar({ area, navItems, isAdmin, roleLabel }: OknSidebarProps) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const { setOpenMobile } = useSidebar();

  // Resolve a nav item's display label (translation key for app, literal for admin).
  const resolveLabel = (item: OknNavItem) =>
    item.labelKey ? t(`nav.${item.labelKey}`) : (item.label ?? item.href);

  // Cross-area switch: admin -> app, app -> admin. In the subdomain split this
  // is a cross-origin jump (app.<root> <-> admin.<root>), so build the absolute
  // URL via the domain helpers. In dev the origins are '' -> relative path ->
  // the i18n Link still works.
  const switchHref = area === 'admin' ? `${appOrigin()}/app` : `${adminOrigin()}/admin`;
  const switchLabel = area === 'admin' ? t('shell.backToApp') : t('shell.adminPanel');
  const showSwitch = area === 'admin' || isAdmin;
  // Whether the switch crosses origins (prod subdomain split). When true we
  // render a plain <a> instead of the i18n <Link> (which assumes one origin).
  const switchCrossesOrigin = area === 'admin' ? appOrigin() !== '' : adminOrigin() !== '';

  // Close the mobile slide-out sheet after any nav action.
  const closeMobile = () => setOpenMobile(false);

  const filtered = query
    ? navItems.filter((i) => resolveLabel(i).toLowerCase().includes(query.trim().toLowerCase()))
    : navItems;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-3 pt-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-2">
        {/* Brand */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-12 rounded-xl hover:bg-transparent group-data-[collapsible=icon]:size-12!"
            >
              <Link href={(area === 'admin' ? '/admin' : bareAppHref('/app')) as never}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s2)] shadow-sm">
                  <Image
                    src="/okn-logo.png"
                    alt="$OKN"
                    width={28}
                    height={28}
                    className="size-7 object-contain drop-shadow-[0_2px_6px_rgba(122,18,245,0.35)]"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-display text-base font-extrabold tracking-tight text-[var(--tx)]">
                    $OKN
                  </span>
                  <span className="truncate text-xs font-semibold text-[var(--mut)]">
                    {area === 'admin' ? (roleLabel ?? t('shell.admin')) : t('shell.brandTagline')}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Nav filter (hidden in the collapsed icon rail) */}
        <div className="relative px-1 group-data-[collapsible=icon]:hidden">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('shell.search')}
            aria-label={t('shell.filterNav')}
            className="h-9 w-full rounded-xl border border-border/60 bg-muted/50 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ios-blue/50 focus:bg-background"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {area === 'admin' ? t('shell.administration') : t('shell.menu')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filtered.map((item) => {
                const Icon = ICONS[item.href] ?? Home;
                const label = resolveLabel(item);
                const isPolymarket = item.href === '/app/polymarket-agent';
                const isSoon =
                  item.href === '/app/trade-bot' ||
                  item.href === '/app/polymarket-agent' ||
                  item.href === '/app/prediction-markets';

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={label}
                      className={ITEM_CLASSES}
                    >
                      <Link
                        href={bareAppHref(item.href) as never}
                        onClick={closeMobile}
                        className={cn(pathname === item.href && '!text-white')}
                        style={pathname === item.href ? { color: '#ffffff' } : undefined}
                      >
                        {isPolymarket ? (
                          <Image
                            src="/polymarket.png"
                            alt="Polymarket"
                            width={18}
                            height={18}
                            className="size-[18px] rounded-full object-contain shadow-[0_2px_8px_rgba(9,180,255,0.3)]"
                          />
                        ) : (
                          <Icon
                            className={cn('size-[18px]', pathname === item.href && '!text-white !stroke-white')}
                            style={pathname === item.href ? { color: '#ffffff', stroke: '#ffffff' } : undefined}
                          />
                        )}
                        <span
                          className={cn('flex-1 truncate', pathname === item.href && '!text-white')}
                          style={pathname === item.href ? { color: '#ffffff' } : undefined}
                        >
                          {label}
                        </span>
                        {isSoon && (
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[10px] font-bold group-data-[collapsible=icon]:hidden',
                              pathname === item.href
                                ? 'bg-white/25 text-white'
                                : 'bg-amber-500/15 text-amber-500'
                            )}
                          >
                            Soon
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">{t('shell.noMatches')}</li>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Promo banner (Matches newdash-ruby live layout) */}
        <div className="mt-auto px-2 pb-3 group-data-[collapsible=icon]:hidden">
          <div className="rounded-[18px] bg-gradient-to-br from-[#09B4FF] to-[#7A12F5] p-4 text-white shadow-[0_10px_28px_rgba(122,18,245,0.35)] flex flex-col gap-2">
            <p className="font-display text-sm font-extrabold text-white">
              {area === 'admin' ? t('sidebar.moderationQueue') : 'Earn more $OKN'}
            </p>
            <p className="text-xs text-white/90 leading-relaxed">
              {area === 'admin' ? t('sidebar.moderationBody') : 'Complete tasks and invite friends to stack points.'}
            </p>
            <div className="mt-1.5 flex flex-col gap-2">
              <Link
                href={area === 'admin' ? '/admin/claims' : '/app/referral'}
                onClick={closeMobile}
                className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-3 text-xs font-extrabold text-[#09B4FF] shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <span>{area === 'admin' ? t('sidebar.review') : 'Invite friends'}</span>
                {area === 'admin' ? <ModerationQueueBadge /> : null}
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={area === 'admin' ? '/admin/audit-logs' : '/app/tasks'}
                onClick={closeMobile}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-xl bg-white/20 px-3 text-xs font-bold text-white transition-colors hover:bg-white/25 active:scale-95"
              >
                {area === 'admin' ? t('sidebar.auditLogs') : 'Learn more'}
              </Link>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
