'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import type { Challenge, ChallengeParticipant } from '@/types';

// ── Custom Styles ──
const styles = {
  glassPanel: { background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderTop: '1px solid rgba(255, 255, 255, 0.15)' },
  glowOrange: { boxShadow: '0 0 20px rgba(255, 90, 31, 0.15)' },
  glowBlue: { boxShadow: '0 0 20px rgba(173, 198, 255, 0.15)' },
  cardGradient: { background: 'linear-gradient(135deg, #1A1A1A 0%, #121212 100%)' },
  progressFillOrange: { background: 'linear-gradient(90deg, #ff5a1f 0%, #ff8a66 100%)', boxShadow: '2px 0 10px rgba(255, 90, 31, 0.5)' },
  progressFillBlue: { background: 'linear-gradient(90deg, #0566d9 0%, #adc6ff 100%)', boxShadow: '2px 0 10px rgba(5, 102, 217, 0.5)' },
};

const challengeTypeTheme: Record<string, { glow: string; text: string; action: string; icon: string }> = {
  community: {
    glow: 'bg-primary-container/20 group-hover:bg-primary-container/30',
    text: 'text-primary-container',
    action: 'text-primary-container hover:text-white',
    icon: 'bolt',
  },
  pack: {
    glow: 'bg-secondary/20 group-hover:bg-secondary/30',
    text: 'text-secondary',
    action: 'text-secondary hover:text-white',
    icon: 'fitness_center',
  },
  default: {
    glow: 'bg-tertiary/20 group-hover:bg-tertiary/30',
    text: 'text-tertiary',
    action: 'text-tertiary hover:text-white',
    icon: 'timer',
  },
};

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll(),
  });

  const { mutate: join } = useMutation({
    mutationFn: (id: string) => challengesApi.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const now = new Date();
  
  // Quick Join: Challenges I haven't joined yet
  const quickJoin = challenges.filter((c: Challenge) => {
    const isJoined = c.participants?.some((p: ChallengeParticipant) => p.userId === user?.id);
    return !isJoined && new Date(c.endDate) >= now;
  });

  // Active Arena: Challenges I have joined
  const activeArena = challenges.filter((c: Challenge) => {
    return c.participants?.some((p: ChallengeParticipant) => p.userId === user?.id);
  });

  return (
    <main className="max-w-7xl mx-auto px-margin md:px-6 pt-lg pb-24 md:pb-10 flex flex-col gap-xl">
      {/* Page Header & Actions */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs hidden md:block">Active Challenges</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">Push past your limits. Join community events or challenge your pack to dominate the leaderboards.</p>
        </div>
        <button className="w-full md:w-auto bg-primary-container text-black font-label-bold text-label-bold px-md py-sm rounded transition-all hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] active:scale-95 flex items-center justify-center gap-2">
          <span>Create Challenge</span>
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </section>

      {/* Quick Join Horizonatal Scroll */}
      <section>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-h2 text-h2 text-on-surface">Quick Join</h2>
          <button className="font-label-bold text-label-bold text-secondary hover:text-secondary-fixed-dim flex items-center gap-1 transition-colors">
            View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
          </div>
        ) : quickJoin.length === 0 ? (
          <p className="text-on-surface-variant font-body-md py-4">No new challenges available to join.</p>
        ) : (
          <div className="flex overflow-x-auto gap-margin pb-sm -mx-margin px-margin md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {quickJoin.map((challenge: Challenge) => {
              const theme = challengeTypeTheme[challenge.type] || challengeTypeTheme.default;
              
              return (
                <div key={challenge.id} className="min-w-[280px] w-[280px] border border-white/10 rounded-lg p-md flex flex-col gap-sm relative overflow-hidden group shrink-0" style={styles.cardGradient}>
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] transition-colors ${theme.glow}`}></div>
                  <div className="flex justify-between items-start z-10 relative">
                    <span className={`bg-surface-container-high px-2 py-1 rounded text-[10px] font-label-bold uppercase border border-white/5 ${theme.text}`}>{challenge.type}</span>
                    <span className={`material-symbols-outlined ${theme.text}`}>{theme.icon}</span>
                  </div>
                  <div className="z-10 relative">
                    <h3 className="font-h3 text-h3 text-on-surface mb-1 truncate">{challenge.title}</h3>
                    <p className="font-body-md text-body-md text-zinc-500 text-sm line-clamp-2">{challenge.description || 'No description provided.'}</p>
                  </div>
                  <div className="mt-auto pt-sm flex justify-between items-center border-t border-white/5 z-10 relative">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      <span className="font-label-bold text-label-bold text-[12px]">{challenge._count?.participants || 0}</span>
                    </div>
                    <button onClick={() => join(challenge.id)} className={`font-label-bold text-label-bold text-sm transition-colors ${theme.action}`}>Join</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Challenges Grid */}
      <section>
        <h2 className="font-h2 text-h2 text-on-surface mb-md">Your Active Arena</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
          </div>
        ) : activeArena.length === 0 ? (
          <div className="glass-panel rounded-xl p-lg text-center border border-white/10" style={styles.glassPanel}>
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">sports_score</span>
            <h3 className="font-h3 text-xl text-on-surface mb-2">No active challenges</h3>
            <p className="font-body-md text-on-surface-variant">Join a challenge above to start earning bonus XP.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-margin">
            {activeArena.map((challenge: Challenge) => {
              const myParticipant = challenge.participants?.find((p: ChallengeParticipant) => p.userId === user?.id);
              const [metric, goalStr] = (challenge.goalMetric || ':1').split(':');
              const goal = Number(goalStr) || 1;
              const progress = myParticipant?.progress ?? 0;
              const percent = Math.min(100, Math.round((progress / goal) * 100));
              
              const end = new Date(challenge.endDate);
              const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
              
              const isHighPriority = percent > 50 && percent < 100 && daysLeft <= 3;
              
              if (isHighPriority) {
                return (
                  <div key={challenge.id} className="rounded-xl p-md md:p-lg flex flex-col gap-md relative overflow-hidden" style={{ ...styles.glassPanel, ...styles.glowOrange }}>
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-container/10 rounded-full blur-[60px]"></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary-container/20 text-primary-container px-2 py-0.5 rounded text-[10px] font-label-bold uppercase border border-primary-container/30">{challenge.type}</span>
                          <span className="text-on-surface-variant text-[12px] font-label-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {daysLeft} Days Left</span>
                        </div>
                        <h3 className="font-h2 text-h2 text-on-surface truncate max-w-[200px] sm:max-w-xs">{challenge.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className="block text-h1 font-h1 text-primary-container">{percent}%</span>
                        <span className="text-sm font-label-bold text-on-surface-variant">Completed</span>
                      </div>
                    </div>
                    <div className="z-10 mt-auto pt-4">
                      <div className="flex justify-between text-sm font-label-bold mb-xs text-white/80">
                        <span>{progress} {metric}</span>
                        <span>{goal} Goal</span>
                      </div>
                      <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden w-full">
                        <div className="h-full rounded-r-full relative transition-all duration-1000" style={{ width: `${percent}%`, ...styles.progressFillOrange }}>
                          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                        </div>
                      </div>
                    </div>
                    <div className="z-10 flex justify-between items-center border-t border-white/10 pt-sm mt-sm">
                      <span className="text-sm font-label-bold text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">group</span> {challenge._count?.participants || 0} participants
                      </span>
                      <button className="bg-surface-container-high border border-white/10 hover:border-primary-container/50 text-white px-4 py-2 rounded font-label-bold text-sm transition-all">Log Activity</button>
                    </div>
                  </div>
                );
              }

              // Normal Card
              return (
                <div key={challenge.id} className="rounded-xl p-md border border-white/10 flex flex-col gap-md relative overflow-hidden group" style={styles.cardGradient}>
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-label-bold uppercase border border-secondary/20">{challenge.type}</span>
                        <span className="text-on-surface-variant text-[12px] font-label-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {daysLeft} Days Left</span>
                      </div>
                      <h3 className="font-h3 text-h3 text-on-surface truncate max-w-[200px] sm:max-w-[280px]">{challenge.title}</h3>
                    </div>
                    <span className="material-symbols-outlined text-zinc-600 group-hover:text-secondary transition-colors text-3xl">{challenge.type === 'pack' ? 'fitness_center' : 'bolt'}</span>
                  </div>
                  <div className="z-10 mt-auto pt-4">
                    <div className="flex justify-between text-sm font-label-bold mb-xs text-white/80">
                      <span>{progress} {metric}</span>
                      <span>{goal} Goal</span>
                    </div>
                    <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden w-full">
                      <div className="h-full rounded-r-full relative transition-all duration-1000" style={{ width: `${percent}%`, ...styles.progressFillBlue }}></div>
                    </div>
                  </div>
                  <div className="z-10 flex justify-between items-center border-t border-white/5 pt-sm mt-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">leaderboard</span>
                      <span className="font-label-bold text-[12px]">View Standings ({challenge._count?.participants || 0} members)</span>
                    </div>
                    <button className="text-secondary font-label-bold text-sm hover:text-white transition-colors">Log</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
