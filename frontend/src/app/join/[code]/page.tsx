export const metadata = {
  title: 'Join Pack',
};

export default function JoinPackPage({
  params,
}: {
  params: { code: string };
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-3xl font-bold text-center">Join Pack</h1>
        <p className="text-muted-foreground text-center">
          Joining with invite code: <code className="text-primary">{params.code}</code>
        </p>
        <p className="text-muted-foreground text-center text-sm">
          Auto-join flow — coming in Batch 5.
        </p>
      </div>
    </div>
  );
}
