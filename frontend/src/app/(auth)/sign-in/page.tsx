'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import { useUserStore } from '@/store/user';

export default function SignInPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        // Sync Prisma user record and populate store
        const user = await authApi.syncUser(undefined, data.session.access_token);
        setUser(user);
        router.push(user.onboardingDone ? '/dashboard' : '/onboarding');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-margin text-on-background antialiased"
      style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, #1A1A1A 0%, #0A0A0A 100%)' }}
    >
      <main className="w-full max-w-md relative z-10">
        {/* Brand / Header */}
        <div className="text-center mb-lg">
          <h1 className="font-h1 text-h1 text-primary uppercase italic tracking-widest drop-shadow-[0_4px_20px_rgba(255,90,31,0.3)]">
            PEAKPACK
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            Ignite your inner fire.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="relative bg-surface/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Subtle gradient overlay to suggest a physical metallic slab */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="p-md relative z-10">
            <h2 className="font-h2 text-h2 text-on-surface mb-md">Sign In</h2>
            
            <form onSubmit={handleSignIn} className="space-y-md">
              {/* Input: Email */}
              <div className="flex flex-col">
                <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs uppercase tracking-wide" htmlFor="email">
                  Email Address
                </label>
                <input 
                  className="bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" 
                  id="email" 
                  name="email" 
                  placeholder="athlete@peakpack.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Input: Password */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-xs">
                  <label className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wide" htmlFor="password">
                    Password
                  </label>
                  <a className="font-body-md text-body-md text-primary text-sm hover:text-primary-fixed transition-colors" href="#">
                    Forgot?
                  </a>
                </div>
                <input 
                  className="bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-error font-body-md">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button 
                className="w-full bg-primary-container text-black font-label-bold text-label-bold py-sm px-md rounded-DEFAULT uppercase tracking-wider hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] transition-all active:scale-95 duration-200 mt-sm flex justify-center items-center" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Entering...' : 'Enter the Arena'}
              </button>
            </form>

            <div className="my-md flex items-center justify-center space-x-sm">
              <span className="h-px bg-surface-bright flex-grow"></span>
              <span className="font-body-md text-body-md text-on-surface-variant text-sm uppercase">Or</span>
              <span className="h-px bg-surface-bright flex-grow"></span>
            </div>

            {/* Secondary Button (Google) */}
            <button 
              className="w-full flex items-center justify-center space-x-sm bg-transparent border-2 border-secondary text-secondary font-label-bold text-label-bold py-sm px-md rounded-DEFAULT uppercase tracking-wider hover:bg-secondary/10 transition-colors active:scale-95 duration-200" 
              type="button"
              onClick={handleGoogleSignIn}
            >
              <span className="material-symbols-outlined">login</span>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-md">
          <p className="font-body-md text-body-md text-on-surface-variant">
            New recruit?{' '}
            <Link className="text-primary font-label-bold hover:underline underline-offset-4 decoration-primary/50 transition-all" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
