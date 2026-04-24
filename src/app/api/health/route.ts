import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    clerkConfigured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && Boolean(process.env.CLERK_SECRET_KEY),
    redisConfigured: Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    supabaseConfigured:
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cloudinaryConfigured:
      Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
      Boolean(process.env.CLOUDINARY_API_KEY) &&
      Boolean(process.env.CLOUDINARY_API_SECRET)
  };

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    checks
  });
}
