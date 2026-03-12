-- Create translations cache table
CREATE TABLE IF NOT EXISTS public.translations_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, -- Either chat_id or risposta_id
    entity_type TEXT NOT NULL CHECK (entity_type IN ('chat', 'reply')),
    target_lang TEXT NOT NULL,
    original_lang TEXT,
    translated_title TEXT, -- For chats
    translated_text TEXT NOT NULL, -- For both (chat.messaggio or risposta.testo)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(entity_id, entity_type, target_lang)
);

-- Enable RLS for translations_cache
ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to translations (caching should be globally readable)
CREATE POLICY "Translations are viewable by everyone" ON public.translations_cache
    FOR SELECT USING (true);

-- Allow authenticated users to insert new translations, and optionally anon users if the app allows anon inserts
CREATE POLICY "Translations can be created by everyone" ON public.translations_cache
    FOR INSERT WITH CHECK (true);

-- Create RPC for global search across chats and replies
CREATE OR REPLACE FUNCTION public.search_chats(search_term TEXT)
RETURNS SETOF public.chats
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.*
    FROM public.chats c
    WHERE
        c.titolo ILIKE '%' || search_term || '%'
        OR c.messaggio ILIKE '%' || search_term || '%'
        OR c.autore ILIKE '%' || search_term || '%'
        OR EXISTS (
            SELECT 1 FROM public.risposte r
            WHERE r.chat_id = c.id
            AND (r.testo ILIKE '%' || search_term || '%' OR r.autore ILIKE '%' || search_term || '%')
        )
    ORDER BY c.created_at DESC;
END;
$$;
