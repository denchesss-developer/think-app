import { createClient } from '@supabase/supabase-js'

// Prendiamo i dati dalla nostra cassaforte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creiamo il "telefono" per chiamare Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)