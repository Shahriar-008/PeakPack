'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import { useUserStore } from '@/store/user';

// ── Query Provider ───────────────────────────────────────────

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,       // 30 seconds
            gcTime: 5 * 60 * 1000,      // 5 minutes (formerly cacheTime)
            retry: 2,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ── Auth Provider ────────────────────────────────────────────
// Listens to Supabase auth state changes and syncs with Zustand store.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useUserStore();

  useEffect(() => {
    // Check initial session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          // Sync Prisma user record
          const user = await authApi.syncUser(undefined, session.access_token);
          setUser(user);
        } catch {
          // User record might not exist yet for OAuth — will be created on callback
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    initSession();

    // Listen for auth state changes (sign-in, sign-out, token refresh, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const user = await authApi.syncUser(undefined, session.access_token);
            setUser(user);
          } catch {
            // Will be handled by the page
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
