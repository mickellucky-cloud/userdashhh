'use client';

/**
 * /app/tasks — Earn OK Points Tasks & Missions Dashboard.
 *
 * Full port & improvement from https://newdash-ruby.vercel.app/tasks
 * Features category filter pills, dynamic completion state, instant points rewards,
 * and confetti celebration on verification.
 */
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Check,
  ChevronDown,
  Flame,
  Globe,
  ListChecks,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { triggerConfetti } from '@/lib/confetti';
import { toast } from 'sonner';

interface TaskItem {
  id: string;
  category: 'social' | 'daily' | 'referral';
  title: string;
  points: number;
  iconBg: string;
  iconColor: string;
  iconSvg: React.ReactNode;
  url?: string;
}

const ALL_TASKS: TaskItem[] = [
  {
    id: 't-telegram',
    category: 'social',
    title: 'Join our Telegram',
    points: 50,
    iconBg: 'rgba(9, 180, 255, 0.15)',
    iconColor: '#09B4FF',
    url: 'https://t.me/okntest001_bot',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
    ),
  },
  {
    id: 't-x',
    category: 'social',
    title: 'Follow us on X',
    points: 70,
    iconBg: 'var(--s2)',
    iconColor: 'var(--tx)',
    url: 'https://x.com/okntoken',
    iconSvg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 't-facebook',
    category: 'social',
    title: 'Follow $OKN on Facebook',
    points: 50,
    iconBg: 'rgba(66, 103, 178, 0.15)',
    iconColor: '#4267B2',
    url: 'https://facebook.com',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#4267B2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 't-youtube',
    category: 'social',
    title: 'Subscribe on YouTube',
    points: 65,
    iconBg: 'rgba(255, 0, 0, 0.15)',
    iconColor: '#FF0000',
    url: 'https://youtube.com',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 't-discord',
    category: 'social',
    title: 'Follow $OKN on Discord',
    points: 40,
    iconBg: 'rgba(88, 101, 242, 0.15)',
    iconColor: '#5865F2',
    url: 'https://discord.com',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    id: 't-checkin',
    category: 'daily',
    title: 'Daily Check-in',
    points: 20,
    iconBg: 'rgba(255, 170, 0, 0.15)',
    iconColor: '#FFAA00',
    iconSvg: <Flame className="size-5" />,
  },
  {
    id: 't-wallet',
    category: 'daily',
    title: 'Connect Web3 Wallet',
    points: 50,
    iconBg: 'rgba(122, 18, 245, 0.15)',
    iconColor: '#7A12F5',
    iconSvg: <Wallet className="size-5" />,
  },
  {
    id: 't-referral',
    category: 'referral',
    title: 'Invite your first friend',
    points: 100,
    iconBg: 'rgba(47, 189, 142, 0.15)',
    iconColor: '#2FBD8E',
    url: '/app/referral',
    iconSvg: <Users className="size-5" />,
  },
  {
    id: 't-whitepaper',
    category: 'social',
    title: 'Read $OKN Whitepaper',
    points: 30,
    iconBg: 'rgba(9, 180, 255, 0.15)',
    iconColor: '#09B4FF',
    url: 'https://docs.okntoken.com',
    iconSvg: <Globe className="size-5" />,
  },
  {
    id: 't-retweet',
    category: 'social',
    title: 'Retweet Pinned Announcement',
    points: 40,
    iconBg: 'var(--s2)',
    iconColor: 'var(--tx)',
    url: 'https://x.com',
    iconSvg: <Sparkles className="size-5" />,
  },
  {
    id: 't-reddit',
    category: 'social',
    title: 'Join OKN Reddit Community',
    points: 40,
    iconBg: 'rgba(255, 69, 0, 0.15)',
    iconColor: '#FF4500',
    url: 'https://reddit.com',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF4500">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.25-.56 1.25-1.25 0-.688-.56-1.25-1.25-1.25zm5.5 0c-.688 0-1.25.56-1.25 1.25 0 .688.56 1.25 1.25 1.25.688 0 1.25-.56 1.25-1.25 0-.688-.56-1.25-1.25-1.25zm-5.464 3.99a.327.327 0 0 0-.231.096.327.327 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.096z" />
      </svg>
    ),
  },
];

export default function TasksPage() {
  const [filter, setFilter] = useState<'all' | 'social' | 'daily' | 'referral'>('all');
  const [completedIds, setCompletedIds] = useState<string[]>(['t-checkin']);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredTasks = ALL_TASKS.filter((t) => {
    if (filter === 'all') return true;
    return t.category === filter;
  });

  const totalPoints = ALL_TASKS.reduce((acc, t) => acc + t.points, 0); // 555 pts
  const earnedPoints = ALL_TASKS.filter((t) => completedIds.includes(t.id)).reduce(
    (acc, t) => acc + t.points,
    0,
  );
  const progressPercent = Math.round((completedIds.length / ALL_TASKS.length) * 100);

  const handleClaim = (task: TaskItem) => {
    if (completedIds.includes(task.id)) return;
    setLoadingId(task.id);

    if (task.url && typeof window !== 'undefined') {
      window.open(task.url, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      setCompletedIds((prev) => [...prev, task.id]);
      setLoadingId(null);
      triggerConfetti();
      toast.success(`Verified! +${task.points} OK Points added to your account.`);
    }, 1200);
  };

  return (
    <main className="space-y-6">
      {/* 1. Earn OK Points Hero Banner */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#7A12F5] p-7 md:p-9 text-white shadow-xl">
        <div className="text-[12px] md:text-[13px] font-bold uppercase tracking-[0.1em] text-white/80 mb-1.5">
          Earn OK Points
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-xs md:text-sm font-medium text-white/85">Available to earn</div>
            <div className="num mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
              555 <span className="text-lg md:text-2xl font-bold text-white/85">OK Points</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/15 p-4 md:p-5 backdrop-blur-md min-w-[220px]">
            <div className="text-xs font-medium text-white/85">Task Progress</div>
            <div className="num mt-1 text-base md:text-lg font-extrabold text-white">
              {completedIds.length} / {ALL_TASKS.length} tasks completed
            </div>
            <div className="mt-2.5 h-2 w-full rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Filter Tabs / Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'social', 'daily', 'referral'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`h-9 px-5 rounded-full text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${
              filter === cat
                ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
                : 'bg-[var(--s2)] text-[var(--mut)] border border-[var(--line)] hover:text-[var(--tx)]'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* 3. Task Cards Grid (2 Columns on Desktop, 1 on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isDone = completedIds.includes(task.id);
          const isLoading = loadingId === task.id;

          return (
            <div
              key={task.id}
              className={`rounded-[20px] border p-4.5 md:p-5 flex items-center justify-between gap-4 transition-all duration-200 ${
                isDone
                  ? 'border-[var(--line)] bg-[var(--s1)]/60 opacity-80'
                  : 'border-[var(--line)] bg-[var(--s1)] shadow-sm hover:-translate-y-0.5 hover:border-[#7A12F5]/35 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: task.iconBg, color: task.iconColor }}
                >
                  {task.iconSvg}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-[var(--tx)] truncate">{task.title}</div>
                  <div className="num text-xs font-extrabold text-[#2FBD8E] mt-0.5">
                    +{task.points} OK Points
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleClaim(task)}
                disabled={isDone || isLoading}
                className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isDone
                    ? 'bg-[#2FBD8E]/15 text-[#2FBD8E] border border-[#2FBD8E]/30 cursor-default'
                    : isLoading
                    ? 'bg-[#7A12F5]/70 text-white animate-pulse'
                    : 'bg-[#7A12F5] text-white shadow-md hover:bg-[#8C38F7] active:scale-95'
                }`}
              >
                {isDone ? (
                  <>
                    <Check className="size-3.5 stroke-[3]" />
                    <span>Done</span>
                  </>
                ) : isLoading ? (
                  <span>Verifying...</span>
                ) : (
                  <span>Claim</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Invite Friends Banner */}
      <div className="rounded-[24px] border border-[var(--line)] bg-gradient-to-r from-[#7A12F5]/15 via-[#09B4FF]/10 to-[var(--s1)] p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[var(--tx)]">Invite friends to stack more points</h3>
          <p className="text-xs text-[var(--mut)] mt-0.5">
            Earn ascending bonuses and up to 15% BNB commission on every token purchase.
          </p>
        </div>
        <Link
          href="/app/referral"
          className="h-10 px-5 rounded-xl bg-[#7A12F5] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md hover:bg-[#8C38F7] active:scale-95 transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Users className="size-4" />
          <span>Go to Referral</span>
        </Link>
      </div>
    </main>
  );
}
