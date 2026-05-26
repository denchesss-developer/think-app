import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/env'

/**
 * Supabase client per uso server-side (API Routes, Server Components, Edge Functions).
 * Usa la SUPABASE_SERVICE_ROLE_KEY per accesso privilegiato (bypassa RLS).
 * NON esporre mai questo client al browser.
 */
export function createSupabaseServer() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
