"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"
import React from "react"

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  // Il clientId definito su Google Cloud Console e impostato su Vercel
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
