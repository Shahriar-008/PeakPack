import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <section className="grid gap-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Phase 0 foundation</p>
          <h1 className="text-4xl font-bold leading-tight">Train together. Check in daily. Level up with your pack.</h1>
          <p className="max-w-xl text-brand-100">
            PeakPack helps small groups build consistency through social accountability, streaks, and progress-first habits.
          </p>
          <div className="flex flex-wrap gap-3">
            <SignedOut>
              <Link href="/sign-up">
                <Button variant="secondary" size="lg">
                  Create account
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" size="lg" className="bg-white/15 text-white hover:bg-white/20">
                  Sign in
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  Go to dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
        <Card className="bg-white/95">
          <CardTitle>What is ready now</CardTitle>
          <CardDescription className="mt-3 space-y-2 text-sm">
            <span className="block">- Auth shell with Clerk routes</span>
            <span className="block">- Prisma schema for core fitness entities</span>
            <span className="block">- Base UI component primitives</span>
            <span className="block">- Local Postgres + Redis infra baseline</span>
          </CardDescription>
        </Card>
      </section>
    </main>
  );
}
