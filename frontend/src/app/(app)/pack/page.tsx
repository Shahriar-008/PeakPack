'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Link2, UserMinus, Crown, Plus } from 'lucide-react';
import { packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { useSockets } from '@/hooks/useSocket';
import { PageShell } from '@/components/layout';
import { Button, Card, Badge, Spinner, Avatar, Modal, Input, Textarea } from '@/components/ui';
import { StreakCounter, LevelBadge } from '@/components/gamification';
import { CheckInCard, TodayCheckInCard } from '@/components/checkin';
import { CheckInModal } from '@/components/checkin';
import { cn, timeAgo } from '@/lib/utils';
import type { CheckIn, PackMember, CheckInResponse } from '@/types';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      aria-label="Copy invite link"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy invite'}
    </button>
  );
}

function MemberCard({ member, isAdmin, currentUserId, packId, onKick }: {
  member: PackMember & { user: any; checkedInToday?: boolean };
  isAdmin: boolean;
  currentUserId: string;
  packId: string;
  onKick: (userId: string) => void;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-2xl border transition-all',
      member.user.id === currentUserId
        ? 'border-indigo-500/20 bg-indigo-500/5'
        : 'border-white/6 bg-[rgb(var(--card))]'
    )}>
      <div className="relative">
        <Avatar src={member.user.avatarKey} name={member.user.name} size="md" />
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--card))]',
          member.checkedInToday ? 'bg-emerald-500' : 'bg-gray-600'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate">{member.user.name}</span>
          {member.role === 'admin' && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
          <LevelBadge level={member.user.level} size="xs" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <StreakCounter streak={member.user.streak} size="sm" />
          <span className="text-[10px] text-[rgb(var(--muted-foreground))]">
            {member.checkedInToday ? '✅ Checked in' : '⏳ Not yet'}
          </span>
        </div>
      </div>
      {isAdmin && member.user.id !== currentUserId && (
        <button
          onClick={() => onKick(member.user.id)}
          className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
          aria-label={`Remove ${member.user.name}`}
        >
          <UserMinus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function CreatePackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [goal, setGoal] = useState('custom');

  const { mutate, isPending } = useMutation({
    mutationFn: () => packsApi.create({ name, description: desc || undefined, goalType: goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pack'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Pack">
      <div className="space-y-4">
        <Input label="Pack Name" id="new-pack-name" placeholder="The Grindset" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Description" id="new-pack-desc" rows={2} placeholder="What's your pack about?" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Button className="w-full" loading={isPending} disabled={!name} onClick={() => mutate()}>
          Create Pack 🔥
        </Button>
      </div>
    </Modal>
  );
}

function JoinPackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => packsApi.join(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pack'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Join a Pack">
      <div className="space-y-4">
        <Input label="Invite Code" id="join-code" placeholder="abc12345" value={code} onChange={(e) => setCode(e.target.value)} />
        {error && <p className="text-sm text-red-400">{(error as any)?.response?.data?.error?.message}</p>}
        <Button className="w-full" loading={isPending} disabled={!code} onClick={() => mutate()}>
          Join Pack
        </Button>
      </div>
    </Modal>
  );
}

export default function PackPage() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [showJoin, setShowJoin]       = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: myPack, isLoading: loadingPack } = useQuery({
    queryKey: ['my-pack'],
    queryFn: packsApi.getMine,
    retry: false,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['pack-members', myPack?.id],
    queryFn: () => packsApi.getMembers(myPack!.id),
    enabled: !!myPack?.id,
  });

  const { data: todayCheckIn } = useQuery({
    queryKey: ['checkin-today'],
    queryFn: () => import('@/lib/api').then(m => m.checkinsApi.getToday()),
  });

  const {
    data: feedPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['pack-feed', myPack?.id],
    queryFn: ({ pageParam = 1 }) => packsApi.getFeed(myPack!.id, pageParam, 20),
    getNextPageParam: (last: any) => last.pagination?.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!myPack?.id,
  });

  const allFeed: CheckIn[] = feedPages?.pages.flatMap((p: any) => p.data) ?? [];

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasNextPage) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage();
    });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Real-time: prepend new check-ins
  useSockets({
    onNewCheckIn: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['pack-feed', myPack?.id] });
    }, [queryClient, myPack?.id]),
  });

  const { mutate: kick } = useMutation({
    mutationFn: (userId: string) => packsApi.removeMember(myPack!.id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pack-members', myPack?.id] }),
  });

  const isAdmin = myPack?.adminId === user?.id;
  const inviteUrl = myPack ? `${window?.location?.origin}/join/${myPack.inviteCode}` : '';

  if (loadingPack) {
    return <PageShell><div className="flex justify-center py-24"><Spinner className="w-8 h-8" /></div></PageShell>;
  }

  // ── No pack ───────────────────────────────────────────────
  if (!myPack) {
    return (
      <PageShell>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2">You're not in a Pack</h1>
          <p className="text-[rgb(var(--muted-foreground))] mb-8 max-w-xs mx-auto text-sm">
            Accountability is better together. Create or join a Pack to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create Pack
            </Button>
            <Button variant="secondary" onClick={() => setShowJoin(true)}>
              <Link2 className="w-4 h-4" /> Join with Code
            </Button>
          </div>
        </motion.div>
        <CreatePackModal open={showCreate} onClose={() => setShowCreate(false)} />
        <JoinPackModal open={showJoin}  onClose={() => setShowJoin(false)}  />
      </PageShell>
    );
  }

  // ── Pack view ─────────────────────────────────────────────
  return (
    <PageShell>
      {/* Pack Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 to-violet-500/8 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black">{myPack.name}</h1>
                <Badge variant="level">🔥 {myPack.packStreak} streak</Badge>
              </div>
              {myPack.description && (
                <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">{myPack.description}</p>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[rgb(var(--muted-foreground))]">
                  <Users className="inline w-3.5 h-3.5 mr-1" />
                  {members.length} members
                </span>
                <CopyButton text={inviteUrl} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's check-in */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-5">
        <TodayCheckInCard checkIn={(todayCheckIn as any) ?? null} onCheckIn={() => setShowCheckIn(true)} />
      </motion.div>

      {/* Members Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-5">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" /> Members
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(members as any[]).map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              isAdmin={isAdmin}
              currentUserId={user?.id ?? ''}
              packId={myPack.id}
              onKick={kick}
            />
          ))}
        </div>
      </motion.div>

      {/* Feed */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-bold mb-3">Pack Activity</h2>
        {allFeed.length === 0 && (
          <div className="text-center py-10 text-[rgb(var(--muted-foreground))] text-sm">
            No check-ins yet today. Be the first!
          </div>
        )}
        <div className="space-y-3">
          {allFeed.map((ci) => (
            <CheckInCard key={ci.id} checkIn={ci} currentUserId={user?.id} />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="py-4 flex justify-center">
          {isFetchingNextPage && <Spinner />}
        </div>
      </motion.div>

      <CheckInModal open={showCheckIn} onClose={() => setShowCheckIn(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['checkin-today'] })} />
      <CreatePackModal open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinPackModal open={showJoin}   onClose={() => setShowJoin(false)}  />
    </PageShell>
  );
}
