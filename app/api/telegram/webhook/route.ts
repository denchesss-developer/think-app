import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Gestione Callback Queries (Click sui bottoni InLine)
    if (data.callback_query) {
      const callbackQuery = data.callback_query;
      const callbackData = callbackQuery.data; // ex: "del|123|null" o "ign|123|456"
      const messageId = callbackQuery.message.message_id;
      const chatIdTelegram = callbackQuery.message.chat.id;

      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

      // Dividiamo la stringa: [azione, chat_id_app, risposta_id_app]
      const [action, targetChat, targetRisp] = callbackData.split('|');

      let responseText = '';
      let errorOccurred = false;

      // AZIONE 1: IGNORA
      if (action === 'ign') {
        responseText = '🟢 Segnalazione ignorata (Tutto regolare).';
      } 
      
      // AZIONE 2: CANCELLA
      else if (action === 'del') {
        if (targetRisp !== 'null') {
          // Cancella la Risposta (Commento)
          const { error } = await supabase.from('risposte').delete().eq('id', targetRisp);
          if (error) {
            console.error('Errore cancellazione risposta:', error);
            errorOccurred = true;
          } else {
            responseText = '🔴 Risposta cancellata dal database.';
          }
        } 
        else if (targetChat !== 'null') {
          // Cancella la Chat Primaria
          const { error } = await supabase.from('chats').delete().eq('id', targetChat);
          if (error) {
            console.error('Errore cancellazione chat:', error);
            errorOccurred = true;
          } else {
            responseText = '🔴 Pensiero (Chat) cancellato dal database.';
          }
        }
      }

      // Se c'è stato un errore su Supabase non nascondiamo il messaggio originale, avvisiamo solo l'admin
      if (errorOccurred) {
        responseText = '❌ Errore durante la cancellazione su Supabase. Controlla i log.';
      }

      // Answer Callback Query per mostrare il toast su Telegram
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: responseText,
          show_alert: false
        })
      });

      // Se l'operazione è andata a buon fine, modifica il messaggio originale rimuovendo i pulsanti
      if (!errorOccurred) {
        const originalText = callbackQuery.message.text;
        const newText = `✅ <b>GESTITO</b>\n<i>${responseText}</i>\n\n---\n\n${originalText}`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatIdTelegram,
            message_id: messageId,
            text: newText,
            parse_mode: 'HTML'
          })
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: "Ricevuto ma non è una callback query." });

  } catch (error: any) {
    console.error('Errore API Webhook Telegram:', error);
    return NextResponse.json(
      { error: 'Errore interno elaborazione webhook.' },
      { status: 500 }
    );
  }
}
