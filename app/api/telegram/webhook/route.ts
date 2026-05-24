import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface TelegramCallbackMessage {
  message_id: number
  chat: { id: number }
  text?: string
}

interface TelegramCallbackQuery {
  id: string
  data: string
  message: TelegramCallbackMessage
}

interface TelegramWebhookPayload {
  callback_query?: TelegramCallbackQuery
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Errore sconosciuto'
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as TelegramWebhookPayload

    if (data.callback_query) {
      const callbackQuery = data.callback_query
      const callbackData = callbackQuery.data
      const messageId = callbackQuery.message.message_id
      const chatIdTelegram = callbackQuery.message.chat.id

      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const [action, targetChat, targetRisp] = callbackData.split('|')

      let responseText = ''
      let errorOccurred = false
      let errorDetails = ''

      if (action === 'ign') {
        responseText = '🟢 Segnalazione ignorata (Tutto regolare).'
      } else if (action === 'del') {
        if (targetRisp !== 'null') {
          await supabaseAdmin.from('segnalazioni').delete().eq('risposta_id', targetRisp)

          const { error } = await supabaseAdmin.from('risposte').delete().eq('id', targetRisp)
          if (error) {
            console.error('Errore cancellazione risposta:', error)
            errorOccurred = true
            errorDetails = error.message
          } else {
            responseText = '🔴 Risposta cancellata dal database.'
          }
        } else if (targetChat !== 'null') {
          await supabaseAdmin.from('segnalazioni').delete().eq('chat_id', targetChat)
          await supabaseAdmin.from('bookmarks').delete().eq('chat_id', targetChat)
          await supabaseAdmin.from('risposte').delete().eq('chat_id', targetChat)

          const { error } = await supabaseAdmin.from('chats').delete().eq('id', targetChat)
          if (error) {
            console.error('Errore cancellazione chat:', error)
            errorOccurred = true
            errorDetails = error.message
          } else {
            responseText = '🔴 Pensiero (Chat) cancellato dal database assieme a commenti e salvataggi.'
          }
        }
      }

      if (errorOccurred) {
        responseText = `❌ Errore DB: ${errorDetails || 'Controlla i log.'}`
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: responseText,
          show_alert: false
        })
      })

      if (!errorOccurred) {
        const originalText = callbackQuery.message.text ?? ''
        const newText = `✅ <b>GESTITO</b>\n<i>${responseText}</i>\n\n---\n\n${originalText}`

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatIdTelegram,
            message_id: messageId,
            text: newText,
            parse_mode: 'HTML'
          })
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, message: 'Ricevuto ma non è una callback query.' })
  } catch (error: unknown) {
    console.error('Errore API Webhook Telegram:', getErrorMessage(error))
    return NextResponse.json(
      { error: 'Errore interno elaborazione webhook.' },
      { status: 500 }
    )
  }
}
