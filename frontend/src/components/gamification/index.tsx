'use client';

// ══════════════════════════════════════════════════════════════
// PeakPack — Gamification Components
// ══════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Lock, Star } from 'lucide-react';
import { cn, getLevelProgress, LEVEL_EMOJIS, LEVEL_COLORS, formatStreak } from '@/lib/utils';
import { ProgressBar } from '@/components/ui';
import type { UserLevel, BadgeDefinition } from '@/types';

// ── XP Toast ─────────────────────────────────────────────────

interface XPToastProps {
  show: boolean;
  xp: number;
  onDone: () => void;
}

export function XPToast({ show, xp, onDone }: XPToastProps) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          key="xp-toast"
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onAnimationComplete={() => {
            setTimeout(onDone, 2200);
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-yellow-500/90 to-amber-500/90 backdrop-blur-xl border border-yellow-400/30 shadow-2xl shadow-yellow-500/30">
            <Zap className="w-4 h-4 text-yellow-100 fill-yellow-100" />
            <span className="text-sm font-black text-white tracking-tight">+{xp} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Level Up Overlay ──────────────────────────────────────────

interface LevelUpOverlayProps {
  show: boolean;
  newLevel: UserLevel;
  previousLevel: UserLevel;
  onDismiss: () => void;
}

export function LevelUpOverlay({ show, newLevel, previousLevel, onDismiss }: LevelUpOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          onClick={onDismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative z-10 text-center px-8"
          >
            {/* Glow rings */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl"
            />

            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-8xl mb-4"
            >
              {LEVEL_EMOJIS[newLevel]}
            </motion.div>

            <p className="text-white/60 text-sm uppercase tracking-[0.2em] mb-2">Level Up!</p>
            <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2">
              {newLevel}
            </h1>
            <p className="text-white/50 text-base">
              {previousLevel} → <span className="text-white font-semibold">{newLevel}</span>
            </p>

            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-8 text-white/30 text-xs"
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Badge Unlock Overlay ──────────────────────────────────────

interface BadgeUnlockOverlayProps {
  show: boolean;
  badge: Pick<BadgeDefinition, 'emoji' | 'name' | 'description'> | null;
  onDismiss: () => void;
}

export function BadgeUnlockOverlay({ show, badge, onDismiss }: BadgeUnlockOverlayProps) {
  return (
    <AnimatePresence>
      {show && badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          onClick={onDismiss}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

          <motion.div
            initial={{ scale: 0.3, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="relative z-10 text-center px-8"
          >
            <p className="text-yellow-400 text-xs uppercase tracking-[0.2em] mb-4 font-bold">
              🎉 Badge Unlocked
            </p>

            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-9xl mb-6"
            >
              {badge.emoji}
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-2">{badge.name}</h2>
            <p className="text-white/50 text-sm max-w-xs">{badge.description}</p>

            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              className="mt-8 text-white/30 text-xs"
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Streak Counter ────────────────────────────────────────────

interface StreakCounterProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakCounter({ streak, size = 'md', className }: StreakCounterProps) {
  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-sm font-bold' },
    md: { icon: 'w-5 h-5', text: 'text-lg font-black' },
    lg: { icon: 'w-7 h-7', text: 'text-3xl font-black' },
  };
  const active = streak > 0;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <motion.div
        animate={active ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Flame
          className={cn(
            sizes[size].icon,
            'transition-colors duration-300',
            active ? 'text-orange-400 fill-orange-400/30' : 'text-gray-600 fill-gray-600/20'
          )}
        />
      </motion.div>
      <span className={cn(sizes[size].text, active ? 'text-orange-400' : 'text-gray-500')}>
        {formatStreak(streak)}
      </span>
    </div>
  );
}

// ── XP Bar ────────────────────────────────────────────────────

interface XPBarProps {
  totalXP: number;
  showLabel?: boolean;
  className?: string;
}

export function XPBar({ totalXP, showLabel = true, className }: XPBarProps) {
  const { currentLevel, nextLevel, nextThreshold, currentThreshold, progress } = getLevelProgress(totalXP);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-[rgb(var(--muted-foreground))]">
          <span className="font-semibold flex items-center gap-1">
            <span>{LEVEL_EMOJIS[currentLevel]}</span>
            <span className={LEVEL_COLORS[currentLevel]}>{currentLevel}</span>
          </span>
          {nextLevel && (
            <span>
              {totalXP - currentThreshold}/{nextThreshold! - currentThreshold} XP
              <span className="ml-1 text-[rgb(var(--muted-foreground))]/50">to {nextLevel}</span>
            </span>
          )}
        </div>
      )}
      <ProgressBar value={progress} color="indigo" />
    </div>
  );
}

// ── Level Badge ───────────────────────────────────────────────

interface LevelBadgeProps {
  level: UserLevel;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function LevelBadge({ level, size = 'sm', className }: LevelBadgeProps) {
  const sizes = { xs: 'text-xs px-1.5 py-0.5', sm: 'text-xs px-2 py-1', md: 'text-sm px-3 py-1.5' };
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-lg font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
      sizes[size],
      className
    )}>
      {LEVEL_EMOJIS[level]} {level}
    </span>
  );
}

// ── Badge Grid Item ───────────────────────────────────────────

interface BadgeItemProps {
  badge: BadgeDefinition;
  earned?: boolean;
  earnedAt?: string;
}

export function BadgeItem({ badge, earned = false, earnedAt }: BadgeItemProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all',
        earned
          ? 'border-indigo-500/30 bg-indigo-500/5'
          : 'border-white/5 bg-white/2 opacity-40'
      )}
    >
      <div className="relative">
        <span className={cn('text-4xl', !earned && 'grayscale')}>{badge.emoji}</span>
        {!earned && (
          <Lock className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-gray-500 bg-[rgb(var(--card))] rounded-full" />
        )}
        {earned && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <Star className="w-2.5 h-2.5 text-white fill-white" />
          </motion.div>
        )}
      </div>
      <div className="text-center">
        <p className={cn('text-xs font-semibold leading-tight', earned ? 'text-white' : 'text-gray-500')}>{badge.name}</p>
        {earned && earnedAt && (
          <p className="text-[10px] text-indigo-400 mt-0.5">
            {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}
