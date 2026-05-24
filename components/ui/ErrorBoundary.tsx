"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  /** Testo opzionale del titolo dell'errore */
  title?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — cattura errori imprevisti nei componenti figli e mostra
 * una schermata di fallback elegante invece di un crash silenzioso.
 *
 * Utilizzo:
 *   <ErrorBoundary>
 *     <ComponenteRischioso />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In produzione potresti inviare l'errore a Sentry o Telegram
    // Per ora lo logghiamo solo una volta (non in loop)
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-8 py-16 text-center gap-6">
          {/* Icona */}
          <div className="w-16 h-16 rounded-[1.25rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Testo */}
          <div className="space-y-2 max-w-xs">
            <h2 className="text-lg font-black text-[var(--color-text-main)]">
              {this.props.title ?? "Qualcosa è andato storto"}
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              Si è verificato un errore imprevisto. Prova a ricaricare la pagina o riprova tra qualche istante.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-3 text-left text-[10px] bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-red-400 overflow-auto max-h-32 whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            )}
          </div>

          {/* Azioni */}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-panel)] text-[var(--color-text-main)] text-sm font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Riprova
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              Ricarica pagina
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
