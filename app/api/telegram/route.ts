import { NextResponse } from 'next/server'
import { sendTelegramMessage, getErrorMessage } from '@/lib/telegram'

interface SegnalazioneBody {
  chatId?: string
  rispostaId?: string
  testoContenuto?: string
  motivo: string
  dettagli?: string
  segnalatoDa?: string
}

export async function POST(req: Request) {
  try {
    const { chatId, rispostaId, testoContenuto, motivo, dettagli, segnalatoDa }: SegnalazioneBody = await req.json()

    let message = `🚨 <b>NUOVA SEGNALAZIONE</b>\n\n`
    message += `🛑 <b>Motivo:</b> ${motivo}\n`

    if (dettagli) {
      message += `📝 <b>Dettagli:</b> <i>${dettagli}</i>\n`
    }

    if (testoContenuto) {
      message += `\n💬 <b>Contenuto Segnalato:</b>\n<blockquote>${testoContenuto}</blockquote>`
    }

    message += `\n\n<pre><code class="language-info">👤 Segnalato da: ${segnalatoDa}</code></pre>`
    if (chatId) message += `\n<pre>ID Chat: ${chatId}</pre>`
    if (rispostaId) message += `\n<pre>ID Risp: ${rispostaId}</pre>`

    const targetChat = chatId || 'null'
    const targetRisp = rispostaId || 'null'

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🔴 Cancella Contenuto', callback_data: `del|${targetChat}|${targetRisp}` }
        ],
        [
          { text: '🟢 Ignora (Tutto Regolare)', callback_data: `ign|${targetChat}|${targetRisp}` }
        ]
      ]
    }

    await sendTelegramMessage({
      text: message,
      threadId: process.env.TELEGRAM_THREAD_SEGNALAZIONI,
      replyMarkup: inlineKeyboard
    })

    return NextResponse.json({ success: true, message: 'Notifica Telegram inviata.' })
  } catch (error: unknown) {
    console.error('Errore API Telegram:', getErrorMessage(error))
    return NextResponse.json(
      { error: 'Impossibile inviare notifica Telegram.' },
      { status: 500 }
    )
  }
}
