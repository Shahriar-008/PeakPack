'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { packsApi } from '@/lib/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function JoinPackPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useUserStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth-required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [packName, setPackName] = useState('');

  useEffect(() => {
    if (authLoading) return;

    // If not logged in, redirect to sign-in with a return URL
    if (!isAuthenticated || !user) {
      setStatus('auth-required');
      // Short delay then redirect — gives user time to see the message
      const timer = setTimeout(() => {
        const returnUrl = encodeURIComponent(`/join/${code}`);
        router.replace(`/sign-in?returnUrl=${returnUrl}`);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Attempt to join the pack
    const joinPack = async () => {
      try {
        const pack = await packsApi.join(code);
        setPackName(pack.name || 'your new Pack');
        setStatus('success');
        // Redirect to pack page after a short celebration
        setTimeout(() => {
          router.replace('/pack');
        }, 2000);
      } catch (err: any) {
        const message =
          err?.response?.data?.error?.message ||
          'Failed to join pack. The invite code may be invalid or the pack may be full.';
        setErrorMessage(message);
        setStatus('error');
      }
    };

    joinPack();
  }, [authLoading, isAuthenticated, user, code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[rgb(var(--background))]">
      <div className="w-full max-w-md space-y-6 p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-2xl">🏔️</span>
          </div>
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Joining Pack…</h1>
            <p className="text-[rgb(var(--muted-foreground))]">
              Invite code: <code className="text-indigo-400 bg-white/5 px-2 py-0.5 rounded">{code}</code>
            </p>
          </div>
        )}

        {/* Auth required — redirecting to sign-in */}
        {status === 'auth-required' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Sign in required</h1>
            <p className="text-[rgb(var(--muted-foreground))]">
              Redirecting you to sign in first…
            </p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">You're in! 🎉</h1>
            <p className="text-[rgb(var(--muted-foreground))]">
              Welcome to <span className="text-white font-semibold">{packName}</span>.
            </p>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Redirecting to your Pack…
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Couldn't join</h1>
            <p className="text-[rgb(var(--muted-foreground))]">{errorMessage}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
