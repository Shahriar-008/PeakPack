'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Users, Flag, TrendingUp } from 'lucide-react';
import { checkinsApi, packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { useSockets } from '@/hooks/useSocket';
import { getGreeting } from '@/lib/utils';
import { XPToast, LevelUpOverlay, BadgeUnlockOverlay } from '@/components/gamification';
import { CheckInModal, CheckInCard } from '@/components/checkin';
import type { CheckInResponse, UserLevel, BadgeDefinition, CheckIn } from '@/types';

export default function DashboardPage() {
  const { user } = useUserStore();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<{ newLevel: UserLevel; prev: UserLevel } | null>(null);
  const [badgeUnlock, setBadgeUnlock] = useState<Pick<BadgeDefinition, 'emoji' | 'name' | 'description'> | null>(null);

  // ── Real-time socket ─────────────────────────────────────────
  useSockets({
    onXP: ({ xpAwarded }) => setXpToast(xpAwarded),
    onLevelUp: ({ newLevel, previousLevel }) => setLevelUp({ newLevel, prev: previousLevel }),
    onBadge: (badge) => setBadgeUnlock(badge),
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

  const hasCheckedIn = !!todayCheckIn;
  const xp = user?.xp ?? 0;
  const maxXP = 10000; // Simplified
  const xpPercent = Math.min((xp / maxXP) * 100, 100);

  return (
    <main className="max-w-7xl mx-auto px-margin md:px-6 pt-lg pb-24 md:pb-10 flex flex-col gap-lg">
      {/* Greeting Section */}
      <section className="flex flex-col gap-sm">
        <h1 className="font-h1 text-h1 text-on-surface">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Athlete'} <span className="text-primary-container">🔥 {user?.streak || 0}</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Ready to crush another day. Your pack is moving.</p>
      </section>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        
        {/* Check In Now (Left Col, Span 8) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-white/10 rounded-xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px]"></div>
          <div className="p-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-md relative z-10 h-full">
            <div className="flex flex-col gap-sm max-w-md">
              <div className="inline-flex items-center gap-xs px-3 py-1 bg-surface-container-highest rounded-full border border-white/5 w-fit">
                {!hasCheckedIn ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                    <span className="font-label-bold text-label-bold text-error">PENDING</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="font-label-bold text-label-bold text-tertiary">DONE</span>
                  </>
                )}
              </div>
              <h2 className="font-h2 text-h2 text-on-surface">Check In Now 🔥</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {hasCheckedIn 
                  ? "Great job today! You've logged your workout." 
                  : "Don't break your streak. Your pack is waiting for your update to unlock today's multiplier."}
              </p>
            </div>
            <button 
              onClick={() => setShowCheckIn(true)}
              className="bg-primary-container text-black font-label-bold text-label-bold px-8 py-4 rounded-lg uppercase tracking-wider hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] transition-all w-full md:w-auto active:scale-95 shadow-[0_0_30px_rgba(255,90,31,0.3)]"
            >
              {hasCheckedIn ? 'Edit Log' : 'Log Workout'}
            </button>
          </div>
        </div>

        {/* XP Progress & Badge (Right Col, Span 4) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-white/10 rounded-xl p-md flex flex-col gap-md relative overflow-hidden shadow-[0_0_30px_rgba(5,102,217,0.15)]">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-container/20 rounded-full blur-[60px]"></div>
          <div className="flex justify-between items-start z-10 relative">
            <h3 className="font-h3 text-h3 text-on-surface">Level</h3>
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 border border-secondary-container/50 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(5,102,217,0.3)]">
              <span className="font-label-bold text-label-bold text-secondary text-lg uppercase tracking-widest">{user?.level || 'Draft'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-auto z-10 relative">
            <div className="flex justify-between items-end">
              <span className="font-body-md text-body-md text-on-surface-variant">XP Progress</span>
              <span className="font-label-bold text-label-bold text-secondary">{xp.toLocaleString()} / {maxXP.toLocaleString()}</span>
            </div>
            {/* Gamified Progress Bar */}
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-900 via-secondary-container to-blue-400 relative"
                style={{ width: `${xpPercent}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/50 blur-[2px]"></div>
              </div>
            </div>
            <p className="font-body-md text-[12px] text-on-surface-variant text-right mt-1">{(maxXP - xp).toLocaleString()} XP to Next</p>
          </div>
        </div>

        {/* Quick Stats Row (Span 12) */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-white/10 rounded-xl p-md flex flex-col gap-sm">
            <div className="flex items-center gap-2 text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <span className="font-label-bold text-label-bold uppercase">Total XP</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">{xp.toLocaleString()}<span className="text-h3 text-on-surface-variant ml-1">xp</span></div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-white/10 rounded-xl p-md flex flex-col gap-sm">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <span className="font-label-bold text-label-bold uppercase">Pack Rank</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">{myPack ? '#3' : '—'} <span className="text-body-md text-tertiary ml-2">Top 10%</span></div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-white/10 rounded-xl p-md flex flex-col gap-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-secondary-container/5"></div>
            <div className="flex items-center gap-2 text-secondary relative z-10">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
              <span className="font-label-bold text-label-bold uppercase">Active Challenges</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface relative z-10">2 <span className="text-body-md text-on-surface-variant ml-2">Ends in 4h</span></div>
          </div>
        </div>

        {/* Pack Mini-feed (Span 12) */}
        {myPack && (
          <div className="lg:col-span-12 bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-white/10 rounded-xl p-md flex flex-col gap-md">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Pack Activity
              </h3>
              <a href="/pack" className="font-label-bold text-label-bold text-on-surface-variant hover:text-white transition-colors">View All</a>
            </div>
            <div className="flex flex-col gap-4">
              {feedData?.data?.length === 0 ? (
                <p className="text-center font-body-md text-on-surface-variant py-6">
                  No activity yet. Be the first to check in!
                </p>
              ) : (
                (feedData?.data || []).map((ci: CheckIn) => (
                  <CheckInCard key={ci.id} checkIn={ci} currentUserId={user?.id} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

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
    </main>
  );
}
