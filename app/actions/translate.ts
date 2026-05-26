"use server"

import * as deepl from 'deepl-node'
import { supabase } from '@/lib/supabaseClient'

function getTranslator() {
  const authKey = process.env.DEEPL_API_KEY
  if (!authKey) return null
  return new deepl.Translator(authKey)
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace(/[^a-z]/g, '')
}

function isAlreadyInTarget(text: string, targetLang: string): boolean {
  const lang = normalizeLang(targetLang)
  if (lang.startsWith('en')) {
    return /^[a-zA-Z0-9\s.,!?;:'"()\-]+$/.test(text) && /[a-zA-Z]/.test(text)
  }
  return false
}

function mapTargetLang(raw: string): deepl.TargetLanguageCode {
  const lang = normalizeLang(raw)
  if (lang.startsWith('en')) return 'en-US' as deepl.TargetLanguageCode
  if (lang.startsWith('pt')) return 'pt-PT' as deepl.TargetLanguageCode
  return lang as deepl.TargetLanguageCode
}

async function getCachedTranslation(
  entityId: number,
  entityType: 'chat' | 'reply',
  targetLang: string
): Promise<{ translated_text: string; original_lang: string } | null> {
  const { data } = await supabase
    .from('translations_cache')
    .select('translated_text, original_lang')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .eq('target_lang', targetLang)
    .maybeSingle()
  return data
}

async function saveTranslation(
  entityId: number,
  entityType: 'chat' | 'reply',
  targetLang: string,
  originalLang: string,
  translatedText: string
) {
  const { error } = await supabase.from('translations_cache').insert({
    entity_id: entityId,
    entity_type: entityType,
    target_lang: targetLang,
    original_lang: originalLang,
    translated_text: translatedText
  })
  if (error) {
    console.error('Failed to cache translation:', error)
  }
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

  if (isAlreadyInTarget(text, targetLang)) {
    return { translatedText: text, sourceLang: normalizeLang(targetLang) }
  }

  const dlTargetLang = mapTargetLang(targetLang)

  const cached = await getCachedTranslation(entityId, entityType, targetLang)
  if (cached) {
    return {
      translatedText: cached.translated_text,
      sourceLang: cached.original_lang
    }
  }

  try {
    const result = await translator.translateText(text, null, dlTargetLang)
    const translatedText = result.text
    const sourceLang = normalizeLang(result.detectedSourceLang)

    if (sourceLang === normalizeLang(targetLang) ||
        (sourceLang.startsWith('en') && normalizeLang(targetLang).startsWith('en'))) {
      return { translatedText: text, sourceLang }
    }

    await saveTranslation(entityId, entityType, targetLang, sourceLang, translatedText)

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

  if (isAlreadyInTarget(query, 'en')) return query

  try {
    const result = await translator.translateText(query, null, 'en-US' as deepl.TargetLanguageCode)
    return result.text
  } catch (error) {
    console.error('Search translation error:', error)
    return query
  }
}
