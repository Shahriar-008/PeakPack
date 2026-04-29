'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import { useUserStore } from '@/store/user';

/**
 * OAuth Callback Page
 *
 * After Google OAuth, Supabase redirects here with auth params in the URL.
 * The Supabase client (with `detectSessionInUrl: true`) automatically
 * exchanges the code/token from the URL and establishes a session.
 *
 * This page waits for that to complete, syncs the Prisma user record,
 * then redirects to the app.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for Supabase to process the OAuth redirect URL.
        // `getSession()` will return the session once the PKCE exchange
        // or implicit flow token parsing is complete.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('OAuth callback error:', error.message);
          router.replace('/sign-in');
          return;
        }

        if (session?.user) {
          // Sync Prisma user record (creates on first OAuth login)
          const user = await authApi.syncUser();
          setUser(user);
          router.replace(user.onboardingDone ? '/dashboard' : '/onboarding');
        } else {
          // No session — Supabase may still be processing.
          // Listen for the auth state change event.
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                try {
                  const user = await authApi.syncUser();
                  setUser(user);
                  router.replace(user.onboardingDone ? '/dashboard' : '/onboarding');
                } catch {
                  router.replace('/sign-in');
                }
                subscription.unsubscribe();
              }
            }
          );

          // Timeout — if nothing happens in 10s, redirect to sign-in
          setTimeout(() => {
            subscription.unsubscribe();
            router.replace('/sign-in');
          }, 10_000);
        }
      } catch (err) {
        console.error('OAuth callback failed:', err);
        router.replace('/sign-in');
      }
    };

    handleCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen bg-[rgb(var(--background))]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-xl">🏔️</span>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Signing you in…</p>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
