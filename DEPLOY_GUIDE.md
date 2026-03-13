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
