import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { tipo, testo, autore } = await req.json();

    if (!testo) {
      return NextResponse.json({ error: 'Testo mancante' }, { status: 400 });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const THREAD_ID = process.env.TELEGRAM_THREAD_BUG; // Topic stanza Bug e Consigli

    if (!BOT_TOKEN || !CHAT_ID || !THREAD_ID) {
      throw new Error('Configurazione Telegram incompleta');
    }

    // Costruzione Messaggio
    const icona = tipo === 'bug' ? '🐛' : '💡';
    const tipoTesto = tipo === 'bug' ? 'BUG REPORT' : 'SUGGERIMENTO';
    
    let message = `${icona} <b>NUOVO ${tipoTesto}</b>\n\n`;
    message += `👤 <b>Da:</b> ${autore || 'Anonimo'}\n`;
    message += `📝 <b>Messaggio:</b>\n<i>${testo}</i>`;

    // Inviamo la richiesta a Telegram specificando il message_thread_id
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
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
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || 'Errore invio messaggio Telegram');
    }

    return NextResponse.json({ success: true, message: 'Feedback inviato.' });
  } catch (error: any) {
    console.error('Errore API Feedback Telegram:', error);
    return NextResponse.json(
      { error: 'Impossibile inviare il feedback.' },
      { status: 500 }
    );
  }
}
