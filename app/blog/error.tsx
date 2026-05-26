'use client'

export default function BlogError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-zinc-900 font-bold text-lg mb-2">Articoli non disponibili</p>
      <p className="text-zinc-400 text-sm mb-6 text-center max-w-sm">
        Al momento non è possibile caricare gli articoli. Riprova più tardi.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
      >
        Riprova
      </button>
    </div>
  )
}
