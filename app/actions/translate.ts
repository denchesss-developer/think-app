"use server"

import * as deepl from 'deepl-node'
import { supabase } from '@/lib/supabaseClient'

function getTranslator() {
  const authKey = process.env.DEEPL_API_KEY
  if (!authKey) return null
  return new deepl.Translator(authKey)
}

export async function translateText(
  text: string,
  targetLang: string,
  entityId: number,
  entityType: 'chat' | 'reply'
) {
  if (!text) return { translatedText: text, sourceLang: targetLang }

  const translator = getTranslator()
  if (!translator) {
    return { translatedText: text, sourceLang: targetLang }
  }

  let dlTargetLang: deepl.TargetLanguageCode = targetLang.toLowerCase() as deepl.TargetLanguageCode

  const langUpper = targetLang.toUpperCase()
  if (langUpper.startsWith('EN')) dlTargetLang = 'en-US'
  if (langUpper.startsWith('PT')) dlTargetLang = 'pt-PT'

  try {
    const { data: cached } = await supabase
      .from('translations_cache')
      .select('translated_text, original_lang')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('target_lang', targetLang)
      .maybeSingle()

    if (cached) {
      return {
        translatedText: cached.translated_text,
        sourceLang: cached.original_lang
      }
    }

    const result = await translator.translateText(text, null, dlTargetLang)
    const translatedText = result.text
    const sourceLang = result.detectedSourceLang.toLowerCase()

    if (sourceLang === targetLang.toLowerCase() || (sourceLang.startsWith('en') && targetLang.toLowerCase().startsWith('en'))) {
      return { translatedText: text, sourceLang }
    }

    const { error: insertError } = await supabase
      .from('translations_cache')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        target_lang: targetLang,
        original_lang: sourceLang,
        translated_text: translatedText
      })

    if (insertError) {
      console.error('Failed to cache translation:', insertError)
    }

    return { translatedText, sourceLang }
  } catch (error) {
    console.error('Translation error:', error)
    return { translatedText: text, sourceLang: targetLang }
  }
}

export async function translateSearchQuery(query: string) {
  if (!query) return query

  const translator = getTranslator()
  if (!translator) return query

  try {
    const result = await translator.translateText(query, null, 'en-US')
    return result.text
  } catch (error) {
    console.error('Search translation error:', error)
    return query
  }
}
