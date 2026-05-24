"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ConsentStatus = "granted" | "denied" | null;

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial consent status
    const consent = localStorage.getItem("think_cookie_consent") as ConsentStatus;
    if (!consent) {
      // Delay slightly for presentation
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }

    // Listen for custom event to re-open the banner
    const handleOpenBanner = () => {
      setShowBanner(true);
    };

    window.addEventListener("open-cookie-banner", handleOpenBanner);
    return () => window.removeEventListener("open-cookie-banner", handleOpenBanner);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("think_cookie_consent", "granted");
    setShowBanner(false);
    window.dispatchEvent(new CustomEvent("think-consent-update", { detail: "granted" }));
  };

  const handleReject = () => {
    localStorage.setItem("think_cookie_consent", "denied");
    setShowBanner(false);
    window.dispatchEvent(new CustomEvent("think-consent-update", { detail: "denied" }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: "120%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "120%", opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
          transition={{ type: "spring", stiffness: 300, damping: 25, mass: 1 }}
          className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-4 lg:px-6 lg:pb-8 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel max-w-4xl w-full p-5 lg:p-6 rounded-[1.5rem] border border-[var(--glass-border)] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--color-brand-blue)]" />
                <h3 className="font-bold text-sm text-[var(--color-text-main)] uppercase tracking-wider">
                  La tua Privacy
                </h3>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed md:pr-10">
                Utilizziamo cookie per assicurarti la migliore esperienza funzionale e analitica sull&apos;app.
                Questi dati ci aiutano a migliorare costantemente Think. Puoi accettare il tracciamento
                o rifiutarlo continuando a usare l&apos;app in modo limitato. Leggi la nostra{" "}
                <Link href="/privacy-policy" className="underline text-[var(--color-text-main)] hover:text-[var(--color-brand-blue)] transition-colors">
                  Privacy Policy
                </Link>{" "}
                e{" "}
                <Link href="/cookie-policy" className="underline text-[var(--color-text-main)] hover:text-[var(--color-brand-blue)] transition-colors">
                  Cookie Policy
                </Link>.
              </p>
            </div>
            
            <div className="flex flex-row md:flex-col lg:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <Button 
                variant="secondary" 
                className="w-full md:w-auto text-xs py-2 h-auto rounded-xl flex-1"
                onClick={handleReject}
              >
                Rifiuta Opzionali
              </Button>
              <Button 
                variant="primary" 
                className="w-full md:w-auto text-xs py-2 h-auto rounded-xl flex-1 mt-0 shadow-[0_0_15px_var(--color-brand-blue)]"
                onClick={handleAccept}
              >
                Accetta Tutti
              </Button>
            </div>
            
            <button 
              className="absolute top-4 right-4 md:hidden text-[var(--color-text-muted)] hover:text-white"
              onClick={handleReject}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
