import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { PostHogProvider } from "./providers";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { TrackingManager } from "@/components/features/TrackingManager";
import { JsonLd, websiteSchema, organizationSchema } from "@/components/seo/JsonLd";
import "./globals.css";

const BASE_URL = 'https://thethink.space';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050505",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Think — Mappa Globale 3D di Opinioni e Dibattiti',
    template: '%s — Think',
  },
  description:
    'Think è la prima piattaforma dove le notizie del mondo diventano domande di dibattito geolocalizzate su un globo 3D interattivo. Condividi la tua opinione e scopri cosa pensano le persone da tutto il mondo.',
  keywords: [
    'mappa globale',
    'dibattiti mondiali',
    'notizie interattive',
    'opinioni geolocalizzate',
    'globo 3D',
    'think app',
    'debate platform',
    'world news map',
    'discussioni globali',
    'news geolocation',
  ],
  authors: [{ name: 'Think', url: BASE_URL }],
  creator: 'Think',
  publisher: 'Think',
  category: 'news',

  // Canonical & Alternates
  alternates: {
    canonical: BASE_URL,
    languages: {
      'it': BASE_URL,
      'en': `${BASE_URL}/blog/en`,
      'es': `${BASE_URL}/blog/es`,
      'fr': `${BASE_URL}/blog/fr`,
      'de': `${BASE_URL}/blog/de`,
    },
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    alternateLocale: ['en_US', 'es_ES', 'fr_FR', 'de_DE'],
    url: BASE_URL,
    siteName: 'Think',
    title: 'Think — Mappa Globale 3D di Opinioni e Dibattiti',
    description:
      'Le notizie del mondo diventano domande di dibattito su un globo 3D interattivo. Condividi la tua opinione geo-localizzata.',
    images: [
      {
        url: `/api/og?title=${encodeURIComponent('Think — Mappa Globale 3D di Dibattiti')}&type=home`,
        width: 1200,
        height: 630,
        alt: 'Think — Piattaforma globale di dibattiti geolocalizzati',
      },
    ],
  },

  // Twitter / X Cards (works even without a Twitter account)
  twitter: {
    card: 'summary_large_image',
    title: 'Think — Mappa Globale 3D di Opinioni',
    description:
      'Le notizie del mondo diventano domande di dibattito su un globo 3D. Condividi la tua opinione geo-localizzata.',
    images: [
      `/api/og?title=${encodeURIComponent('Think — Mappa Globale 3D di Dibattiti')}&type=home`,
    ],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // Verification
  verification: {
    google: 'r0JleXXapiTOYn83QS0wmHujUJOT0sG-MW1niWW67as',
  },

  // PWA & Icons
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/icon',
    apple: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Think',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <JsonLd data={websiteSchema()} />
        <JsonLd data={organizationSchema()} />
        <TrackingManager />
        <PostHogProvider>
          <ErrorBoundary>
            <ToastProvider>
              {children}
            </ToastProvider>
            <CookieBanner />
          </ErrorBoundary>
        </PostHogProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
