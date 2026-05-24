import { createClient } from '@supabase/supabase-js'
import { getClientEnv, getServerEnv } from '@/lib/env'

/**
 * Supabase client per uso server-side (API Routes, Server Components, Edge Functions).
 * Usa la SUPABASE_SERVICE_ROLE_KEY per accesso privilegiato (bypassa RLS).
 * NON esporre mai questo client al browser.
 */
export function createSupabaseServer() {
  return createClient(
    getClientEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co'),
    getServerEnv('SUPABASE_SERVICE_ROLE_KEY', 'placeholder-service-role-key'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
