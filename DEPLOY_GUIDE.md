# Guida Deploy Think App su Vercel

## Comandi per il Deploy

Esegui questi comandi nella directory del progetto:

```bash
# 1. Verifica di essere nella directory corretta
cd /Users/dennischebbi/Desktop/think-app

# 2. Verifica versione Vercel CLI (usa npx per non installare globalmente)
npx vercel --version

# 3. Verifica di essere loggato su Vercel
npx vercel whoami

# 4. Deploy in produzione
npx vercel --prod
```

## Note Importanti

- **USA `npx vercel` e NON `vercel`** - `npx` esegue il CLI di Vercel senza bisogno di installazione globale, evitando problemi di permessi
- **Non serve `npm install`** - Vercel installa le dipendenze automaticamente durante il build
- **Le variabili d'ambiente** - Già configurate nella dashboard Vercel, non serve copierle da locale

## Variabili ambiente da verificare

Per le API e i report Telegram assicurati che in Vercel siano presenti:

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

`TELEGRAM_THREAD_API_CONSUMI` deve essere l'id del topic Telegram `API consumi`.

## Migration Supabase da applicare

Prima del deploy finale applica anche la migration che crea il tracciamento consumi API:

```sql
supabase/migrations/20260417093000_add_api_usage_logs.sql
```

Questa tabella viene usata per costruire il report giornaliero delle API.

## Cron attivi

In `vercel.json` sono previsti anche questi cron:

- `/api/cron/generate-news`
- `/api/cron/generate-trending`
- `/api/telegram/api-usage-report?daysAgo=1`
- i report periodici Telegram già esistenti

## Test manuale rapido

Dopo il deploy puoi testare il report giornaliero manualmente chiamando:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  "https://thethink.space/api/telegram/api-usage-report?daysAgo=1"
```

Se vuoi verificare il giorno corrente invece del giorno precedente:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  "https://thethink.space/api/telegram/api-usage-report?daysAgo=0"
```

## Output Atteso

Il deploy mostrerà:
```
Production: https://think-fybyl0o8j-denchesss-developers-projects.vercel.app
Alias: https://thethink.space
```

## Troubleshooting

Se il deploy fallisce:
1. Verifica che `npx vercel whoami` restituisca un utente (es. `denchesss-developer`)
2. Se non sei loggato: `npx vercel login` e segui le istruzioni
3. Controlla la dashboard Vercel per errori specifici
