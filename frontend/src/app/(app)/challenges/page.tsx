'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Swords, Plus, Clock, Users, Target, ChevronRight } from 'lucide-react';
import { challengesApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { PageShell } from '@/components/layout';
import { Button, Card, Badge, Spinner, Modal, Input, Textarea, Tabs } from '@/components/ui';
import { ProgressBar } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Challenge, GoalType } from '@/types';

const TABS = [
  { id: 'active',    label: 'Active'    },
  { id: 'personal',  label: 'Personal'  },
  { id: 'community', label: 'Community' },
];

const GOAL_PRESETS = [
  { metric: 'workouts:7',      label: '7 Workouts',        emoji: '🏋️' },
  { metric: 'workouts:30',     label: '30 Workouts',       emoji: '💪' },
  { metric: 'clean_meals:14',  label: '14 Clean Meals',    emoji: '🥗' },
  { metric: 'checkins:7',      label: '7-Day Streak',      emoji: '🔥' },
  { metric: 'combined_xp:1000', label: '1,000 XP',        emoji: '⚡' },
];

function ChallengeCard({ challenge, onJoin }: { challenge: Challenge; onJoin: (id: string) => void }) {
  const user = useUserStore((s) => s.user);
  const end  = new Date(challenge.endDate);
  const now  = new Date();
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  const isActive = now < end && now >= new Date(challenge.startDate);
  const myParticipant = challenge.participants?.find((p: any) => p.userId === user?.id);
  const [metric, goal] = (challenge.goalMetric || ':1').split(':');
  const progress = myParticipant ? Math.min(1, (myParticipant.progress ?? 0) / (Number(goal) || 1)) : 0;

  return (
    <Card className="p-5 hover:border-indigo-500/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={challenge.type === 'personal' ? 'level' : challenge.type === 'pack' ? 'success' : 'warning'}>
              {challenge.type}
            </Badge>
            {myParticipant?.completed && <Badge variant="success">✅ Completed</Badge>}
            {!isActive && <Badge variant="danger">Ended</Badge>}
          </div>
          <h3 className="font-bold text-sm leading-snug">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1 line-clamp-2">{challenge.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted-foreground))] mb-4">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{daysLeft}d left</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{challenge._count?.participants ?? 0}</span>
        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />{challenge.goalMetric}</span>
      </div>

      {myParticipant && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[rgb(var(--muted-foreground))]">Your progress</span>
            <span className="font-semibold text-indigo-400">{myParticipant.progress} / {goal}</span>
          </div>
          <ProgressBar value={progress} color={myParticipant.completed ? 'emerald' : 'indigo'} />
        </div>
      )}

      {!myParticipant && isActive && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => onJoin(challenge.id)}>
          Join Challenge <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </Card>
  );
}

function CreateChallengeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle]     = useState('');
  const [desc, setDesc]       = useState('');
  const [metric, setMetric]   = useState('');
  const [type, setType]       = useState<'personal' | 'pack' | 'community'>('personal');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd]     = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => challengesApi.create({
      title,
      description: desc || undefined,
      goalMetric: metric,
      type,
      startDate: new Date(startDate).toISOString(),
      endDate:   new Date(endDate).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Challenge" size="md">
      <div className="space-y-4">
        <Input label="Title" id="chal-title" placeholder="30-Day Grind" value={title} onChange={(e) => setTitle(e.target.value)} />

        {/* Type selector */}
        <div>
          <p className="text-sm font-medium mb-2">Type</p>
          <div className="flex gap-2">
            {(['personal', 'pack', 'community'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-medium transition-all capitalize',
                  type === t ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-400' : 'border-white/8 text-[rgb(var(--muted-foreground))]'
                )}
              >{t}</button>
            ))}
          </div>
        </div>

        {/* Goal metric presets */}
        <div>
          <p className="text-sm font-medium mb-2">Goal Preset</p>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_PRESETS.map(({ metric: m, label, emoji }) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  'flex flex-col items-center p-2 rounded-xl border text-xs transition-all',
                  metric === m ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-400' : 'border-white/8 text-[rgb(var(--muted-foreground))]'
                )}
              >
                <span className="text-xl mb-1">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
          <Input
            label="Or custom metric"
            id="chal-metric"
            placeholder="workouts:14"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="mt-2"
          />
        </div>

        <Textarea label="Description (optional)" id="chal-desc" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" id="chal-start" type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
          <Input label="End Date"   id="chal-end"   type="date" value={endDate}   onChange={(e) => setEnd(e.target.value)} />
        </div>

        <Button
          className="w-full"
          loading={isPending}
          disabled={!title || !metric || !startDate || !endDate}
          onClick={() => mutate()}
        >
          Create Challenge 🔥
        </Button>
      </div>
    </Modal>
  );
}

export default function ChallengesPage() {
  const [tab, setTab]         = useState('active');
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll(),
  });

  const { mutate: join } = useMutation({
    mutationFn: (id: string) => challengesApi.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const now = new Date();
  const filtered = challenges.filter((c: Challenge) => {
    if (tab === 'active')    return new Date(c.startDate) <= now && new Date(c.endDate) >= now;
    if (tab === 'personal')  return c.type === 'personal';
    if (tab === 'community') return c.type === 'community';
    return true;
  });

  return (
    <PageShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Swords className="w-6 h-6 text-indigo-400" /> Challenges
          </h1>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">Complete goals and earn bonus XP.</p>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-5" />

      {isLoading && <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-[rgb(var(--muted-foreground))]">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No challenges here</p>
          <p className="text-sm mt-1">Create one to get started.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((c: Challenge) => (
          <ChallengeCard key={c.id} challenge={c} onJoin={join} />
        ))}
      </div>

      <CreateChallengeModal open={creating} onClose={() => setCreating(false)} />
    </PageShell>
  );
}
