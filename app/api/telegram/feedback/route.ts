import { NextResponse } from 'next/server'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Errore sconosciuto'
}

export async function POST(req: Request) {
  try {
    const { tipo, testo, autore } = await req.json()

    if (!testo) {
      return NextResponse.json({ error: 'Testo mancante' }, { status: 400 })
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID
    const THREAD_ID = process.env.TELEGRAM_THREAD_BUG

    if (!BOT_TOKEN || !CHAT_ID || !THREAD_ID) {
      throw new Error('Configurazione Telegram incompleta')
    }

    const icona = tipo === 'bug' ? '🐛' : '💡'
    const tipoTesto = tipo === 'bug' ? 'BUG REPORT' : 'SUGGERIMENTO'

    let message = `${icona} <b>NUOVO ${tipoTesto}</b>\n\n`
    message += `👤 <b>Da:</b> ${autore || 'Anonimo'}\n`
    message += `📝 <b>Messaggio:</b>\n<i>${testo}</i>`

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        message_thread_id: THREAD_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data: { description?: string } = await response.json()

    if (!response.ok) {
      throw new Error(data.description || 'Errore invio messaggio Telegram')
    }

    return NextResponse.json({ success: true, message: 'Feedback inviato.' })
  } catch (error: unknown) {
    console.error('Errore API Feedback Telegram:', getErrorMessage(error))
    return NextResponse.json(
      { error: 'Impossibile inviare il feedback.' },
      { status: 500 }
    )
  }
}
