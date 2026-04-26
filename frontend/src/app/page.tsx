'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';

/**
 * Root page — redirect to dashboard if authenticated, sign-in otherwise.
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useUserStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.onboardingDone) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, user, router]);

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl font-bold gradient-text">PeakPack</div>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
