## Think App

Think è una web app Next.js con globo 3D, feed di discussione, blog notizie e integrazioni con Gemini, DeepL, GNews, Supabase e Telegram.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment

Required server-side variables include:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CRON_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
GNEWS_API_KEY=
DEEPL_API_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_THREAD_REPORT=
TELEGRAM_THREAD_SEGNALAZIONI=
TELEGRAM_THREAD_BUG=
TELEGRAM_THREAD_API_CONSUMI=
```

## API usage tracking

The app now logs API usage for `gemini`, `gnews`, `deepl`, and `telegram` into `api_usage_logs`.

Daily Telegram report endpoint:

```bash
GET /api/telegram/api-usage-report?daysAgo=1
```

This route requires:

- `Authorization: Bearer <CRON_SECRET>`
- Supabase migration `20260417093000_add_api_usage_logs.sql`
- a Telegram topic id in `TELEGRAM_THREAD_API_CONSUMI`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
