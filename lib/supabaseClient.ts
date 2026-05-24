import { createClient } from '@supabase/supabase-js'
import { getClientEnv } from '@/lib/env'

const supabaseUrl = getClientEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
const supabaseAnonKey = getClientEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-anon-key')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)