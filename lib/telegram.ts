import { recordApiUsage } from '@/lib/apiUsage'

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Errore sconosciuto'
}

interface TelegramConfig {
  botToken: string
  chatId: string
}

export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) {
    throw new Error('Configurazione Telegram mancante sul server.')
  }
  return { botToken, chatId }
}

interface SendTelegramMessageParams {
  text: string
  threadId?: string | number | null
  parseMode?: 'HTML' | 'Markdown'
  replyMarkup?: Record<string, unknown>
}

export async function sendTelegramMessage({
  text,
  threadId,
  parseMode = 'HTML',
  replyMarkup
}: SendTelegramMessageParams) {
  const { botToken, chatId } = getTelegramConfig()

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: threadId || undefined,
      text,
      parse_mode: parseMode,
      reply_markup: replyMarkup
    }),
  })

  const data = await response.json()

  await recordApiUsage({
    provider: 'telegram',
    operation: 'send_message',
    success: response.ok,
    statusCode: response.status,
    errorMessage: response.ok ? null : (data?.description || 'Errore invio messaggio Telegram'),
    metadata: {
      threadId: threadId || null
    }
  })

  if (!response.ok) {
    throw new Error(data?.description || 'Errore invio messaggio Telegram')
  }

  return data
}

export async function editTelegramMessage(
  chatIdTelegram: number,
  messageId: number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
) {
  const { botToken } = getTelegramConfig()

  const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatIdTelegram,
      message_id: messageId,
      text,
      parse_mode: parseMode
    })
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data?.description || 'Errore modifica messaggio Telegram')
  }

  return response.json()
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text: string,
  showAlert = false
) {
  const { botToken } = getTelegramConfig()

  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert
    })
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data?.description || 'Errore callback Telegram')
  }

  return response.json()
}
