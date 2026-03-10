"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"
import React from "react"

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  // Il clientId definito su Google Cloud Console. Inserito anche come fallback esplicito per evitare errori su Vercel se la variabile env non è ancora caricata.
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "976157605398-ncb7ccnpib70nnnrovd3088p4qc004bk.apps.googleusercontent.com"

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
