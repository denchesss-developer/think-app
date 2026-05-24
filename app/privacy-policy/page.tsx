import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "Privacy Policy | Think",
};

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Ultimo aggiornamento: Luglio 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[var(--color-text-main)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">1. Titolare del Trattamento</h2>
            <p>
              I dati raccolti tramite l'applicazione Think sono trattati nel rispetto del Regolamento (UE) 2016/679 (GDPR) e delle direttive internazionali pertinenti in materia di privacy. Per eventuali richieste, il Titolare del Trattamento può essere contattato alla mail di supporto ufficiale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">2. Tipologia di Dati Raccolti</h2>
            <p className="mb-2">Raccogliamo due tipi di dati principali:</p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li><strong>Dati di utilizzo:</strong> Indirizzo IP approssimativo, informazioni sul browser, eventi di interazione (analizzati anonimamente tramite PostHog e Microsoft Clarity).</li>
              <li><strong>Dati dell'utente:</strong> Se forniti per la creazione di un account, gestiamo nickname, email autenticate tramite terze parti (es. Google/Apple) e la posizione geografica (esclusivamente quando vengono pubblicati messaggi "Think").</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">3. Consenso ai Cookie e Tracciamento</h2>
            <p>
              Adottiamo un rigido sistema di <em>Consent Management</em>. Fino al consenso esplicito dell'utente (Opt-in tramite il Banner dei Cookie), l'applicazione non attiverà script analitici (PostHog / Clarity). L'utente può modificare in qualsiasi momento questa preferenza dalle Impostazioni del suo Profilo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">4. Condivisione dei Dati</h2>
            <p>
              I dati personali non verranno mai venduti a terzi per scopi promozionali. Ci appoggiamo a servizi certificati (come Supabase per i database) che agiscono come Responsabili del trattamento, vincolati al rispetto del GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">5. Diritti dell'Utente</h2>
            <p>
              Ai sensi degli art. 15-22 del GDPR, l'utente ha diritto di:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-[var(--color-text-muted)]">
              <li>Accedere ai propri dati.</li>
              <li>Chiedere la rettifica o la cancellazione (Diritto all'Oblio).</li>
              <li>Revocare il consenso al tracciamento in qualsiasi momento.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
