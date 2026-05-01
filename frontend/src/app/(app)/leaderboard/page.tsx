'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import type { LeaderboardEntry } from '@/types';

// ── Custom Styles ──
const styles = {
  innerFireBg: { background: 'radial-gradient(circle at top, rgba(255, 90, 31, 0.15) 0%, rgba(19, 19, 19, 1) 50%)' },
  cardSurface: { background: 'linear-gradient(135deg, #1A1A1A 0%, #121212 100%)', boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)' },
  podium1: { background: 'linear-gradient(180deg, rgba(255, 90, 31, 0.2) 0%, rgba(26, 26, 26, 0.8) 100%)', boxShadow: 'inset 0 2px 0 0 rgba(255, 90, 31, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' },
  podium2: { background: 'linear-gradient(180deg, rgba(173, 198, 255, 0.1) 0%, rgba(26, 26, 26, 0.8) 100%)', boxShadow: 'inset 0 2px 0 0 rgba(173, 198, 255, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' },
  highlightRow: { background: 'linear-gradient(90deg, rgba(255, 90, 31, 0.1) 0%, rgba(26, 26, 26, 0) 100%)', boxShadow: 'inset 2px 0 0 0 #ff5a1f, inset 0 1px 0 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)' }
};

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

  const d = Math.floor(msUntilMonday / (1000 * 60 * 60 * 24));
  const h = Math.floor((msUntilMonday % (1000 * 60 * 60 * 24)) / 3600000);

  return (
    <div className="flex items-center gap-xs bg-surface-container-low border border-white/10 px-4 py-2 rounded-lg" style={styles.cardSurface}>
      <span className="material-symbols-outlined text-tertiary text-[18px]">timer</span>
      <span className="font-label-bold text-label-bold text-tertiary uppercase tracking-wider">Resets in {d}d {h}h</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'pack' | 'global'>('pack');
  const { user } = useUserStore();

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

  const entries: LeaderboardEntry[] = tab === 'pack' ? (packLeaderboard ?? []) : (globalLeaderboard ?? []);
  const isLoading = tab === 'pack' ? loadingPack : loadingGlobal;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Safe accessors for top 3
  const rank1 = top3.length > 0 ? top3[0] : null;
  const rank2 = top3.length > 1 ? top3[1] : null;
  const rank3 = top3.length > 2 ? top3[2] : null;

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-margin pt-lg md:pt-xl pb-24 md:pb-xl flex flex-col gap-lg min-h-screen text-on-background" style={styles.innerFireBg}>
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-white mb-xs uppercase tracking-tighter">Leaderboard</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Prove your dominance. Weekly reset.</p>
        </div>
        <div className="flex items-center gap-md flex-wrap">
          <div className="flex bg-surface-container-high rounded-full p-1 border border-white/10">
            <button 
              onClick={() => setTab('pack')}
              className={`px-6 py-2 rounded-full font-label-bold text-label-bold transition-colors ${tab === 'pack' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-white'}`}
            >
              My Pack
            </button>
            <button 
              onClick={() => setTab('global')}
              className={`px-6 py-2 rounded-full font-label-bold text-label-bold transition-colors ${tab === 'global' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-white'}`}
            >
              Global
            </button>
          </div>
          <ResetTimer />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <p className="font-h3 text-xl mb-2">No rankings yet</p>
          <p className="font-body-md">Check in to earn XP and claim your spot!</p>
        </div>
      ) : (
        <>
          {/* Podium Section */}
          <div className="flex flex-col gap-md pt-lg">
            <h2 className="font-h3 text-h3 text-white uppercase text-center hidden md:block">Top Performers</h2>
            <div className="flex items-end justify-center gap-4 md:gap-8 min-h-[300px]">
              
              {/* Rank 2 */}
              {rank2 && (
                <div className="flex flex-col items-center w-24 md:w-32 animate-[fadeIn_0.5s_ease-out]">
                  <div className="relative mb-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-secondary p-[2px] bg-background relative z-10">
                      {rank2.avatarKey ? (
                        <img alt="Avatar" className="w-full h-full rounded-full object-cover" src={rank2.avatarKey} />
                      ) : (
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-h3 text-secondary">{rank2.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary font-label-bold text-label-bold px-2 py-0.5 rounded-full z-20 shadow-[0_0_10px_rgba(173,198,255,0.5)]">
                      #2
                    </div>
                  </div>
                  <span className="font-label-bold text-label-bold text-white mb-xs truncate w-full text-center">{rank2.name}</span>
                  <span className="font-body-md text-[12px] text-secondary">{rank2.level}</span>
                  <div className="w-full h-32 md:h-40 rounded-t-xl mt-sm flex flex-col items-center justify-start pt-md" style={styles.podium2}>
                    <span className="font-h3 text-h3 text-white">{(rank2.weeklyXp / 1000).toFixed(1)}k</span>
                    <span className="font-label-bold text-[10px] text-on-surface-variant uppercase mt-1">XP</span>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {rank1 && (
                <div className="flex flex-col items-center w-28 md:w-40 animate-[fadeIn_0.5s_ease-out_0.2s]">
                  <span className="material-symbols-outlined text-primary-container text-3xl mb-xs" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                  <div className="relative mb-sm">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-primary-container p-[2px] bg-background relative z-10 shadow-[0_0_20px_rgba(255,90,31,0.4)]">
                      {rank1.avatarKey ? (
                        <img alt="Avatar" className="w-full h-full rounded-full object-cover" src={rank1.avatarKey} />
                      ) : (
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-h3 text-primary-container">{rank1.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary-container text-black font-h3 text-label-bold px-4 py-1 rounded-full z-20 border-2 border-background">
                      #1
                    </div>
                  </div>
                  <span className="font-label-bold text-body-lg text-white font-bold mb-xs truncate w-full text-center">{rank1.name}</span>
                  <span className="font-body-md text-[12px] text-primary-container font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_fire_department</span> {rank1.level}
                  </span>
                  <div className="w-full h-40 md:h-56 rounded-t-xl mt-sm flex flex-col items-center justify-start pt-md relative overflow-hidden" style={styles.podium1}>
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-primary-container/10"></div>
                    <span className="font-h2 text-h2 text-white relative z-10">{(rank1.weeklyXp / 1000).toFixed(1)}k</span>
                    <span className="font-label-bold text-[12px] text-primary-container uppercase mt-1 relative z-10">XP</span>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {rank3 && (
                <div className="flex flex-col items-center w-24 md:w-32 animate-[fadeIn_0.5s_ease-out_0.4s]">
                  <div className="relative mb-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-secondary p-[2px] bg-background relative z-10">
                      {rank3.avatarKey ? (
                        <img alt="Avatar" className="w-full h-full rounded-full object-cover" src={rank3.avatarKey} />
                      ) : (
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-h3 text-secondary">{rank3.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface-container-highest text-white font-label-bold text-label-bold px-2 py-0.5 rounded-full z-20 border border-white/20">
                      #3
                    </div>
                  </div>
                  <span className="font-label-bold text-label-bold text-white mb-xs truncate w-full text-center">{rank3.name}</span>
                  <span className="font-body-md text-[12px] text-on-surface-variant">{rank3.level}</span>
                  <div className="w-full h-24 md:h-32 rounded-t-xl mt-sm flex flex-col items-center justify-start pt-md" style={styles.podium2}>
                    <span className="font-h3 text-h3 text-white">{(rank3.weeklyXp / 1000).toFixed(1)}k</span>
                    <span className="font-label-bold text-[10px] text-on-surface-variant uppercase mt-1">XP</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Leaderboard Table */}
          {rest.length > 0 && (
            <div className="rounded-xl overflow-hidden mt-md" style={styles.cardSurface}>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-surface-container/50">
                      <th className="py-4 px-6 font-label-bold text-[12px] uppercase text-on-surface-variant tracking-wider w-16">Rank</th>
                      <th className="py-4 px-6 font-label-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Athlete</th>
                      <th className="py-4 px-6 font-label-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Level</th>
                      <th className="py-4 px-6 font-label-bold text-[12px] uppercase text-on-surface-variant tracking-wider text-right">Weekly XP</th>
                      <th className="py-4 px-6 font-label-bold text-[12px] uppercase text-on-surface-variant tracking-wider text-right w-24">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {rest.map((entry) => {
                      const isMe = entry.userId === user?.id;
                      return (
                        <tr key={entry.userId} className={isMe ? '' : 'border-b border-white/5 hover:bg-white/5 transition-colors'} style={isMe ? styles.highlightRow : {}}>
                          <td className={`py-4 px-6 font-h3 text-[18px] ${isMe ? 'text-primary-container' : 'text-on-surface-variant'}`}>{entry.rank}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {entry.avatarKey ? (
                                  <img alt="User avatar" className={`w-10 h-10 rounded-full object-cover ${isMe ? 'border-primary-container border' : 'border border-white/10'}`} src={entry.avatarKey} />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-label-bold ${isMe ? 'border border-primary-container bg-primary-container/10 text-primary-container' : 'bg-surface-container border border-white/10 text-on-surface-variant'}`}>
                                    {entry.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                {isMe && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-container rounded-full border-2 border-background flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[10px] text-black font-bold">star</span>
                                  </div>
                                )}
                              </div>
                              <span className={`font-label-bold ${isMe ? 'text-primary-container' : 'text-white'}`}>{isMe ? 'You' : entry.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`bg-surface-container px-2 py-1 rounded text-[12px] font-label-bold border ${isMe ? 'text-on-surface-variant border-white/20' : 'text-secondary border-secondary/30'}`}>
                              {entry.level}
                            </span>
                          </td>
                          <td className={`py-4 px-6 text-right font-h3 text-[20px] ${isMe ? 'text-primary-container' : 'text-white'}`}>
                            {entry.weeklyXp.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-right text-on-surface-variant flex items-center justify-end gap-1">
                            <span className={`material-symbols-outlined text-[16px] ${entry.streak > 0 ? (isMe ? 'text-primary-container' : 'text-secondary') : 'text-zinc-600'}`} style={entry.streak > 0 ? { fontVariationSettings: "'FILL' 1" } : {}}>local_fire_department</span> {entry.streak}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
