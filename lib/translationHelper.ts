import { createSupabaseServer } from '@/lib/supabaseServer'
import { callGeminiText, extractJsonObject } from '@/lib/gemini'

interface Traduzione {
  titolo: string
  contenuto_completo: string
  domanda_breve: string
}

export async function getTranslatedArticle(
  articleId: string, 
  originalSource: { titolo: string; contenuto_completo: string; domanda_breve: string },
  lang: string, 
  existingTranslations: Record<string, Traduzione> | null
): Promise<Traduzione> {
  // If we already have the translation cached in JSONB, return it immediately (0 cost)
  if (existingTranslations && existingTranslations[lang]) {
    return existingTranslations[lang]
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  const prompt = `Traduci il seguente articolo giornalistico in lingua '${lang}'. 
  Devi rispondere SOLO ED ESCLUSIVAMENTE con un JSON valido (nessun markdown, niente \`\`\`json).
  
  Articolo originale (IT):
  Titolo: ${originalSource.titolo}
  Domanda: ${originalSource.domanda_breve}
  Contenuto:
  ${originalSource.contenuto_completo}

  Rispondi nel formato:
  {
    "titolo": "...",
    "domanda_breve": "...",
    "contenuto_completo": "..."
  }
  `

  const { text } = await callGeminiText({
    prompt,
    operation: `translate_article_${lang}`,
    temperature: 0.3,
    maxOutputTokens: 2048
  })
  const traduzione: Traduzione = extractJsonObject<Traduzione>(text)

  // Save to supabase cache
  const supabase = createSupabaseServer()
  const newTranslations = { ...(existingTranslations || {}), [lang]: traduzione }
  
  await supabase
    .from('news_articles')
    .update({ traduzioni: newTranslations })
    .eq('id', articleId)

  return traduzione
}
