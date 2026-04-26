'use client';

// ══════════════════════════════════════════════════════════════
// PeakPack — Check-In Components (Modal + Card)
// ══════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dumbbell, BedDouble, X as XIcon, Camera, Flame,
  ChevronRight, CheckCircle2, Clock,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { checkinsApi } from '@/lib/api';
import { Button, Avatar, Card } from '@/components/ui';
import { StreakCounter, LevelBadge, XPToast } from '@/components/gamification';
import type { CheckIn, CheckInResponse, Reaction, ReactionType } from '@/types';

// ── Workout types ─────────────────────────────────────────────

const WORKOUT_TYPES = [
  { key: 'gym',      label: 'Gym',      emoji: '🏋️' },
  { key: 'run',      label: 'Run',      emoji: '🏃' },
  { key: 'cycling',  label: 'Cycling',  emoji: '🚴' },
  { key: 'swimming', label: 'Swimming', emoji: '🏊' },
  { key: 'hiit',     label: 'HIIT',     emoji: '⚡' },
  { key: 'yoga',     label: 'Yoga',     emoji: '🧘' },
  { key: 'walk',     label: 'Walk',     emoji: '🚶' },
  { key: 'other',    label: 'Other',    emoji: '🎯' },
];

const MEAL_OPTIONS = [
  { key: 'clean', label: 'Clean', emoji: '🥗', color: 'emerald' },
  { key: 'cheat', label: 'Cheat', emoji: '🍕', color: 'orange' },
  { key: 'skip',  label: 'Skip',  emoji: '⏭️', color: 'gray' },
] as const;

// ── Check-In Modal ────────────────────────────────────────────

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: CheckInResponse) => void;
}

export function CheckInModal({ open, onClose, onSuccess }: CheckInModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [workoutChoice, setWorkoutChoice] = useState<'workout' | 'rest' | 'skip' | null>(null);
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [mealType, setMealType] = useState<'clean' | 'cheat' | 'skip' | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        workoutDone: workoutChoice === 'workout',
        workoutType: workoutChoice === 'workout' ? (workoutType ?? undefined) : undefined,
        workoutDurationMins: workoutChoice === 'workout' ? duration : undefined,
        mealType: mealType ?? undefined,
        isRestDay: workoutChoice === 'rest',
      };
      const result = await checkinsApi.create(payload);

      // Upload photo if selected
      if (photo && result.checkin?.id) {
        await checkinsApi.uploadPhoto(result.checkin.id, photo);
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] });
      queryClient.invalidateQueries({ queryKey: ['pack-feed'] });
      onSuccess(data);
      handleClose();
    },
  });

  const handleClose = () => {
    setStep(1);
    setWorkoutChoice(null);
    setWorkoutType(null);
    setDuration(30);
    setMealType(null);
    setPhoto(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-md bg-[rgb(var(--card))] rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div>
                <h2 className="font-bold text-lg">Daily Check-In</h2>
                <div className="flex gap-1 mt-1">
                  {[1, 2].map((s) => (
                    <div key={s} className={cn('h-1 w-8 rounded-full transition-colors', step >= s ? 'bg-indigo-500' : 'bg-white/10')} />
                  ))}
                </div>
              </div>
              <button onClick={handleClose} className="text-[rgb(var(--muted-foreground))] hover:text-white transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* ── Step 1: Workout ──────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 space-y-5"
                >
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">How did today's workout go?</p>

                  {/* Workout choice */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'workout', label: '💪 Worked Out', color: 'indigo' },
                      { key: 'rest',    label: '😴 Rest Day',   color: 'emerald' },
                      { key: 'skip',    label: '❌ Skipped',    color: 'red' },
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => setWorkoutChoice(key as typeof workoutChoice)}
                        className={cn(
                          'p-3 rounded-xl border text-sm font-semibold text-center transition-all',
                          workoutChoice === key
                            ? `border-${color}-500/50 bg-${color}-500/15 text-${color}-400`
                            : 'border-white/8 text-[rgb(var(--muted-foreground))] hover:border-white/20'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Workout type + duration */}
                  <AnimatePresence>
                    {workoutChoice === 'workout' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2 font-medium">Workout Type</p>
                          <div className="grid grid-cols-4 gap-2">
                            {WORKOUT_TYPES.map(({ key, label, emoji }) => (
                              <button
                                key={key}
                                onClick={() => setWorkoutType(key)}
                                className={cn(
                                  'flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all',
                                  workoutType === key
                                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-400'
                                    : 'border-white/8 text-[rgb(var(--muted-foreground))] hover:border-white/20'
                                )}
                              >
                                <span className="text-xl">{emoji}</span>
                                <span>{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2 font-medium">
                            Duration: <span className="text-white font-bold">{duration} min</span>
                          </p>
                          <input
                            type="range" min={5} max={180} step={5}
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    className="w-full"
                    disabled={!workoutChoice}
                    onClick={() => setStep(2)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 2: Meals ────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 space-y-5"
                >
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">How was your nutrition today?</p>

                  <div className="grid grid-cols-3 gap-3">
                    {MEAL_OPTIONS.map(({ key, label, emoji, color }) => (
                      <button
                        key={key}
                        onClick={() => setMealType(key)}
                        className={cn(
                          'p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2',
                          mealType === key
                            ? `border-${color}-500/50 bg-${color}-500/15 text-${color}-400`
                            : 'border-white/8 text-[rgb(var(--muted-foreground))] hover:border-white/20'
                        )}
                      >
                        <span className="text-3xl">{emoji}</span>
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Photo upload */}
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-sm text-[rgb(var(--muted-foreground))] hover:border-white/30 hover:text-white transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      {photo ? `📸 ${photo.name}` : 'Add progress photo (optional)'}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button
                      className="flex-1"
                      loading={isPending}
                      disabled={!mealType}
                      onClick={() => mutate()}
                    >
                      Check In 🔥
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Check-In Card (Pack Feed) ─────────────────────────────────

interface CheckInCardProps {
  checkIn: CheckIn;
  currentUserId?: string;
  onReact?: (checkInId: string, type: ReactionType) => void;
}

const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'fire',   emoji: '🔥', label: 'Fire'   },
  { type: 'strong', emoji: '💪', label: 'Strong'  },
  { type: 'letsgo', emoji: '🚀', label: "Let's Go" },
];

export function CheckInCard({ checkIn, currentUserId, onReact }: CheckInCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { mutate: react, isPending: reacting } = useMutation({
    mutationFn: ({ type }: { type: ReactionType }) =>
      checkinsApi.react(checkIn.id, type),
    onMutate: () => {},
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pack-feed'] }),
  });

  const { mutate: addComment, isPending: commenting } = useMutation({
    mutationFn: () => checkinsApi.comment(checkIn.id, comment),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['pack-feed'] });
    },
  });

  const getReactionCount = (type: ReactionType) =>
    (checkIn.reactions || []).filter((r: Reaction) => r.type === type).length;

  const hasReacted = (type: ReactionType) =>
    (checkIn.reactions || []).some((r: Reaction) => r.type === type && r.userId === currentUserId);

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* User row */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar src={checkIn.user?.avatarKey} name={checkIn.user?.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{checkIn.user?.name}</span>
              {checkIn.user?.level && <LevelBadge level={checkIn.user.level} size="xs" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                {timeAgo(checkIn.createdAt)}
              </span>
              {checkIn.user != null && checkIn.user.streak > 0 && (
                <StreakCounter streak={checkIn.user.streak} size="sm" />
              )}

            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
              +{checkIn.xpEarned} XP
            </span>
          </div>
        </div>

        {/* Check-in summary */}
        <div className="flex flex-wrap gap-2 mb-3">
          {checkIn.workoutDone && (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <Dumbbell className="w-3.5 h-3.5" />
              {checkIn.workoutType || 'Workout'}
              {checkIn.workoutDurationMins && (
                <><Clock className="w-3 h-3 ml-1" />{checkIn.workoutDurationMins}m</>
              )}
            </span>
          )}
          {checkIn.isRestDay && (
            <span className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20">
              <BedDouble className="w-3.5 h-3.5" /> Rest Day
            </span>
          )}
          {checkIn.mealType === 'clean' && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">🥗 Clean</span>
          )}
          {checkIn.mealType === 'cheat' && (
            <span className="text-xs bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/20">🍕 Cheat</span>
          )}
        </div>

        {/* Photo */}
        {checkIn.photoKey && (
          <div className="rounded-xl overflow-hidden mb-3 aspect-video bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={checkIn.photoKey} alt="Progress photo" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Reaction Bar */}
        <div className="flex items-center gap-2">
          {REACTION_CONFIG.map(({ type, emoji }) => {
            const count = getReactionCount(type);
            const reacted = hasReacted(type);
            return (
              <button
                key={type}
                onClick={() => onReact?.(checkIn.id, type) ?? react({ type })}
                disabled={reacting || checkIn.userId === currentUserId}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all active:scale-90',
                  reacted
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                    : 'bg-white/5 border border-white/8 text-[rgb(var(--muted-foreground))] hover:border-white/20 hover:text-white'
                )}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="text-xs font-semibold">{count}</span>}
              </button>
            );
          })}

          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-xs text-[rgb(var(--muted-foreground))] hover:text-white transition-colors"
          >
            {checkIn._count?.comments ?? checkIn.comments?.length ?? 0} comments
          </button>
        </div>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/6 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {(checkIn.comments || []).map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar src={c.user?.avatarKey} name={c.user?.name} size="xs" />
                  <div className="bg-white/5 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-indigo-400 mb-0.5">{c.user?.name}</p>
                    <p className="text-sm text-[rgb(var(--foreground))]">{c.content}</p>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) addComment(); }}
                  placeholder="Add a comment…"
                  maxLength={200}
                  className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addComment()}
                  loading={commenting}
                  disabled={!comment.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ── Today's Check-In Summary Card ─────────────────────────────

interface TodayCheckInProps {
  checkIn: CheckIn | null;
  onCheckIn: () => void;
}

export function TodayCheckInCard({ checkIn, onCheckIn }: TodayCheckInProps) {
  if (!checkIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-5"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">Today</p>
        <h3 className="text-lg font-bold mb-1">Not checked in yet</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
          Log your workout and nutrition to earn XP and keep your streak alive.
        </p>
        <Button onClick={onCheckIn}>
          <Flame className="w-4 h-4" /> Check In Now
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Today</p>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold">Done</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {checkIn.workoutDone && (
          <span className="text-sm bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20">
            💪 {checkIn.workoutType || 'Workout'}
          </span>
        )}
        {checkIn.isRestDay && <span className="text-sm text-blue-300 bg-blue-500/15 px-3 py-1 rounded-full border border-blue-500/20">😴 Rest</span>}
        {checkIn.mealType === 'clean' && <span className="text-sm text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20">🥗 Clean</span>}
        {checkIn.mealType === 'cheat' && <span className="text-sm text-orange-300 bg-orange-500/15 px-3 py-1 rounded-full border border-orange-500/20">🍕 Cheat</span>}
        <span className="text-sm text-yellow-300 bg-yellow-500/15 px-3 py-1 rounded-full border border-yellow-500/20">+{checkIn.xpEarned} XP</span>
      </div>
    </motion.div>
  );
}
