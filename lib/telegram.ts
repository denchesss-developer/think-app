import { recordApiUsage } from '@/lib/apiUsage'

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
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    throw new Error('Configurazione Telegram mancante sul server.')
  }

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
