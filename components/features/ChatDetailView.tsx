"use client"

import { MessageSquare, Quote, User, MapPin, Eye, Share2, Bookmark, Flag, Plane, Newspaper, Reply, Globe } from "lucide-react"
import { timeAgoI18n, translateRegion, type Lang } from "@/lib/i18n"

const LocationBadge = ({ regione, variant = "default" }: { regione: string; variant?: "default" | "brand" }) => (
  <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm ${
    variant === "brand" ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "glass-panel text-zinc-400 border-transparent"
  }`}>
    {regione}
  </div>
);

interface ChatDetailViewProps {
  chatAttiva: Chat
  risposte: Risposta[]
  translatedSeed: { text: string; isTranslated: boolean; loading: boolean }
  translatedReplies: Record<number, { text: string; loading: boolean }>
  bookmarks: Bookmark[]
  t: (key: string) => string
  lang: Lang
  onShare: (chat: Chat) => void
  onToggleBookmark: (chat: Chat) => void
  onReport: (chatId: string, rispostaId: string | undefined, testoContenuto: string | undefined) => void
  onTranslateReply: (replyId: number, originalText: string) => void
  onQuickReply: (autore: string, reply?: Risposta) => void
  onSetReplyingTo: (reply: Risposta | null) => void
}

export default function ChatDetailView({
  chatAttiva,
  risposte,
  translatedSeed,
  translatedReplies,
  bookmarks,
  t,
  lang,
  onShare,
  onToggleBookmark,
  onReport,
  onTranslateReply,
  onQuickReply,
  onSetReplyingTo,
}: ChatDetailViewProps) {
  const isNewsDomanda = chatAttiva.tipo === 'domanda_notizia'

  const buildTree = (replies: Risposta[], parentId: number | null = null): any[] => {
    return replies
      .filter(r => r.parent_id === parentId)
      .map(r => ({ ...r, children: buildTree(replies, r.id) }))
  }

  const renderReplyNode = (node: any, depth = 0): React.ReactNode => (
    <div key={node.id} className="flex flex-col">
      <div className="flex gap-3 group">
        <div className="flex flex-col items-center pt-1 flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-faint)] ring-1 ring-[var(--color-border-subtle)]">
            <User className="w-3.5 h-3.5" />
          </div>
          {node.children.length > 0 && (
            <div className="w-px flex-1 bg-[var(--color-border-subtle)] mt-1.5 opacity-50" />
          )}
        </div>

        <div className="flex-1 pb-4 min-w-0">
          <div className="flex items-start justify-between mb-1 gap-2">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[12px] font-bold text-[var(--color-text-main)] truncate max-w-[120px] cursor-pointer hover:text-[var(--color-brand-blue)]"
                  onClick={() => onQuickReply(node.autore, node)}
                >
                  {node.autore}
                </span>

                <button
                  type="button"
                  onClick={() => onTranslateReply(node.id, node.testo)}
                  disabled={translatedReplies[node.id]?.loading || translatedReplies[node.id]?.text !== undefined}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all ${translatedReplies[node.id]?.text ? 'text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10' : 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-subtle)]'}`}
                  title="Traduci"
                >
                  {translatedReplies[node.id]?.loading ? (
                    <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-tighter">TR</span>
                </button>

                {node.regione && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] flex items-center gap-0.5 bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                    <MapPin className="w-2.5 h-2.5" />
                    {node.regione}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--color-text-faint)] whitespace-nowrap">{timeAgoI18n(node.created_at, lang)}</span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onSetReplyingTo(node)}
                className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10"
                title={t('rispondi')}
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onReport(String(chatAttiva.id), String(node.id), node.testo)}
                className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-red-400"
                title={t('segnala_risposta')}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p
            className={`text-[14px] leading-relaxed font-medium transition-opacity duration-300 break-words cursor-pointer hover:text-[var(--color-brand-blue)]/80 ${translatedReplies[node.id]?.loading ? 'opacity-50' : 'text-[var(--color-text-main)]/90'}`}
            onClick={() => onQuickReply(node.autore, node)}
          >
            {translatedReplies[node.id]?.text || node.testo}
          </p>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="ml-[14px] pl-4 border-l border-transparent/50 space-y-2">
          {node.children.map((child: any) => renderReplyNode(child, depth + 1))}
        </div>
      )}
    </div>
  )

  const tree = buildTree(risposte)

  return (
    <div className="fade-in-up sm:animate-in sm:duration-500 pb-24 relative space-y-8">
      <div className="relative p-6 md:p-10 lg:p-12 rounded-[2.5rem] bg-gradient-to-b from-[var(--color-bg-elevated)] to-[var(--color-bg-main)] border border-white/5 shadow-2xl overflow-hidden group">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none" />
        <Quote className="absolute top-8 right-8 w-40 h-40 text-[var(--color-text-main)] opacity-[0.02] pointer-events-none rotate-6" />

        <div className="flex flex-wrap items-center gap-3 mb-10 relative z-10">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 shadow-sm backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-inner">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[13px] font-bold text-[var(--color-text-main)]">{chatAttiva.autore}</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-white/5 backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{translateRegion(chatAttiva.regione, lang)}</span>
          </div>

          <div className="px-3 py-2 rounded-full bg-transparent">
            <span className="text-[11px] font-medium text-[var(--color-text-faint)] tracking-wide">{chatAttiva.created_at ? timeAgoI18n(chatAttiva.created_at, lang) : "Ora"}</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-[56px] font-black leading-[1.12] tracking-tight text-[var(--color-text-main)] drop-shadow-sm mb-12 relative z-10">
          {translatedSeed.text || chatAttiva.titolo}
        </h1>

        <div className="flex flex-wrap items-center gap-3 relative z-10 mb-8">
          <LocationBadge regione={translateRegion(chatAttiva.regione_originale || chatAttiva.regione, lang)} variant="brand" />
          {isNewsDomanda && (chatAttiva.blog_slug || chatAttiva.news_id) && (
            <a
              href={`/blog/${lang || 'it'}/${chatAttiva.blog_slug || chatAttiva.news_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 text-[11px] font-black uppercase tracking-widest transition-all"
            >
              <Newspaper className="w-4 h-4 shrink-0" />
              Approfondisci
            </a>
          )}
          {chatAttiva.km_viaggiati > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 text-[var(--color-text-muted)] text-[11px] font-black uppercase tracking-widest backdrop-blur-sm">
              <Plane className="w-3.5 h-3.5 shrink-0 text-blue-400" />
              {Math.round(chatAttiva.km_viaggiati)} KM
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2.5 rounded-[2rem] bg-black/5 dark:bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative z-10 mt-6 shadow-inner">
          <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default group">
              <Eye className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-blue-400 transition-colors" />
              <span className="font-bold text-[14px] text-[var(--color-text-main)]">{(chatAttiva.risposte_count || 0) * 14 + 102}</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default group">
              <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-emerald-400 transition-colors" />
              <span className="font-bold text-[14px] text-[var(--color-text-main)]">{chatAttiva.risposte_count || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => onShare(chatAttiva)}
              className="flex items-center justify-center w-14 h-14 rounded-[1.5rem] hover:bg-white/10 transition-all text-[var(--color-text-muted)] hover:text-blue-400 active:scale-95 bg-black/5 dark:bg-transparent"
              title="Condividi"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-[var(--color-border-subtle)] mx-2 opacity-50" />
            <button
              type="button"
              onClick={() => onToggleBookmark(chatAttiva)}
              className={`flex items-center justify-center w-14 h-14 rounded-[1.5rem] transition-all active:scale-95 ${bookmarks.some(b => b.chat?.id === chatAttiva.id) ? "text-amber-500 bg-amber-500/10" : "text-[var(--color-text-muted)] hover:bg-white/10 bg-black/5 dark:bg-transparent"}`}
              title="Salva"
            >
              <Bookmark className="w-5 h-5" fill={bookmarks.some(b => b.chat?.id === chatAttiva.id) ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => onReport(String(chatAttiva.id), undefined, chatAttiva.titolo)}
              className="flex items-center justify-center w-14 h-14 rounded-[1.5rem] hover:bg-white/10 transition-all text-[var(--color-text-muted)] hover:text-red-400 active:scale-95 bg-black/5 dark:bg-transparent"
              title="Segnala"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" />
        </h3>

        {risposte.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[var(--color-text-faint)]" />
            </div>
            <p className="text-[var(--color-text-muted)] text-[14px] font-semibold mb-1">{t('nessuna_risposta')}</p>
            <p className="text-[var(--color-text-faint)] text-[13px] font-medium">{t('sii_il_primo')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tree.map(r => renderReplyNode(r))}
          </div>
        )}
      </div>
    </div>
  )
}
