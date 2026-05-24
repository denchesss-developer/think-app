import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "Cookie Policy | Think",
};

export default function CookiePolicy() {
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
          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Cookie Policy</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Ultimo aggiornamento: Luglio 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[var(--color-text-main)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">Cosa sono i Cookie?</h2>
            <p>
              I cookie sono piccoli file di testo che i siti visitati dagli utenti inviano ai loro terminali, ove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita successiva. I cookie aiutano le piattaforme a funzionare o a offrire un’esperienza migliore e personalizzata.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">Cookie Tecnici (Essenziali)</h2>
            <p className="mb-2">
              Questi cookie sono strettamente necessari per il funzionamento dell'app. Non richiedono consenso preventivo e includono:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li><strong>Sessione e Autenticazione:</strong> Cookie (o Local Storage) di Supabase che ci permettono di mantenerti loggato al tuo account in modo sicuro.</li>
              <li><strong>Preferenze di Sistema:</strong> Preferenza per il Tema Chiaro/Scuro o il "Consenso stesso ai cookie", memorizzati nel LocalStorage dell'App per non chiedertelo continuamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">Cookie Analitici (Previo Consenso)</h2>
            <p className="mb-2">
              Questi cookie ci permettono di capire come gli utenti interagiscono con la piattaforma, al fine di migliorarla. Vengono attivati <strong>esclusivamente dopo esplicita accettazione</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li><strong>PostHog:</strong> Servizio per tracciare le metriche di interazione (pulsanti premuti, schermate lette).</li>
              <li><strong>Microsoft Clarity:</strong> Strumento che riproduce mappe di calore anonimizzate e pattern d'uso per guidare le migliorie dell'interfaccia, ignorando e mascherando ogni dato sensibile digitato (password o testi nei campi di testo).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-[var(--color-brand-blue)]">Gestire le preferenze</h2>
            <p>
              Hai il diritto e la capacità di accettare o revocare il consenso in qualsiasi momento aprendo il pannello delle impostazioni dell'Account all'interno dell'app (cliccando su "Modifica Preferenze Cookie").
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
