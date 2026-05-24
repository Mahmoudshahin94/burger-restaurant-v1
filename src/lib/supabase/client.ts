import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Singleton for auth-aware browser client
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

// Memory-only storage to prevent localStorage conflicts
const memoryStorage: Record<string, string> = {};
const noopStorage = {
  getItem: (key: string) => memoryStorage[key] ?? null,
  setItem: (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
};

// A simple anon-only client for reading public data (menu, categories,
// banners, etc.). Uses memory storage to avoid any localStorage conflicts
// with the main auth client.
let publicClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createPublicClient() {
  if (!publicClient) {
    publicClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: noopStorage,
          storageKey: 'sb-public-anon',
        },
      }
    );
  }
  return publicClient;
}
