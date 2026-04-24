import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Welcome back{user?.firstName ? `, ${user.firstName}` : ""}</h1>
        <p className="mt-2 text-zinc-600">Your PeakPack MVP foundation is in place. Next step is core loop feature delivery.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Profile setup</CardTitle>
          <CardDescription className="mt-2">Name, avatar, and fitness goal onboarding coming in Phase 1.1.</CardDescription>
        </Card>
        <Card>
          <CardTitle>Pack management</CardTitle>
          <CardDescription className="mt-2">Create or join packs with invite codes in Phase 1.2.</CardDescription>
        </Card>
        <Card>
          <CardTitle>Daily check-ins</CardTitle>
          <CardDescription className="mt-2">Workout and meal check-ins with streak tracking in Phase 1.3.</CardDescription>
        </Card>
      </section>
    </main>
  );
}
