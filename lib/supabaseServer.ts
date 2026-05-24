import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client per uso server-side (API Routes, Server Components, Edge Functions).
 * Usa la SUPABASE_SERVICE_ROLE_KEY per accesso privilegiato (bypassa RLS).
 * NON esporre mai questo client al browser.
 */
export function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
