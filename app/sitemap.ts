import type { MetadataRoute } from 'next'
import { createSupabaseServer } from '@/lib/supabaseServer'

const BASE_URL = 'https://thethink.space'
const SUPPORTED_LANGS = ['en', 'es', 'fr', 'de'] // IT is the default (no prefix)

export const revalidate = 3600 // Rebuild sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServer()

  // Fetch all published articles
  const { data: articles } = await supabase
    .from('news_articles')
    .select('slug, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  // Fetch all public debates/chats
  const { data: debates } = await supabase
    .from('chats')
    .select('id, ultima_attivita, created_at, titolo')
    .not('titolo', 'is', null)
    .order('ultima_attivita', { ascending: false })
    .limit(2000)

  const now = new Date().toISOString()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    // Multilingual blog index pages
    ...SUPPORTED_LANGS.map((lang) => ({
      url: `${BASE_URL}/blog/${lang}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
    // Legal pages
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: '2024-01-01T00:00:00Z',
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/cookie-policy`,
      lastModified: '2024-01-01T00:00:00Z',
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified: '2024-01-01T00:00:00Z',
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Debate pages (one per chat)
  const debatePages: MetadataRoute.Sitemap = (debates || []).map((debate) => ({
    url: `${BASE_URL}/think/${debate.id}`,
    lastModified: debate.ultima_attivita || debate.created_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  if (!articles) return [...staticPages, ...debatePages]

  // Article pages (IT default + all supported languages)
  const articlePages: MetadataRoute.Sitemap = articles.flatMap((article) => {
    const lastMod = article.created_at || now
    return [
      // Default Italian version (no prefix)
      {
        url: `${BASE_URL}/blog/${article.slug}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      // Language variants
      ...SUPPORTED_LANGS.map((lang) => ({
        url: `${BASE_URL}/blog/${lang}/${article.slug}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  })

  return [...staticPages, ...debatePages, ...articlePages]
}
