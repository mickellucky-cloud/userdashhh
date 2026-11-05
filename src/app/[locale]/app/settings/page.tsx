'use client';

/**
 * /app/settings — user self-service settings.
 *
 * Five sections:
 *   Profile     — read-only Telegram identity + editable display name
 *   Email       — bind / change / remove an email (verification is a later phase)
 *   Wallet      — read-only bound wallet + deep links to /app/wallet
 *   Appearance  — area-scoped light/dark + notification preference toggles
 *   Session     — sign-out, support links
 *
 * All write actions go through POST /api/profile and invalidate ['me'] so the
 * header avatar and every other consumer pick up the new values.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  AtSign,
  CalendarClock,
  Check,
  Copy,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Send,
  Shield,
  UserCircle,
  Wallet as WalletIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { SocialIconRow } from '@/components/landing/social-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { AreaThemeSwitch } from '@/components/layout/area-theme';
import { TwoFactorCard } from '@/components/settings/two-factor-card';
import { useMe, useUpdateProfile, useSendEmailVerification, useVerifyEmail } from '@/lib/hooks/use-me';
import type { MeUser } from '@/lib/api/client';
import { cn } from '@/lib/utils';

// Social channel links now come from MARKETING.socials (rendered via
// <SocialIconRow />), so the old single NEXT_PUBLIC_COMMUNITY_URL override is
// no longer used here. Terms/Privacy remain local app routes.
const TERMS_URL = '/terms';
const PRIVACY_URL = '/privacy';

/**
 * Dev-only seed user. When /api/me resolves to no user during local development
 * (no session, not onboarded), we fall back to this so the Profile/Email/Wallet
 * tabs render fully populated for UI review. Strictly gated on NODE_ENV so it
 * can never ship to production.
 */
const DEV_SEED_USER: MeUser = {
  id: '00000000-0000-0000-0000-000000000000',
  telegramId: '1234567890',
  username: 'okndev',
  firstName: 'Alex',
  lastName: 'Morgan',
  photoUrl: null,
  email: 'alex.morgan@example.com',
  emailVerifiedAt: null,
  walletAddress: '0xAb3F4c2D9e8a1B7C6d5E4f3A2b1C0d9E8f7A6B5c',
  walletBoundAt: '2026-01-14T09:32:00.000Z',
  adminRole: null,
  twoFactorEnabled: false,
  createdAt: '2025-11-03T14:20:00.000Z',
};

type NotificationPrefs = {
  taskAlerts: boolean;
  missionAlerts: boolean;
};
const NOTIF_KEY = 'okn-prefs:notifications';
const DEFAULT_NOTIFS: NotificationPrefs = { taskAlerts: true, missionAlerts: true };

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const { data, isLoading, isError } = useMe();
  const realUser = data?.user ?? null;
  // In development, fall back to a seed user when /me has settled empty so the
  // tabs render fully populated for UI review. Production keeps the real guest
  // flow (no session -> GuestCard).
  const devFallback = process.env.NODE_ENV === 'development' && !isLoading && !realUser;
  const user = realUser ?? (devFallback ? DEV_SEED_USER : null);
  // `user` is null in three distinct cases that must NOT share the same UI:
  //   - isLoading: request in flight -> skeleton (transient)
  //   - isError:   request failed (e.g. no session, 401) -> guest state
  //   - settled    with user === null: no DB row yet -> guest state
  // Previously every null case rendered <SkeletonCard/> forever, so the
  // Profile tab never resolved for anyone not fully onboarded. Now the
  // settled-but-empty cases render a real GuestCard instead of waiting.
  // (In dev, the seed user above short-circuits the guest case entirely.)
  const showGuest = !isLoading && (!user || isError);

  return (
    <main className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="profile">{t('tabProfile')}</TabsTrigger>
          <TabsTrigger value="email">{t('tabEmail')}</TabsTrigger>
          <TabsTrigger value="wallet">{t('tabWallet')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabSecurity')}</TabsTrigger>
          <TabsTrigger value="appearance">{t('tabAppearance')}</TabsTrigger>
          <TabsTrigger value="session">{t('tabSession')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <ProfileTab user={user} isLoading={isLoading} showGuest={showGuest} />
        </TabsContent>
        <TabsContent value="email" className="mt-6 space-y-6">
          <EmailTab user={user} isLoading={isLoading} showGuest={showGuest} />
        </TabsContent>
        <TabsContent value="wallet" className="mt-6 space-y-6">
          <WalletTab user={user} isLoading={isLoading} showGuest={showGuest} />
        </TabsContent>
        <TabsContent value="security" className="mt-6 space-y-6">
          <TwoFactorCard user={user} isLoading={isLoading} showGuest={showGuest} />
        </TabsContent>
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="session" className="mt-6 space-y-6">
          <SessionTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ============ PROFILE ============ */

type TabStateProps = {
  user: MeUserLike | null;
  isLoading: boolean;
  showGuest: boolean;
};

function ProfileTab({ user, isLoading, showGuest }: TabStateProps) {
  const t = useTranslations('dashboard.settings');
  const tToast = useTranslations('toasts.settings');
  const { toast } = useToast();
  const update = useUpdateProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkTgLoading, setLinkTgLoading] = useState(false);

  const handleLinkTelegram = async () => {
    setLinkTgLoading(true);
    try {
      const res = await fetch('/api/telegram/bind-token');
      if (res.ok) {
        const data = await res.json();
        if (data.deepLink) {
          window.open(data.deepLink, '_blank');
        }
      } else {
        const body = await res.json().catch(() => ({}));
        toast({
          title: 'Could not generate link',
          description: body.error || 'Please try again later.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Failed to request Telegram binding token.',
        variant: 'destructive',
      });
    } finally {
      setLinkTgLoading(false);
    }
  };

  // Seed from server data once it arrives; do not clobber typing after that.
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
    }
  }, [user?.id, user?.firstName, user?.lastName]);

  // Loading (transient) -> skeleton. Settled but no user (no session or no
  // DB row yet) -> guest card with a re-login nudge. Only the truly loaded
  // state renders the real form.
  if (isLoading) return <SkeletonCard />;
  if (showGuest || !user) return <GuestCard />;

  const dirty = firstName !== (user.firstName ?? '') || lastName !== (user.lastName ?? '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        onSuccess: () => toast({ title: tToast('profileUpdated') }),
        onError: (err) =>
          toast({
            title: tToast('profileFailed'),
            description: err.message,
            variant: 'destructive',
          }),
      },
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('displayNameTitle')}</CardTitle>
          <CardDescription>{t('displayNameDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {user.photoUrl ? <AvatarImage src={user.photoUrl} alt="" /> : null}
                <AvatarFallback>{initials(user)}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                    user.username ||
                    t('anonymous')}
                </p>
                <p className="text-xs text-muted-foreground">{t('avatarNote')}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first-name">{t('firstNameLabel')}</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={64}
                  placeholder={t('firstNamePlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last-name">{t('lastNameLabel')}</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={64}
                  placeholder={t('lastNamePlaceholder')}
                />
              </div>
            </div>

            <Button type="submit" disabled={!dirty || update.isPending}>
              {update.isPending ? <Loader2 className="animate-spin" /> : null}
              {t('saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('identityTitle')}</CardTitle>
          <CardDescription>{t('identityDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.telegramId ? (
            <>
              <ReadonlyRow
                icon={AtSign}
                label={t('telegramUsername')}
                value={user.username ? `@${user.username}` : t('notSet')}
              />
              <ReadonlyRow icon={MessageCircle} label={t('telegramId')} value={user.telegramId} />
            </>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-ios-blue/20 bg-ios-blue/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{t('telegramNotLinked')}</span>
                  <Badge variant="secondary" className="bg-ios-blue/15 text-ios-blue border-0">
                    +50 OK Points
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t('telegramUnlinkedDesc')}</p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleLinkTelegram}
                disabled={linkTgLoading}
                className="shrink-0 gap-1.5 bg-ios-blue hover:bg-ios-blue/90 text-white cursor-pointer"
              >
                {linkTgLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {t('linkTelegramBtn')}
              </Button>
            </div>
          )}
          <ReadonlyRow
            icon={CalendarClock}
            label={t('joinedOkn')}
            value={new Date(user.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          />
          {user.adminRole ? (
            <ReadonlyRow
              icon={Shield}
              label={t('role')}
              value={<Badge variant="secondary">{user.adminRole.replace('_', ' ')}</Badge>}
            />
          ) : null}
          <ReadonlyRow icon={Shield} label={t('userId')} value={<CopyableValue value={user.id} />} />
        </CardContent>
      </Card>
    </>
  );
}

/* ============ EMAIL ============ */

function EmailTab({ user, isLoading, showGuest }: TabStateProps) {
  const t = useTranslations('dashboard.settings');
  const tToast = useTranslations('toasts.settings');
  const { toast } = useToast();
  const update = useUpdateProfile();
  const sendVerification = useSendEmailVerification();
  const verify = useVerifyEmail();
  const [emailInput, setEmailInput] = useState('');
  const [mode, setMode] = useState<'view' | 'edit' | 'verify'>('view');
  const [codeInput, setCodeInput] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  // Resend cooldown (seconds). Set when a code is sent; ticks down via effect.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Reset to view mode whenever the bound email changes server-side, and
    // clear any in-flight verification state.
    if (user?.email) {
      setMode('view');
      setCodeInput('');
      setDevCode(null);
    }
  }, [user?.email]);

  // Cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  if (isLoading) return <SkeletonCard />;
  if (showGuest || !user) return <GuestCard />;

  const submitEmail = (nextEmail: string) => {
    update.mutate(
      { email: nextEmail },
      {
        onSuccess: () => {
          toast({ title: nextEmail ? tToast('emailSaved') : tToast('emailRemoved') });
          setEmailInput('');
          if (nextEmail) setMode('view');
        },
        onError: (err) =>
          toast({
            title: tToast('emailFailed'),
            description: err.message,
            variant: 'destructive',
          }),
      },
    );
  };

  const handleBind = (e: React.FormEvent) => {
    e.preventDefault();
    submitEmail(emailInput.trim());
  };

  const startVerification = () => {
    setCodeInput('');
    setDevCode(null);
    setMode('verify');
    void sendCode();
  };

  const sendCode = () => {
    sendVerification.mutate(undefined, {
      onSuccess: (res) => {
        setCooldown(30);
        setDevCode(res.devCode ?? null);
        toast({ title: tToast('verificationSent') });
      },
      onError: (err) =>
        toast({
          title: tToast('verificationFailed'),
          description: err.message,
          variant: 'destructive',
        }),
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate(codeInput.trim(), {
      onSuccess: () => {
        toast({ title: tToast('emailVerified'), description: t('verifySuccessDesc') });
        setMode('view');
        setCodeInput('');
        setDevCode(null);
      },
      onError: (err) =>
        toast({
          title: tToast('verificationFailed'),
          description: err.message,
          variant: 'destructive',
        }),
    });
  };

  const isVerified = Boolean(user.emailVerifiedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('emailTitle')}</CardTitle>
        <CardDescription>{t('emailDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.email && mode === 'view' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{user.email}</span>
                {isVerified ? (
                  <Badge variant="outline" className="bg-ios-green/10 text-ios-green">
                    <Check className="mr-1 size-3" />
                    {t('verified')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-ios-orange/10 text-ios-orange">
                    {t('unverified')}
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {!isVerified ? (
                  <Button size="sm" variant="default" onClick={startVerification}>
                    {t('verify')}
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setMode('edit')}>
                  {t('change')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => submitEmail('')}>
                  {t('remove')}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isVerified ? t('verifySuccessDesc') : t('verifyHint')}
            </p>
          </>
        ) : user.email && mode === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="verify-code">{t('enterCode')}</Label>
              <p className="text-xs text-muted-foreground">{t('enterCodeDesc')}</p>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('codePlaceholder')}
                maxLength={6}
                className="font-mono text-lg tracking-[0.4em]"
                required
              />
            </div>
            {devCode ? (
              <p className="rounded-md bg-ios-blue/10 px-3 py-2 text-xs font-medium text-ios-blue">
                {t('devCodeHint')} <span className="font-mono">{devCode}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={codeInput.length !== 6 || verify.isPending}>
                {verify.isPending ? <Loader2 className="animate-spin" /> : null}
                {t('submitCode')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={sendCode}
                disabled={cooldown > 0 || sendVerification.isPending}
              >
                {cooldown > 0 ? t('resendIn', { seconds: cooldown }) : t('resend')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode('view')}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBind} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">{user.email ? t('newEmailTitle') : t('bindEmailTitle')}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!emailInput.trim() || update.isPending}>
                {update.isPending ? <Loader2 className="animate-spin" /> : null}
                {user.email ? t('submitUpdate') : t('submitBind')}
              </Button>
              {user.email ? (
                <Button type="button" variant="ghost" onClick={() => setMode('view')}>
                  {t('cancel')}
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ WALLET ============ */

function WalletTab({ user, isLoading, showGuest }: TabStateProps) {
  const t = useTranslations('dashboard.settings');
  if (isLoading) return <SkeletonCard />;
  if (showGuest || !user) return <GuestCard />;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('walletTitle')}</CardTitle>
        <CardDescription>{t('walletDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.walletAddress ? (
          <>
            <ReadonlyRow
              icon={WalletIcon}
              label={t('boundAddress')}
              value={<CopyableValue value={user.walletAddress} mono />}
            />
            {user.walletBoundAt ? (
              <ReadonlyRow
                icon={CalendarClock}
                label={t('boundSince')}
                value={new Date(user.walletBoundAt).toLocaleDateString()}
              />
            ) : null}
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/app/wallet">{t('manageWallet')}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/wallet">{t('requestRebind')}</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{t('walletNotBound')}</span>
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-0">
                  +50 OK Points
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{t('walletUnboundDesc')}</p>
            </div>
            <Button asChild size="sm" className="shrink-0 gap-1.5 bg-ios-blue hover:bg-ios-blue/90 text-white">
              <Link href="/app/wallet">
                <WalletIcon className="size-3.5" />
                {t('bindWalletRewardBadge')}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ TWO-FACTOR AUTH ============ */
// The 2FA card now lives in a shared component so the admin profile page can
// reuse the exact same enroll/disable UX: components/settings/two-factor-card.

/* ============ APPEARANCE + NOTIFICATIONS ============ */

function AppearanceTab() {
  const t = useTranslations('dashboard.settings');
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFS);

  // Load persisted prefs after mount to avoid hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...DEFAULT_NOTIFS, ...JSON.parse(raw) });
    } catch {
      /* corrupt or missing — keep defaults */
    }
  }, []);

  const togglePref = (key: keyof NotificationPrefs) => (checked: boolean | 'indeterminate') => {
    const next = { ...prefs, [key]: checked === true };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable in private mode — silent fallback */
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('appearanceTitle')}</CardTitle>
          <CardDescription>{t('appearanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{t('themeLabel')}</p>
              <p className="text-xs text-muted-foreground">{t('themeHint')}</p>
            </div>
            <AreaThemeSwitch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('notificationsTitle')}
            <Badge variant="outline" className="ml-2 bg-ios-orange/10 text-ios-orange">
              {t('notificationsBadge')}
            </Badge>
          </CardTitle>
          <CardDescription>{t('notificationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* G14: toggles are intentionally disabled — no notification backend
              exists yet. They're shown to communicate the planned feature set,
              not to imply working functionality. The "Demo" badge + this note
              make the non-functional state unambiguous. */}
          <NotificationRow
            id="notif-tasks"
            label={t('notifTaskLabel')}
            description={t('notifTaskDesc')}
            checked={prefs.taskAlerts}
            onCheckedChange={togglePref('taskAlerts')}
            disabled
          />
          <NotificationRow
            id="notif-missions"
            label={t('notifMissionLabel')}
            description={t('notifMissionDesc')}
            checked={prefs.missionAlerts}
            onCheckedChange={togglePref('missionAlerts')}
            disabled
          />
          <p className="rounded-ios-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {t('notificationsComingSoon')}
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function NotificationRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start justify-between gap-3 rounded-lg p-2',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/40',
      )}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={disabled ? undefined : onCheckedChange}
        disabled={disabled}
        className="mt-1"
      />
    </label>
  );
}

/* ============ SESSION ============ */

function SessionTab() {
  const t = useTranslations('dashboard.settings');
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('supportTitle')}</CardTitle>
          <CardDescription>{t('supportDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full social row — replaces the single Telegram button so every
              community channel is always reachable from the dashboard. */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">{t('communityLabel')}</p>
            <SocialIconRow />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">
                {t('terms')}
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                {t('privacy')}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t('signOutTitle')}</CardTitle>
          <CardDescription>{t('signOutDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? <Loader2 className="animate-spin" /> : <LogOut className="size-4" />}
            {t('signOutButton')}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

/* ============ shared bits ============ */

// Non-null user shape. All tab components early-return a skeleton when user
// is null, so any helper that takes MeUserLike can assume non-null.
type MeUserLike = NonNullable<NonNullable<ReturnType<typeof useMe>['data']>['user']>;

function initials(user: MeUserLike): string {
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

function ReadonlyRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AtSign;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        {label}
      </span>
      <span className="min-w-0 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function CopyableValue({ value, mono }: { value: string; mono?: boolean }) {
  const t = useTranslations('dashboard.common');
  const [copied, setCopied] = useState(false);
  const display = mono && value.startsWith('0x') ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted',
        mono && 'font-mono text-xs',
      )}
      title={t('copy')}
      aria-label={t('copyValue', { value })}
    >
      {copied ? <Check className="size-3 text-ios-green" /> : <Copy className="size-3" />}
      {display}
    </button>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

/**
 * GuestCard — resolved empty state shown when the /me request has settled but
 * there is no user (no session, or session exists but no DB row yet). This is
 * NOT a skeleton: it is terminal content the user can read and act on, so the
 * tab is never stuck waiting. Includes a re-login CTA since the most common
 * cause is an expired/missing session in development.
 */
function GuestCard() {
  const t = useTranslations('dashboard.settings');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="size-5 text-muted-foreground" />
          {t('notSignedInTitle')}
        </CardTitle>
        <CardDescription>{t('notSignedInDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/login">{t('signInCta')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
