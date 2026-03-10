-- =====================================================
-- SQL per risolvere l'errore "Database error saving new user"
-- Esegui questi comandi nella console SQL di Supabase
-- =====================================================

-- 1. Creare la tabella profiles se non esiste
-- (Se esiste già, salta questo passaggio)

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Abilitare Row Level Security sulla tabella profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy RLS per permettere agli utenti di leggere il proprio profilo
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 4. Policy RLS per permettere agli utenti di inserire il proprio profilo
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. Policy RLS per permettere agli utenti di aggiornare il proprio profilo
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 6. Funzione trigger per creare automaticamente il profilo quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname)
    VALUES (NEW.id, NULL);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Creare il trigger che esegue la funzione dopo l'inserimento di un nuovo utente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- NOTA: Assicurati che il servizio Supabase Auth 
-- abbia i permessi necessari per inserire nella tabella profiles.
-- In caso di errore, verifica che la funzione trigger abbia
-- SECURITY DEFINER o che auth.service_role possa inserire.
-- =====================================================

-- Per verificare che tutto sia configurato correttamente, prova a:
-- 1. Disconnettiti dall'app
-- 2. Prova ad accedere con Google OAuth
-- 3. Il profilo dovrebbe essere creato automaticamente
