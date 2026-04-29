'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useUserStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (!user.onboardingDone) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,197,94,0.28),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(249,115,22,0.24),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(132,204,22,0.2),transparent_42%)]" />
      <div className="pointer-events-none absolute left-[8%] top-24 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-[10%] h-36 w-36 rounded-full bg-accent/20 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-16 pt-10 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-black tracking-tight gradient-text sm:text-3xl">PeakPack</div>
          <Link
            href="/sign-in"
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Sign in
          </Link>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              A social fitness system for long-term change
            </p>
            <h1 className="text-balance text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Your motives become habits when your pack shows up with you.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              PeakPack is built for people who want energy, confidence, and consistency, not short bursts of motivation.
              Set shared goals, check in daily, and transform effort into visible progress.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02]"
              >
                Start free and build my pack
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Sign in
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card. Create your pack in under 60 seconds.
            </p>
            <div className="grid max-w-xl grid-cols-3 gap-3 pt-2">
              {[
                { value: "Daily", label: "Check-in rhythm" },
                { value: "Pack", label: "Accountability loop" },
                { value: "XP", label: "Progress signal" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
                  <p className="text-xl font-black text-primary">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass animate-glow rounded-3xl p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Core goals</p>
            <ul className="mt-4 space-y-4 text-sm text-foreground/90 sm:text-base">
              <li className="rounded-xl border border-border/60 bg-card/60 p-4">
                Build daily discipline with easy check-ins and shared streak tracking.
              </li>
              <li className="rounded-xl border border-border/60 bg-card/60 p-4">
                Grow energy and confidence through small, repeatable wins.
              </li>
              <li className="rounded-xl border border-border/60 bg-card/60 p-4">
                Keep motivation high with friendly challenges and progress milestones.
              </li>
            </ul>
          </aside>
        </div>

        <section className="grid gap-4 rounded-3xl border border-border/70 bg-[linear-gradient(130deg,rgba(22,40,32,0.84),rgba(14,28,23,0.92))] p-6 sm:grid-cols-3 sm:p-8">
          {[
            {
              title: "Motive",
              body: "Feel stronger in your body and calmer in your mind.",
            },
            {
              title: "Method",
              body: "Use check-ins, streaks, and friendly pressure from your crew.",
            },
            {
              title: "Goal",
              body: "Build a fitness lifestyle you can sustain all year.",
            },
          ].map((block, index) => (
            <article
              key={block.title}
              className="rounded-2xl border border-primary/20 bg-background/25 p-5 opacity-0 animate-[fadeInUp_0.7s_ease-out_forwards]"
              style={{ animationDelay: `${index * 140 + 180}ms` }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{block.title}</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/90">{block.body}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            "Check in daily",
            "Compete with friends",
            "Level up every week",
          ].map((item, index) => (
            <div
              key={item}
              className="rounded-2xl border border-border/70 bg-card/70 p-5 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">0{index + 1}</p>
              <p className="mt-2 text-lg font-bold">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
