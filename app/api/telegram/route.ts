import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { chatId, rispostaId, motivo, dettagli, segnalatoDa } = await req.json();

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: 'Configurazione Telegram mancante sul server.' },
        { status: 500 }
      );
    }

    // Costruiamo il messaggio formattato
    let message = `🚨 <b>NUOVA SEGNALAZIONE</b>\n\n`;
    message += `👤 <b>Segnalato da:</b> ${segnalatoDa}\n`;
    message += `🏷 <b>Motivo:</b> ${motivo}\n`;
    
    if (dettagli) {
      message += `📝 <b>Dettagli:</b> ${dettagli}\n`;
    }
    
    if (chatId) {
      message += `\n📍 <b>ID Pensiero/Chat:</b> <code>${chatId}</code>`;
    }
    
    if (rispostaId) {
      message += `\n📍 <b>ID Risposta (Commento):</b> <code>${rispostaId}</code>`;
    }

    // Inviamo la richiesta a Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
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
