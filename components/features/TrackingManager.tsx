"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function TrackingManager() {
  useEffect(() => {
    // 1. Initial consent check for Clarity
    const consent = localStorage.getItem("think_cookie_consent");

    const loadClarity = () => {
      // Prevent multiple injections
      if (document.getElementById("clarity-script")) return;

      const script = document.createElement("script");
      script.id = "clarity-script";
      script.async = true;
      script.text = `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "whv3jyxk6y");
      `;
      document.body.appendChild(script);
    };

    // Initialize tracking if already granted
    if (consent === "granted") {
      loadClarity();
      if (posthog.has_opted_out_capturing()) {
        posthog.opt_in_capturing();
      }
    } else {
      // If denied or unset, we ensure PostHog is disabled
      // PostHog will be initialized in providers.tsx but with opt_out by default.
      if (!posthog.has_opted_out_capturing()) {
         posthog.opt_out_capturing();
      }
    }

    // 2. Listen for spontaneous updates from the banner
    const handleConsentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newStatus = customEvent.detail;

      if (newStatus === "granted") {
        loadClarity();
        posthog.opt_in_capturing();
      } else if (newStatus === "denied") {
        posthog.opt_out_capturing();
        // NOTE: We cannot easily "unload" Clarity once injected without page reload, 
        // but we can delete its cookies. Standard practice for "Reject All" after accepting
        // is to optionally trigger a page reload safely, or clear cookies.
      }
    };

    window.addEventListener("think-consent-update", handleConsentUpdate);
    return () => window.removeEventListener("think-consent-update", handleConsentUpdate);
  }, []);

  return null;
}
