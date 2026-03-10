import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Sicurezza: Vercel invia un header `Authorization: Bearer <CRON_SECRET>`
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get('periodo'); // settimana, mese, trimestre, semestre

    if (!periodo || !['settimana', 'mese', 'trimestre', 'semestre'].includes(periodo)) {
      return NextResponse.json({ error: 'Periodo non valido' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Calcoliamo le finestre temporali
    const now = new Date();
    const startDate = new Date();
    const prevStartDate = new Date();
    
    let nomePeriodo = '';

    if (periodo === 'settimana') {
      nomePeriodo = 'SETTIMANALE';
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate.setDate(prevStartDate.getDate() - 14);
    } else if (periodo === 'mese') {
      nomePeriodo = 'MENSILE';
      startDate.setMonth(startDate.getMonth() - 1);
      prevStartDate.setMonth(prevStartDate.getMonth() - 2);
    } else if (periodo === 'trimestre') {
      nomePeriodo = 'TRIMESTRALE';
      startDate.setMonth(startDate.getMonth() - 3);
      prevStartDate.setMonth(prevStartDate.getMonth() - 6);
    } else if (periodo === 'semestre') {
      nomePeriodo = 'SEMESTRALE';
      startDate.setMonth(startDate.getMonth() - 6);
      prevStartDate.setMonth(prevStartDate.getMonth() - 12);
    }

    const startIso = startDate.toISOString();
    const prevStartIso = prevStartDate.toISOString();

    // Helper per interrogazioni count veloci
    const getCount = async (table: string, gteDate: string | null, ltDate: string | null) => {
      let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      if (gteDate) query = query.gte('created_at', gteDate);
      if (ltDate) query = query.lt('created_at', ltDate);
      const { count } = await query;
      return count || 0;
    };

    // 1. UTENTI
    // Poiché Supabase Auth Auth.users non è facilmente interrogabile in REST, misureremo l'attivitá tramite i profili (se ci sono) o contiamo creatori unici se usiamo account anonimi
    // Se "chats" e "risposte" hanno user_id, contiamo quelli. 
    // Assumiamo che il totale utenti sia misurato qui tramite la tavola "chats" (authors unici).
    // Per un calcolo preciso reale dell'app occorrerebbe la gestione supabase.auth.admin.listUsers() 
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    let totalUsersCount = 0; let nuoviUtentiPeriodo = 0; let nuoviUtentiPrev = 0;

    if (!usersError && users) {
      totalUsersCount = users.length;
      nuoviUtentiPeriodo = users.filter(u => new Date(u.created_at) >= startDate).length;
      nuoviUtentiPrev = users.filter(u => new Date(u.created_at) >= prevStartDate && new Date(u.created_at) < startDate).length;
    }

    // 2. PENSIERI (Chats)
    const chatsTotali = await getCount('chats', null, null);
    const chatsPeriodo = await getCount('chats', startIso, null);
    const chatsPrev = await getCount('chats', prevStartIso, startIso);

    // 3. COMMENTI (Risposte)
    const rispPeriodo = await getCount('risposte', startIso, null);
    const rispPrev = await getCount('risposte', prevStartIso, startIso);

    // 4. SALVATAGGI (Bookmarks)
    const bookPeriodo = await getCount('bookmarks', startIso, null);
    const bookPrev = await getCount('bookmarks', prevStartIso, startIso);

    // 5. SEGNALAZIONI RICEVUTE
    const segnPeriodo = await getCount('segnalazioni', startIso, null);
    const segnPrev = await getCount('segnalazioni', prevStartIso, startIso);

    // 6. ENGAGEMENT RATIO (risposte per pensiero)
    const engagementNow = chatsPeriodo > 0 ? (rispPeriodo / chatsPeriodo).toFixed(1) : '0';
    const engagementPrev = chatsPrev > 0 ? (rispPrev / chatsPrev).toFixed(1) : '0';

    // 7. REGIONE PIÙ ATTIVA nel periodo
    const { data: regionData } = await supabaseAdmin
      .from('chats')
      .select('regione')
      .gte('created_at', startIso);
    let regioneTop = '—';
    if (regionData && regionData.length > 0) {
      const regionCount: Record<string, number> = {};
      regionData.forEach(r => {
        if (r.regione) regionCount[r.regione] = (regionCount[r.regione] || 0) + 1;
      });
      regioneTop = Object.entries(regionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    }

    // 8. ORA DI PUNTA (analisi su risposte + chats nel periodo)
    const { data: orePosts } = await supabaseAdmin
      .from('risposte')
      .select('created_at')
      .gte('created_at', startIso);
    let oraPunta = '—';
    if (orePosts && orePosts.length > 0) {
      const oreCount: Record<number, number> = {};
      orePosts.forEach(r => {
        const h = new Date(r.created_at).getHours();
        oreCount[h] = (oreCount[h] || 0) + 1;
      });
      const topHour = Number(Object.entries(oreCount).sort((a, b) => b[1] - a[1])[0]?.[0]);
      oraPunta = `${topHour}:00 – ${topHour + 1}:00`;
    }

    // 9. PENSIERO PIÙ VIVO (chat con più risposte nel periodo)
    const { data: topChat } = await supabaseAdmin
      .from('chats')
      .select('titolo, risposte_count')
      .gte('created_at', startIso)
      .order('risposte_count', { ascending: false })
      .limit(1)
      .single();
    const pensieroMVP = topChat ? `"${topChat.titolo.slice(0, 60)}${topChat.titolo.length > 60 ? '...' : ''}" (${topChat.risposte_count || 0} risposte)` : '—';

    // Calcolo Percentuali
    const calcVar = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const perc = Math.round(((curr - prev) / prev) * 100);
      return perc >= 0 ? `+${perc}%` : `${perc}%`;
    };

    const varUtenti = calcVar(nuoviUtentiPeriodo, nuoviUtentiPrev);
    const varChats = calcVar(chatsPeriodo, chatsPrev);
    const varRisp = calcVar(rispPeriodo, rispPrev);
    const varBook = calcVar(bookPeriodo, bookPrev);
    const varSegn = calcVar(segnPeriodo, segnPrev);
    const varEngagement = calcVar(Number(engagementNow), Number(engagementPrev));

    // Formatta data in italiano es. "3 Mar 2025"
    const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    const rangeLabel = `${fmt(startDate)} — ${fmt(now)}`;

    // Costruzione Formattazione Messaggio 
    const emojiMap: Record<string, string> = {
      settimana: '🗓', mese: '📅', trimestre: '📊', semestre: '📈'
    };

    let msg = `${emojiMap[periodo]} <b>REPORT ${nomePeriodo} — THINK APP</b>\n`;
    msg += `<i>📆 Periodo: ${rangeLabel}</i>\n\n`;

    msg += `👥 <b>UTENTI REGISTRATI:</b> ${totalUsersCount} totali\n`;
    msg += `↳ <i>Nuovi questo periodo:</i> <b>${nuoviUtentiPeriodo}</b> (<i>${varUtenti}</i> rispetto al precedente)\n\n`;

    msg += `💭 <b>PENSIERI CREATI:</b> ${chatsPeriodo} (Tot. in DB: ${chatsTotali})\n`;
    msg += `↳ <i>Variazione creazione:</i> <b>${varChats}</b>\n\n`;

    msg += `💬 <b>INTERAZIONI (Commenti):</b> ${rispPeriodo}\n`;
    msg += `↳ <i>Variazione interazioni:</i> <b>${varRisp}</b>\n\n`;

    msg += `📊 <b>ENGAGEMENT:</b> ~${engagementNow} risposte per pensiero\n`;
    msg += `↳ <i>Variazione engagement:</i> <b>${varEngagement}</b>\n\n`;

    msg += `💾 <b>PENSIERI SALVATI:</b> ${bookPeriodo}\n`;
    msg += `↳ <i>Interesse generale:</i> <b>${varBook}</b>\n\n`;

    msg += `🚩 <b>SEGNALAZIONI RICEVUTE:</b> ${segnPeriodo}\n`;
    msg += `↳ <i>Variazione segnalazioni:</i> <b>${varSegn}</b>\n\n`;

    msg += `🌍 <b>REGIONE PIÙ ATTIVA:</b> ${regioneTop}\n\n`;

    msg += `🌙 <b>ORA DI PUNTA:</b> ${oraPunta} (fascia oraria più vivace)\n\n`;

    msg += `🏆 <b>PENSIERO MVP:</b>\n<i>${pensieroMVP}</i>\n`;
  
    msg += `\n<i>Continuiamo a spingere su questa rotta! 🚀</i>`;

    // Invio Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      throw new Error('Errore invio report Telegram');
    }

    return NextResponse.json({ success: true, report: 'Inviato' });

  } catch (error: any) {
    console.error('Errore Report API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
