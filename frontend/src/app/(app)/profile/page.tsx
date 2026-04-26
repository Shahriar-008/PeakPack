'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Edit3, Check, X, Shield, Snowflake, Calendar } from 'lucide-react';
import { usersApi, badgesApi, checkinsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { PageShell } from '@/components/layout';
import { Button, Card, Spinner, Input, Textarea } from '@/components/ui';
import { StreakCounter, XPBar, LevelBadge, BadgeItem } from '@/components/gamification';
import { cn, getTodayISO, LEVEL_EMOJIS } from '@/lib/utils';
import type { BadgeDefinition } from '@/types';

export default function ProfilePage() {
  const { user, updateUser }  = useUserStore();
  const queryClient           = useQueryClient();
  const fileRef               = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name ?? '');
  const [bio, setBio]         = useState(user?.bio ?? '');

  const { data: badges = [], isLoading: loadingBadges } = useQuery<BadgeDefinition[]>({
    queryKey: ['badges'],
    queryFn: badgesApi.getAll,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['checkin-history'],
    queryFn: () => checkinsApi.getUserCheckins(user!.id, 30),
    enabled: !!user?.id,
  });

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: () => usersApi.updateMe({ name, bio }),
    onSuccess: (updated) => {
      updateUser(updated);
      setEditing(false);
    },
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
    const ci = (history as any[]).find((c: any) => c.date?.startsWith(dateStr));
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
    done:   'bg-emerald-500',
    rest:   'bg-blue-500',
    missed: 'bg-red-500/50',
    future: 'bg-white/10',
  };

  return (
    <PageShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black mb-6">Profile</h1>

        {/* ── Avatar + Name ───────────────────────────────── */}
        <Card className="p-5 mb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                {user?.avatarKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarKey} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-[rgb(var(--card))] hover:bg-indigo-400 transition-colors"
                aria-label="Change avatar"
              >
                {uploading ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-white" />
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

            {/* Name / Bio */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    id="profile-name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Textarea
                    id="profile-bio"
                    placeholder="Your bio…"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" loading={saving} onClick={() => saveProfile()}>
                      <Check className="w-3.5 h-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(user?.name ?? ''); setBio(user?.bio ?? ''); }}>
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-black text-lg leading-tight">{user?.name}</h2>
                      {user?.level && <LevelBadge level={user.level} size="sm" className="mt-1" />}
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-[rgb(var(--muted-foreground))] hover:text-white transition-colors p-1"
                      aria-label="Edit profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  {user?.bio && <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">{user.bio}</p>}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* ── Stats Row ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-4 flex flex-col items-center gap-1">
            <StreakCounter streak={user?.streak ?? 0} size="md" />
            <span className="text-xs text-[rgb(var(--muted-foreground))]">Day Streak</span>
          </Card>
          <Card className="p-4 flex flex-col items-center gap-1">
            <span className="text-2xl font-black text-yellow-400">{user?.xp?.toLocaleString()}</span>
            <span className="text-xs text-[rgb(var(--muted-foreground))]">Total XP</span>
          </Card>
          <Card className="p-4 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <Snowflake className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-black text-blue-400">{user?.streakFreezes ?? 0}</span>
            </div>
            <span className="text-xs text-[rgb(var(--muted-foreground))]">Streak Shields</span>
          </Card>
        </div>

        {/* ── XP Progress ─────────────────────────────────── */}
        <Card className="p-5 mb-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            {user?.level && LEVEL_EMOJIS[user.level]} Level Progress
          </h3>
          <XPBar totalXP={user?.xp ?? 0} />
        </Card>

        {/* ── Check-In History ─────────────────────────────── */}
        <Card className="p-5 mb-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Last 14 Days
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {last14.map(({ date, status }) => (
              <div
                key={date}
                title={`${date}: ${status}`}
                className={cn('w-6 h-6 rounded-md', DOT_COLORS[status])}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-[rgb(var(--muted-foreground))]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Workout</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Rest</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/50" /> Missed</span>
          </div>
        </Card>

        {/* ── Badges ──────────────────────────────────────── */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" /> Badges
          </h3>
          {loadingBadges ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {badges.map((badge: BadgeDefinition) => (
                <BadgeItem
                  key={badge.key}
                  badge={badge}
                  earned={badge.earned ?? false}
                  earnedAt={badge.earnedAt}
                />
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </PageShell>
  );
}
