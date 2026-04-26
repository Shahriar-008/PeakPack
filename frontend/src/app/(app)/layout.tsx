'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { Navbar } from '@/components/layout';

/**
 * App layout — wraps all protected routes.
 * Redirects to sign-in if not authenticated, onboarding if not completed.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useUserStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/sign-in');
      return;
    }
    if (!user.onboardingDone) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[rgb(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-xl">🏔️</span>
          </div>
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Navbar />
      {children}
    </div>
  );
}

