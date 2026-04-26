'use client';

// ══════════════════════════════════════════════════════════════
// PeakPack — Layout Components (Navbar, Sidebar, PageShell)
// ══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Trophy, Swords, User,
  Bell, LogOut, Mountain, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { authApi, setAccessToken, setRefreshToken } from '@/lib/api';
import { StreakCounter } from '@/components/gamification';
import { Avatar } from '@/components/ui';

// ── Nav items ─────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/pack',        label: 'Pack',         icon: Users },
  { href: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
  { href: '/challenges',  label: 'Challenges',   icon: Swords },
  { href: '/profile',     label: 'Profile',      icon: User },
];

// ── Top Navbar (mobile + tablet) ──────────────────────────────

export function Navbar({ notifCount = 0 }: { notifCount?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useUserStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    setAccessToken(null);
    setRefreshToken(null);
    logout();
    router.push('/sign-in');
  };

  return (
    <>
      {/* ── Top Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(10,10,14,0.85)] backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-black text-lg">
            <Mountain className="w-5 h-5 text-indigo-400" />
            <span className="gradient-text">PeakPack</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user && <StreakCounter streak={user.streak} size="sm" />}

            {/* Notifications bell */}
            <button className="relative p-2 rounded-lg hover:bg-white/8 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Avatar / menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/8 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/profile" className="hidden lg:block">
              <Avatar src={user?.avatarKey} name={user?.name} size="sm" />
            </Link>
          </div>
        </div>

        {/* ── Desktop Nav ─────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-1 px-4 pb-0 max-w-7xl mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                  active
                    ? 'text-indigo-400'
                    : 'text-[rgb(var(--muted-foreground))] hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── Mobile Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-40 w-72 bg-[rgb(var(--card))] border-l border-white/8 p-6 flex flex-col lg:hidden"
            >
              {/* User info */}
              <div className="flex items-center gap-3 mb-8">
                <Avatar src={user?.avatarKey} name={user?.name} size="md" />
                <div>
                  <p className="font-bold text-sm">{user?.name}</p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))]">{user?.email}</p>
                </div>
              </div>

              {/* Nav links */}
              <div className="flex flex-col gap-1 flex-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          : 'text-[rgb(var(--muted-foreground))] hover:text-white hover:bg-white/8'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav ──────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-white/6 bg-[rgba(10,10,14,0.95)] backdrop-blur-xl px-2 pb-safe-bottom">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  active ? 'text-indigo-400' : 'text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
                {active && (
                  <motion.div layoutId="mobile-nav-dot" className="w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// ── Page Shell ────────────────────────────────────────────────

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn(
      'min-h-screen max-w-4xl mx-auto px-4 pt-6 pb-24 lg:pb-10',
      className
    )}>
      {children}
    </main>
  );
}
