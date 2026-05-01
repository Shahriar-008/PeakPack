'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';

/**
 * App layout — wraps all protected routes.
 * Redirects to sign-in if not authenticated, onboarding if not completed.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, setUser } = useUserStore();
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      let cancelled = false;

      const recoverSession = async () => {
        setIsRecovering(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session?.user) {
          setIsRecovering(false);
          router.replace('/sign-in');
          return;
        }

        try {
          const syncedUser = await authApi.syncUser(undefined, session.access_token);
          if (cancelled) return;
          setUser(syncedUser);
        } catch {
          if (cancelled) return;
          router.replace('/sign-in');
        } finally {
          if (!cancelled) setIsRecovering(false);
        }
      };

      recoverSession();
      return () => {
        cancelled = true;
      };
    }

    if (!user.onboardingDone) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, user, isLoading, router, setUser]);

  if (isLoading || isRecovering || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-container to-orange-500 flex items-center justify-center shadow-lg shadow-primary-container/30">
            <span className="text-xl">🔥</span>
          </div>
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
