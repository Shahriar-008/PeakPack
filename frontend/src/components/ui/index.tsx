'use client';

// ══════════════════════════════════════════════════════════════
// PeakPack — UI Primitives
// ══════════════════════════════════════════════════════════════

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

// ── Button ────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))] focus:ring-[rgb(var(--primary))] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';
    const variants = {
      primary:     'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/20',
      secondary:   'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] hover:bg-white/10 border border-white/10',
      ghost:       'text-[rgb(var(--muted-foreground))] hover:text-white hover:bg-white/8',
      destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
      outline:     'border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-white/8',
    };
    const sizes = {
      sm:  'h-8 px-3 text-sm gap-1.5',
      md:  'h-10 px-5 text-sm gap-2',
      lg:  'h-12 px-7 text-base gap-2',
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Input ─────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[rgb(var(--foreground))]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--secondary))] px-4 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))]',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── Card ──────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ glass, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-[rgb(var(--border))]',
        glass
          ? 'bg-[rgba(18,18,24,0.7)] backdrop-blur-xl'
          : 'bg-[rgb(var(--card))]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// ── Badge ─────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'xp' | 'level';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ variant = 'default', className, ...props }: BadgeProps) => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-white/10 text-white/70',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    danger:  'bg-red-500/15 text-red-400 border border-red-500/20',
    xp:      'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    level:   'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

// ── Modal ─────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative z-10 w-full rounded-2xl border border-white/10 bg-[rgb(var(--card))] shadow-2xl',
              sizes[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-5 border-b border-white/8">
                <h2 className="text-lg font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-[rgb(var(--muted-foreground))] hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Spinner ───────────────────────────────────────────────────

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('animate-spin text-indigo-400', className)} />
);

// ── Avatar ────────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar = ({ src, name, size = 'md', className }: AvatarProps) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };
  const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className={cn('rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white', sizes[size], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

// ── Textarea ──────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--secondary))] px-4 py-3 text-sm resize-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ── Tabs ──────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, active, onChange, className }: TabsProps) => (
  <div className={cn('flex gap-1 p-1 bg-[rgb(var(--secondary))] rounded-xl', className)}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
          active === tab.id
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            : 'text-[rgb(var(--muted-foreground))] hover:text-white'
        )}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

// ── Progress Bar ──────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0..1
  className?: string;
  color?: 'indigo' | 'emerald' | 'orange' | 'yellow';
  animated?: boolean;
}

export const ProgressBar = ({ value, className, color = 'indigo', animated = true }: ProgressBarProps) => {
  const colors = {
    indigo:  'from-indigo-500 to-violet-500',
    emerald: 'from-emerald-500 to-teal-500',
    orange:  'from-orange-500 to-amber-500',
    yellow:  'from-yellow-400 to-amber-400',
  };
  return (
    <div className={cn('h-2 rounded-full bg-white/8 overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', colors[color])}
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
};
