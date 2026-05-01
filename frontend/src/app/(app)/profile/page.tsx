'use client';

import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, badgesApi, checkinsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { getTodayISO } from '@/lib/utils';
import type { BadgeDefinition, CheckIn } from '@/types';

const badgeToneClasses = [
  { border: 'hover:border-primary-container/50', overlay: 'from-primary/10' },
  { border: 'hover:border-secondary-container/50', overlay: 'from-secondary/10' },
  { border: 'hover:border-tertiary-container/50', overlay: 'from-tertiary/10' },
] as const;

export default function ProfilePage() {
  const { user, updateUser }  = useUserStore();
  const queryClient           = useQueryClient();
  const fileRef               = useRef<HTMLInputElement>(null);

  const { data: badges = [], isLoading: loadingBadges } = useQuery<BadgeDefinition[]>({
    queryKey: ['badges'],
    queryFn: badgesApi.getAll,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['checkin-history'],
    queryFn: () => checkinsApi.getUserCheckins(user!.id, 30),
    enabled: !!user?.id,
  });

  const { mutate: uploadAvatar, isPending: uploading } = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (data) => {
      updateUser({ avatarKey: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  // Build last-14-day check-in dot grid
  const last14: { date: string; status: 'done' | 'rest' | 'missed' | 'future' }[] = [];
  const today = getTodayISO();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const ci = (history as CheckIn[]).find((c) => c.date?.startsWith(dateStr));
    last14.push({
      date: dateStr,
      status: dateStr > today
        ? 'future'
        : ci
          ? (ci.isRestDay ? 'rest' : 'done')
          : 'missed',
    });
  }

  const DOT_COLORS = {
    done:   'bg-tertiary shadow-[0_0_8px_rgba(74,225,118,0.4)]',
    rest:   'bg-secondary shadow-[0_0_8px_rgba(173,198,255,0.4)]',
    missed: 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.4)]',
    future: 'bg-surface-container-highest border border-white/10',
  };

  const xp = user?.xp ?? 0;
  const maxXP = 10000;
  const xpPercent = Math.min((xp / maxXP) * 100, 100);

  return (
    <main className="max-w-7xl mx-auto px-margin md:px-lg pt-lg pb-24 md:pb-xl grid grid-cols-1 md:grid-cols-12 gap-lg text-on-background">
      {/* Profile Header Area */}
      <div className="md:col-span-12 flex flex-col items-center text-center mt-8">
        <div className="relative inline-block group">
          <div className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-surface-container-high shadow-[0_0_30px_rgba(255,90,31,0.3)] bg-gradient-to-br from-[#1A1A1A] to-[#121212] overflow-hidden flex items-center justify-center">
            {user?.avatarKey ? (
              <img src={user.avatarKey} alt="User profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl font-black text-white/20">{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button 
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 bg-surface-container-highest text-on-surface p-2 rounded-full border border-white/10 hover:bg-primary-container hover:text-black transition-colors shadow-lg flex items-center justify-center disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-[20px]">edit</span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>
        <h1 className="font-h1 text-h1 mt-md text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 uppercase">{user?.name || 'Athlete'}</h1>
        <p className="font-body-lg text-body-lg text-secondary-fixed-dim mt-xs">Joined Season 1</p>
      </div>

      {/* Level & Progress Glass Card */}
      <div className="md:col-span-8 md:col-start-3 bg-surface-container-low rounded-xl p-md border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-container/20 to-secondary-container/20 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-md">
          {/* Beast Badge */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-surface-container-highest to-surface border-2 border-primary-container flex items-center justify-center shadow-[0_0_20px_rgba(255,90,31,0.4)] relative">
              <span className="material-symbols-outlined text-[48px] text-primary-container drop-shadow-[0_0_10px_rgba(255,90,31,0.8)]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <div className="absolute -bottom-3 bg-primary-container text-black font-label-bold text-label-bold px-3 py-1 rounded-full uppercase tracking-widest border border-black">
                {user?.level || 'BEAST'}
              </div>
            </div>
          </div>
          {/* XP Bar */}
          <div className="flex-grow w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider">Level Progress</span>
              <span className="font-body-md text-body-md text-zinc-400">{xp.toLocaleString()} / {maxXP.toLocaleString()} XP</span>
            </div>
            {/* Thick Gamified Progress Bar */}
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden border border-white/5 relative">
              <div className="h-full bg-gradient-to-r from-secondary-container to-primary-container rounded-full relative shadow-[0_0_10px_rgba(5,102,217,0.5)] transition-all duration-1000" style={{ width: `${xpPercent}%` }}>
                {/* Glowing leading edge */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[2px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaks & Freeze Bank */}
      <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-md mt-lg">
        <div className="col-span-2 bg-gradient-to-br from-surface-container to-surface border border-white/10 rounded-xl p-md flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 blur-[40px] rounded-full"></div>
          <span className="material-symbols-outlined text-[40px] text-primary-container mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <h3 className="font-h2 text-h2 text-on-surface">{user?.streak || 0} Days</h3>
          <p className="font-label-bold text-label-bold text-zinc-500 uppercase tracking-widest mt-1">Current Streak</p>
        </div>
        <div className="col-span-2 bg-gradient-to-br from-surface-container to-surface border border-white/10 rounded-xl p-md flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[40px] rounded-full"></div>
          <span className="material-symbols-outlined text-[40px] text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>ac_unit</span>
          <h3 className="font-h2 text-h2 text-on-surface">{user?.streakFreezes || 0}</h3>
          <p className="font-label-bold text-label-bold text-zinc-500 uppercase tracking-widest mt-1">Freeze Bank</p>
        </div>

        {/* Check-in History Row */}
        <div className="col-span-2 md:col-span-4 bg-surface-container-low border border-white/10 rounded-xl p-md flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-h3 text-h3 text-on-surface">Activity</h3>
            <span className="font-label-bold text-label-bold text-zinc-500 uppercase">Last 14 Days</span>
          </div>
          <div className="flex gap-2 justify-between items-center w-full">
            {last14.map(({ date, status }, i) => (
              <div key={date} title={`${date}: ${status}`} className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full relative ${DOT_COLORS[status]}`}>
                {i === 13 && status === 'done' && (
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badge Shelf */}
      <div className="md:col-span-12 mt-lg">
        <h2 className="font-h2 text-h2 mb-md border-b border-white/10 pb-xs inline-block">Trophy Room</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-md mt-sm">
          {loadingBadges ? (
            <div className="col-span-3 md:col-span-6 py-10 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
            </div>
          ) : (
            badges.map((badge: BadgeDefinition, index: number) => {
              const earned = badge.earned;
              const tone = badgeToneClasses[index % badgeToneClasses.length];

              if (!earned) {
                // Locked Badge
                return (
                  <div key={badge.key} className="bg-surface border border-white/5 rounded-xl aspect-square flex flex-col items-center justify-center p-sm opacity-50 grayscale">
                    <span className="text-[48px] mb-2">{badge.emoji}</span>
                    <span className="font-label-bold text-[10px] text-center text-zinc-500 uppercase tracking-widest truncate w-full">{badge.name}</span>
                  </div>
                );
              }

              // Earned Badge
              return (
                <div key={badge.key} className={`bg-surface-container border border-white/10 rounded-xl aspect-square flex flex-col items-center justify-center p-sm transition-colors group cursor-pointer relative overflow-hidden ${tone.border}`}>
                  <div className={`absolute inset-0 bg-gradient-to-t to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${tone.overlay}`}></div>
                  <span className={`text-[48px] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] mb-2`}>{badge.emoji}</span>
                  <span className="font-label-bold text-[10px] text-center text-zinc-300 uppercase tracking-widest truncate w-full">{badge.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
