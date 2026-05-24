/**
 * JsonLd — Injects structured data (JSON-LD) into <head> for Google rich results.
 * 
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", ... }} />
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ─── Pre-built schema helpers ─────────────────────────────────────────────────

const BASE_URL = 'https://thethink.space'

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Think',
    alternateName: 'TheThink',
    url: BASE_URL,
    description:
      'Think è una mappa globale 3D dove le notizie del mondo diventano domande di dibattito. Condividi la tua opinione geo-localizzata su eventi internazionali.',
    inLanguage: ['it', 'en', 'es', 'fr', 'de'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Think',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/think-logo-white.png`,
      width: 512,
      height: 512,
    },
    sameAs: [],
    foundingDate: '2024',
    description:
      'Think è la piattaforma che trasforma le notizie del mondo in domande di dibattito geolocalizzate su un globo 3D interattivo.',
  }
}

export function newsArticleSchema({
  headline,
  description,
  imageUrl,
  datePublished,
  articleSlug,
  lang = 'it',
}: {
  headline: string
  description: string
  imageUrl: string | null
  datePublished: string
  articleSlug: string
  lang?: string
}) {
  const articleUrl =
    lang === 'it'
      ? `${BASE_URL}/blog/${articleSlug}`
      : `${BASE_URL}/blog/${lang}/${articleSlug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    url: articleUrl,
    datePublished: new Date(datePublished).toISOString(),
    dateModified: new Date(datePublished).toISOString(),
    inLanguage: lang,
    image: imageUrl
      ? {
          '@type': 'ImageObject',
          url: imageUrl,
          width: 1200,
          height: 630,
        }
      : {
          '@type': 'ImageObject',
          url: `${BASE_URL}/api/og?title=${encodeURIComponent(headline)}`,
          width: 1200,
          height: 630,
        },
    author: {
      '@type': 'Organization',
      name: 'Think',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Think',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/think-logo-white.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    isAccessibleForFree: true,
  }
}

export function debateSchema({
  id,
  titolo,
  autore,
  regione,
  createdAt,
  risposteCount,
  risposte,
}: {
  id: number
  titolo: string
  autore: string
  regione: string | null
  createdAt: string
  risposteCount: number
  risposte: Array<{ testo: string; autore: string; regione: string | null; createdAt: string }>
}) {
  const url = `${BASE_URL}/debates/${id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': url,
    url,
    headline: titolo,
    text: titolo,
    author: {
      '@type': 'Person',
      name: autore || 'Thinker',
    },
    datePublished: new Date(createdAt).toISOString(),
    dateModified: new Date(createdAt).toISOString(),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: risposteCount,
    },
    locationCreated: regione
      ? { '@type': 'Place', name: regione }
      : undefined,
    comment: risposte.slice(0, 10).map((r) => ({
      '@type': 'Comment',
      text: r.testo,
      author: { '@type': 'Person', name: r.autore || 'Thinker' },
      datePublished: new Date(r.createdAt).toISOString(),
      locationCreated: r.regione
        ? { '@type': 'Place', name: r.regione }
        : undefined,
    })),
    isPartOf: {
      '@type': 'DiscussionForumPosting',
      name: 'Think — Global Map Debates',
      url: BASE_URL,
    },
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
