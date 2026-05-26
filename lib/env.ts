const isProduction = process.env.NODE_ENV === 'production'

function requireEnv(key: string, val: string | undefined): asserts val is string {
  if (isProduction && !val) {
    throw new Error(`[ENV] Missing critical env: ${key}. Set it in Vercel → Project Settings → Environment Variables.`)
  }
}

/**
 * Public Supabase URL — static ref per permettere il build‑time replacement di Next.js.
 */
export function getSupabaseUrl(): string {
  const val = process.env.NEXT_PUBLIC_SUPABASE_URL
  requireEnv('NEXT_PUBLIC_SUPABASE_URL', val)
  return val ?? ''
}

/**
 * Public Supabase anon key — static ref per permettere il build‑time replacement di Next.js.
 */
export function getSupabaseAnonKey(): string {
  const val = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', val)
  return val ?? ''
}

/**
 * Server‑only Supabase service role key.
 * Restituisce stringa vuota se chiamato lato client (sicurezza).
 */
export function getSupabaseServiceRoleKey(): string {
  if (typeof window !== 'undefined') return ''
  const val = process.env.SUPABASE_SERVICE_ROLE_KEY
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', val)
  return val ?? ''
}
