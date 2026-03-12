"use server"

import * as deepl from 'deepl-node';
import { supabase } from '@/lib/supabaseClient';

// Ensure the API key is available. Note: The fallback key here is from the prompt.
// In a real scenario it should strictly be in .env
const authKey = process.env.DEEPL_API_KEY || "8db497e2-72e6-463e-a96f-c71b91141fce:fx"; 
const translator = new deepl.Translator(authKey);

export async function translateText(
  text: string, 
  targetLang: string, 
  entityId: number, 
  entityType: 'chat' | 'reply'
) {
  if (!text) return { translatedText: text, sourceLang: targetLang };
  
  // Format targetLang for DeepL (e.g., 'en' might need to be 'en-US' or 'en-GB')
  let dlTargetLang: deepl.TargetLanguageCode = targetLang.toLowerCase() as deepl.TargetLanguageCode;
  
  // DeepL requires specific target language format (e.g., en-US, pt-PT)
  const langUpper = targetLang.toUpperCase();
  if (langUpper.startsWith('EN')) dlTargetLang = 'en-US'; 
  if (langUpper.startsWith('PT')) dlTargetLang = 'pt-PT';

  try {
    // 1. Check Cache in Supabase
    const { data: cached, error: cacheError } = await supabase
      .from('translations_cache')
      .select('translated_text, original_lang')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('target_lang', targetLang)
      .maybeSingle();

    if (cached) {
      return { 
        translatedText: cached.translated_text, 
        sourceLang: cached.original_lang 
      };
    }

    // 2. Call DeepL API
    const result = await translator.translateText(text, null, dlTargetLang);
    const translatedText = result.text;
    const sourceLang = result.detectedSourceLang.toLowerCase();

    // If source and target are the same, don't cache, just return
    if (sourceLang === targetLang.toLowerCase() || (sourceLang.startsWith('en') && targetLang.toLowerCase().startsWith('en'))) {
      return { translatedText: text, sourceLang };
    }

    // 3. Save to Cache
    const { error: insertError } = await supabase
      .from('translations_cache')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        target_lang: targetLang,
        original_lang: sourceLang,
        translated_text: translatedText
      });

    if (insertError) {
      console.error("Failed to cache translation:", insertError);
    }

    return { translatedText, sourceLang };
  } catch (error) {
    console.error("Translation error:", error);
    // Silent fail: return original text if translation fails
    return { translatedText: text, sourceLang: targetLang };
  }
}

export async function translateSearchQuery(query: string) {
  if (!query) return query;
  
  try {
    // Translate search queries to English as the "lingua ponte"
    const result = await translator.translateText(query, null, 'en-US');
    return result.text;
  } catch (error) {
    console.error("Search translation error:", error);
    return query; // Fallback to original query
  }
}
