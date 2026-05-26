import { NextResponse } from 'next/server'
import { sendTelegramMessage, getErrorMessage } from '@/lib/telegram'

interface FeedbackBody {
  tipo?: string
  testo?: string
  autore?: string
}

export async function POST(req: Request) {
  try {
    const { tipo, testo, autore }: FeedbackBody = await req.json()

    if (!testo) {
      return NextResponse.json({ error: 'Testo mancante' }, { status: 400 })
    }

    const threadId = process.env.TELEGRAM_THREAD_BUG
    if (!threadId) {
      throw new Error('Configurazione Telegram incompleta')
    }

    const icona = tipo === 'bug' ? '🐛' : '💡'
    const tipoTesto = tipo === 'bug' ? 'BUG REPORT' : 'SUGGERIMENTO'

    let message = `${icona} <b>NUOVO ${tipoTesto}</b>\n\n`
    message += `👤 <b>Da:</b> ${autore || 'Anonimo'}\n`
    message += `📝 <b>Messaggio:</b>\n<i>${testo}</i>`

    await sendTelegramMessage({
      text: message,
      threadId
    })

    return NextResponse.json({ success: true, message: 'Feedback inviato.' })
  } catch (error: unknown) {
    console.error('Errore API Feedback Telegram:', getErrorMessage(error))
    return NextResponse.json(
      { error: 'Impossibile inviare il feedback.' },
      { status: 500 }
    )
  }
}
