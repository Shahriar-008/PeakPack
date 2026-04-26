'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Globe, Users, Flame, Zap } from 'lucide-react';
import { leaderboardApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { packsApi } from '@/lib/api';
import { PageShell } from '@/components/layout';
import { Tabs, Spinner, Avatar } from '@/components/ui';
import { LevelBadge, StreakCounter } from '@/components/gamification';
import { cn, timeAgo } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

const TABS = [
  { id: 'pack',   label: 'My Pack',  icon: <Users className="w-4 h-4" /> },
  { id: 'global', label: 'Global',   icon: <Globe className="w-4 h-4" /> },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-sm font-bold text-[rgb(var(--muted-foreground))]">
      {rank}
    </span>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl border transition-all',
        isMe
          ? 'border-indigo-500/40 bg-indigo-500/8 ring-1 ring-indigo-500/20'
          : 'border-white/6 bg-[rgb(var(--card))] hover:border-white/12'
      )}
    >
      <RankBadge rank={entry.rank} />
      <Avatar src={entry.avatarKey} name={entry.name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate">
            {entry.name}
            {isMe && <span className="ml-1 text-xs text-indigo-400">(you)</span>}
          </p>
          <LevelBadge level={entry.level} size="xs" />
        </div>
        {entry.streak > 0 && <StreakCounter streak={entry.streak} size="sm" />}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-black text-yellow-400 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          {entry.weeklyXp.toLocaleString()}
        </p>
        <p className="text-[10px] text-[rgb(var(--muted-foreground))]">this week</p>
      </div>
    </motion.div>
  );
}

// ── Monday countdown ──────────────────────────────────────────

function ResetTimer() {
  const now = new Date();
  const msUntilMonday = (() => {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    const daysUntil = day === 0 ? 1 : 8 - day;
    d.setUTCDate(d.getUTCDate() + daysUntil);
    return d.getTime() - now.getTime();
  })();

  const h = Math.floor(msUntilMonday / 3600000);
  const m = Math.floor((msUntilMonday % 3600000) / 60000);

  return (
    <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))]">
      <Flame className="w-3.5 h-3.5 text-orange-400" />
      Resets Monday — {h}h {m}m
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState('pack');
  const { user }      = useUserStore();

  const { data: myPack } = useQuery({
    queryKey: ['my-pack'],
    queryFn: packsApi.getMine,
    retry: false,
  });

  const { data: packLeaderboard, isLoading: loadingPack } = useQuery({
    queryKey: ['leaderboard-pack', myPack?.id],
    queryFn: () => leaderboardApi.getPack(myPack!.id),
    enabled: !!myPack?.id && tab === 'pack',
  });

  const { data: globalLeaderboard, isLoading: loadingGlobal } = useQuery({
    queryKey: ['leaderboard-global'],
    queryFn: () => leaderboardApi.getGlobal(100),
    enabled: tab === 'global',
  });

  const entries: LeaderboardEntry[] = tab === 'pack'
    ? (packLeaderboard ?? [])
    : (globalLeaderboard ?? []);

  const isLoading = tab === 'pack' ? loadingPack : loadingGlobal;

  return (
    <PageShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Leaderboard
          </h1>
          <ResetTimer />
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Weekly XP rankings. Resets every Monday at midnight UTC.</p>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-5" />

      {/* No pack state */}
      {tab === 'pack' && !myPack && (
        <div className="text-center py-16 text-[rgb(var(--muted-foreground))]">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">You're not in a Pack yet</p>
          <p className="text-sm mt-1">Join a Pack to see the leaderboard.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      )}

      {/* Entries */}
      {!isLoading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <LeaderboardRow key={entry.userId} entry={entry} isMe={entry.userId === user?.id} />
          ))}
        </div>
      )}

      {!isLoading && entries.length === 0 && (tab === 'global' || myPack) && (
        <div className="text-center py-16 text-[rgb(var(--muted-foreground))]">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No rankings yet this week</p>
          <p className="text-sm mt-1">Check in to earn XP and claim your spot!</p>
        </div>
      )}
    </PageShell>
  );
}
