import { createClient } from "@supabase/supabase-js";
import { readRequiredEnv } from "@/lib/env";

export function getSupabaseBrowserClient() {
  return createClient(
    readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function getSupabaseServiceClient() {
  return createClient(readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
}
