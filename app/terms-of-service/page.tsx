import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "Termini e Condizioni | Think",
};

export default function TermsOfService() {
  return (
    <div className="h-screen overflow-y-auto bg-[var(--color-bg-page)] text-[var(--color-text-main)] py-12 px-6 lg:px-12 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-12 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center text-[var(--color-text-muted)] hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Torna all'App
        </Link>
        <Logo isDark={true} className="h-10 w-auto" />
      </div>

      <div className="w-full max-w-3xl glass-panel p-8 md:p-12 rounded-[2rem] space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Termini e Condizioni</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Ultimo aggiornamento: Luglio 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[var(--color-text-main)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">1. Introduzione</h2>
            <p>
              Benvenuto su Think. Utilizzando la nostra applicazione, l'utente accetta integralmente i presenti Termini di Servizio. Si prega di leggerli attentamente prima di creare un account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">2. Regole di Condotta</h2>
            <p className="mb-2">Promuoviamo una piattaforma sicura e civile. L'utente accetta espressamente di NON utilizzare Think per:</p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li>Pubblicare contenuti diffamatori, razzisti, minatori, o contrari alla legge.</li>
              <li>Impersonare altre persone (siano esse figure pubbliche o utenti privati).</li>
              <li>Spammare, promuovere truffe, o condividere contenuti illeciti.</li>
            </ul>
            <p className="mt-2 text-xs italic opacity-70">Nota: Ci riserviamo il diritto di bannare o silenziare qualsiasi utente o "Think" (post) che disattenda queste linee guida della community senza preavviso.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">3. Proprietà dei Contenuti</h2>
            <p>
              L'utente mantiene la proprietà esclusiva dei diritti sui propri testi (i "think" pubblicati). Tuttavia, pubblicandoli, l'utente concede a Think una licenza globale, gratuita e trasferibile per visualizzarli, distribuirli e promuovere la piattaforma stessa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">4. Tracciamento GPS</h2>
            <p>
              I messaggi ("think") possono essere associati una coordinata geografica, in base al funzionamento dell'App. Nel momento in cui pubblichi, autorizzi volontariamente la condivisione pubblica dell'area geografica in cui ti trovi o che hai selezionato manualmente per arricchire la mappa interattiva.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">5. Esclusione di Responsabilità</h2>
            <p>
              I servizi sono forniti "così come sono" ("AS IS"). Lo sviluppatore e i moderatori di Think non sono responsabili per qualsiasi danno, interruzione del servizio o perdita di dati, né possono essere ritenuti legalmente responsabili per il contenuto pubblicato da altri utenti sulla piattaforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
