import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { chatId, rispostaId, testoContenuto, motivo, dettagli, segnalatoDa } = await req.json();

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: 'Configurazione Telegram mancante sul server.' },
        { status: 500 }
      );
    }

    // Costruiamo il messaggio formattato in HD
    let message = `🚨 <b>NUOVA SEGNALAZIONE</b>\n\n`;
    message += `🛑 <b>Motivo:</b> ${motivo}\n`;
    
    if (dettagli) {
      message += `📝 <b>Dettagli:</b> <i>${dettagli}</i>\n`;
    }

    if (testoContenuto) {
      message += `\n💬 <b>Contenuto Segnalato:</b>\n<blockquote>${testoContenuto}</blockquote>`;
    }

    // Metadati tecnici in fondo scuri/nascosti
    message += `\n\n<pre><code class="language-info">👤 Segnalato da: ${segnalatoDa}</code></pre>`;
    if (chatId) message += `\n<pre>ID Chat: ${chatId}</pre>`;
    if (rispostaId) message += `\n<pre>ID Risp: ${rispostaId}</pre>`;

    // Costruiamo la payload per i bottoni
    // callback_data ha un limite di 64 byte, quindi usiamo un formato compatto: action|chatId|rispostaId
    const targetChat = chatId || "null";
    const targetRisp = rispostaId || "null";
    
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🔴 Cancella Contenuto', callback_data: `del|${targetChat}|${targetRisp}` }
        ],
        [
          { text: '🟢 Ignora (Tutto Regolare)', callback_data: `ign|${targetChat}|${targetRisp}` }
        ]
      ]
    };

    // Inviamo la richiesta a Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        message_thread_id: process.env.TELEGRAM_THREAD_SEGNALAZIONI,
        text: message,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || 'Errore invio messaggio Telegram');
    }

    return NextResponse.json({ success: true, message: 'Notifica Telegram inviata.' });
  } catch (error: any) {
    console.error('Errore API Telegram:', error);
    return NextResponse.json(
      { error: 'Impossibile inviare notifica Telegram.' },
      { status: 500 }
    );
  }
}
