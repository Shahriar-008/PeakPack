'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Users, Swords, TrendingUp } from 'lucide-react';
import { checkinsApi, packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { useSockets } from '@/hooks/useSocket';
import { getGreeting } from '@/lib/utils';
import { PageShell } from '@/components/layout';
import { StreakCounter, XPBar, XPToast, LevelUpOverlay, BadgeUnlockOverlay } from '@/components/gamification';
import { CheckInModal, CheckInCard, TodayCheckInCard } from '@/components/checkin';
import { Spinner } from '@/components/ui';
import type { CheckInResponse, UserLevel, BadgeDefinition, CheckIn } from '@/types';

export default function DashboardPage() {
  const { user }    = useUserStore();
  const [showCheckIn, setShowCheckIn]   = useState(false);
  const [xpToast, setXpToast]           = useState<number | null>(null);
  const [levelUp, setLevelUp]           = useState<{ newLevel: UserLevel; prev: UserLevel } | null>(null);
  const [badgeUnlock, setBadgeUnlock]   = useState<Pick<BadgeDefinition, 'emoji' | 'name' | 'description'> | null>(null);

  // ── Real-time socket ─────────────────────────────────────────
  useSockets({
    onXP:     ({ xpAwarded }) => setXpToast(xpAwarded),
    onLevelUp: ({ newLevel, previousLevel }) => setLevelUp({ newLevel, prev: previousLevel }),
    onBadge:   (badge) => setBadgeUnlock(badge),
  });

  // ── Queries ──────────────────────────────────────────────────
  const { data: todayCheckIn, isLoading: loadingToday } = useQuery({
    queryKey: ['checkin-today'],
    queryFn: checkinsApi.getToday,
  });

  const { data: myPack } = useQuery({
    queryKey: ['my-pack'],
    queryFn: packsApi.getMine,
    retry: false,
  });

  const { data: feedData } = useQuery({
    queryKey: ['pack-feed', myPack?.id],
    queryFn: () => packsApi.getFeed(myPack!.id, 1, 5),
    enabled: !!myPack?.id,
  });

  const handleCheckInSuccess = (result: CheckInResponse) => {
    if (result.xpEarned) setXpToast(result.xpEarned);
    if (result.levelUp) {
      const prev = user?.level ?? 'Draft';
      setLevelUp({ newLevel: result.levelUp.newLevel as UserLevel, prev: prev as UserLevel });
    }
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <PageShell>
      {/* Greeting */}
      <motion.div {...fadeUp(0)} className="mb-6">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">{getGreeting()},</p>
        <h1 className="text-2xl font-black mt-0.5 flex items-center gap-3">
          {user?.name?.split(' ')[0]}
          <StreakCounter streak={user?.streak ?? 0} size="md" />
        </h1>
      </motion.div>

      {/* Today's Check-In */}
      <motion.div {...fadeUp(0.05)} className="mb-4">
        {loadingToday ? (
          <div className="flex items-center justify-center h-28 rounded-2xl border border-white/8 bg-[rgb(var(--card))]">
            <Spinner className="w-6 h-6" />
          </div>
        ) : (
          <TodayCheckInCard
            checkIn={todayCheckIn ?? null}
            onCheckIn={() => setShowCheckIn(true)}
          />
        )}
      </motion.div>

      {/* XP Progress */}
      <motion.div {...fadeUp(0.1)} className="mb-4 p-4 rounded-2xl border border-white/8 bg-[rgb(var(--card))]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Progress
          </span>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">{user?.xp?.toLocaleString()} XP total</span>
        </div>
        <XPBar totalXP={user?.xp ?? 0} />
      </motion.div>

      {/* Quick Stats */}
      <motion.div {...fadeUp(0.15)} className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: TrendingUp, label: 'Weekly XP',     value: '—',               color: 'text-yellow-400' },
          { icon: Users,      label: 'Pack Rank',     value: myPack ? '#—' : '—', color: 'text-indigo-400' },
          { icon: Swords,     label: 'Challenges',    value: '—',               color: 'text-emerald-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-white/8 bg-[rgb(var(--card))]">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className={`text-lg font-black ${color}`}>{value}</span>
            <span className="text-[10px] text-[rgb(var(--muted-foreground))] text-center">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Mini Pack Feed */}
      {myPack && (
        <motion.div {...fadeUp(0.2)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Pack Activity
            </h2>
            <a href="/pack" className="text-xs text-indigo-400 hover:text-indigo-300">See all →</a>
          </div>
          <div className="space-y-3">
            {feedData?.data?.length === 0 && (
              <p className="text-center text-sm text-[rgb(var(--muted-foreground))] py-6">
                No activity yet. Be the first to check in!
              </p>
            )}
            {(feedData?.data || []).map((ci: CheckIn) => (
              <CheckInCard key={ci.id} checkIn={ci} currentUserId={user?.id} />
            ))}
          </div>
        </motion.div>
      )}

      {!myPack && (
        <motion.div {...fadeUp(0.2)} className="text-center py-10 rounded-2xl border border-dashed border-white/10">
          <Users className="w-10 h-10 text-indigo-400/40 mx-auto mb-3" />
          <p className="font-semibold mb-1">You're not in a Pack yet</p>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">Join or create one to see the activity feed.</p>
          <a href="/pack" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
            Find a Pack →
          </a>
        </motion.div>
      )}

      {/* Modals & Overlays */}
      <CheckInModal
        open={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        onSuccess={handleCheckInSuccess}
      />

      {xpToast !== null && (
        <XPToast show xp={xpToast} onDone={() => setXpToast(null)} />
      )}

      {levelUp && (
        <LevelUpOverlay
          show
          newLevel={levelUp.newLevel}
          previousLevel={levelUp.prev}
          onDismiss={() => setLevelUp(null)}
        />
      )}

      {badgeUnlock && (
        <BadgeUnlockOverlay
          show
          badge={badgeUnlock}
          onDismiss={() => setBadgeUnlock(null)}
        />
      )}
    </PageShell>
  );
}
