'use client';

/**
 * components/layout/app-shell.tsx
 * Responsive dashboard shell:
 *  - Desktop (md+): shadcn sidebar + header + wide content container
 *  - Mobile (<md): same sidebar (renders as a slide-out sheet) + header
 *
 * The shell lives at the layout level so sidebar state and the framer-motion
 * tab indicator survive page navigations and dev hot reloads.
 */
import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { OknSidebar, type OknNavItem } from './okn-sidebar';
import { AreaThemeProvider, AreaThemeToggle } from './area-theme';
import { UserMenu } from './user-menu';
import { AdminUserMenu } from '@/components/admin/admin-user-menu';
import { NotificationBell } from '@/components/admin/notification-bell';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { DevRoleToggle } from '@/components/admin/dev-role-toggle';
import { SilentRefresher } from './silent-refresher';
import { DailyCheckIn } from '@/components/dashboard/daily-check-in';
import { cn } from '@/lib/utils';
import { Bot, Cpu, Download, Home, PlusCircle, Users, Zap } from 'lucide-react';
import Image from 'next/image';

interface AppShellProps {
  area: 'app' | 'admin';
  navItems: readonly OknNavItem[];
  isAdmin?: boolean;
  roleLabel?: string;
  children: React.ReactNode;
}

const MOBILE_BOTTOM_NAV = [
  { href: '/app/portfolio', label: 'Home', icon: Home },
  { href: '/app/tasks', label: 'Earn', icon: Zap },
  { href: '/app/buy', label: 'Buy', icon: PlusCircle },
  { href: '/app/referral', label: 'Referral', icon: Users },
  { href: '/app/agents', label: 'Agents', icon: Cpu },
] as const;

export function AppShell({ area, navItems, isAdmin, roleLabel, children }: AppShellProps) {
  const pathname = usePathname();
  const t = useTranslations('dashboard');
  const activeItem = navItems.find((i) => i.href === pathname);
  const title = activeItem
    ? (activeItem.labelKey ? t(`nav.${activeItem.labelKey}`) : (activeItem.label ?? ''))
    : (pathname.startsWith('/admin') ? t('shell.admin') : t('shell.dashboard'));

  const [open, setOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AreaThemeProvider area={area}>
      <SilentRefresher />
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <OknSidebar area={area} navItems={navItems} isAdmin={isAdmin} roleLabel={roleLabel} />
        <SidebarInset className="bg-[var(--bg)] transition-colors duration-200">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--line)] bg-[var(--s1)]/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="size-10 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--s1)] transition-colors" />
            <Separator orientation="vertical" className="h-5 bg-[var(--line)]" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--s2)] md:hidden">
                <Image src="/okn-logo.png" alt="OKN" width={20} height={20} className="size-5 object-contain" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--tx)] md:hidden">{title}</h1>
            </div>

            {/* Right cluster matching reference */}
            <div className="ml-auto flex items-center gap-2.5">
              {area === 'app' ? <LanguageSwitcher /> : null}
              <AreaThemeToggle />
              <NotificationBell />
              {area === 'app' ? <UserMenu /> : null}
              {area === 'admin' ? <DevRoleToggle /> : null}
              {area === 'admin' ? <AdminUserMenu /> : null}
            </div>
          </header>

          <div className="app-shell-main flex-1 overflow-y-auto">
            <div
              className={cn(
                'mx-auto w-full px-4 py-6 md:px-8',
                area === 'app'
                  ? 'max-w-7xl pb-24 md:pb-10'
                  : 'max-w-[96rem] pb-8',
              )}
            >
              {children}
            </div>
          </div>

          {/* Mobile Bottom Navigation Bar (app area only) */}
          {area === 'app' && (
            <nav
              aria-label="Mobile Navigation"
              className="web3-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-[var(--line)] bg-[rgba(19,19,22,0.94)] px-3 backdrop-blur-2xl md:hidden"
            >
              {MOBILE_BOTTOM_NAV.map((tab) => {
                const Icon = tab.icon;
                const isActive =
                  (tab.href === '/app/portfolio' && (pathname === '/app' || pathname === '/app/portfolio' || pathname.startsWith('/app/portfolio'))) ||
                  (tab.href === '/app/agents' && (pathname.startsWith('/app/agents') || pathname.startsWith('/app/trade-bot') || pathname.startsWith('/app/polymarket-agent') || pathname.startsWith('/app/prediction-markets'))) ||
                  (tab.href !== '/app/portfolio' && tab.href !== '/app/agents' && (pathname === tab.href || pathname.startsWith(tab.href + '/')));
                return (
                  <Link
                    key={tab.href}
                    href={tab.href as never}
                    className={cn(
                      'flex flex-col items-center justify-center gap-[3px] h-[48px] min-w-[58px] px-2.5 py-1 rounded-[14px] transition-all duration-200 active:scale-95 cursor-pointer',
                      isActive
                        ? 'bg-gradient-to-br from-[#7A12F5] to-[#8E2BFF] !text-white text-white shadow-[0_4px_16px_rgba(122,18,245,0.45)]'
                        : 'bg-transparent text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                    style={isActive ? { background: 'linear-gradient(135deg, #7A12F5 0%, #8E2BFF 100%)', color: '#ffffff' } : undefined}
                  >
                    <Icon
                      className={cn('size-5', isActive ? '!text-white !stroke-white' : 'text-[var(--mut)]')}
                      style={isActive ? { color: '#ffffff', stroke: '#ffffff' } : undefined}
                    />
                    <span
                      className={cn(
                        'text-[10.5px] tracking-tight font-extrabold',
                        isActive ? '!text-white' : 'text-[var(--mut)]',
                      )}
                      style={isActive ? { color: '#ffffff' } : undefined}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}
        </SidebarInset>

        {/* Daily login check-in */}
        {area === 'app' && <DailyCheckIn />}
      </SidebarProvider>
    </AreaThemeProvider>
  );
}
