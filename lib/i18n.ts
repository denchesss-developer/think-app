"use client"

import { useState, useEffect, useCallback } from 'react'

// ─── Supported Languages ──────────────────────────────────────────────────────
export type Lang = 'it' | 'en' | 'fr' | 'es' | 'de'
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
]

const STORAGE_KEY = 'think_lang'

// ─── Auto-detection ───────────────────────────────────────────────────────────
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const raw = (navigator.language || '').toLowerCase().slice(0, 2)
  const map: Record<string, Lang> = { it: 'it', en: 'en', fr: 'fr', es: 'es', de: 'de' }
  return map[raw] || 'en'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLang() {
  const [lang, setLangState] = useState<Lang>('it')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored && ['it', 'en', 'fr', 'es', 'de'].includes(stored)) {
      setLangState(stored)
    } else {
      const detected = detectLang()
      setLangState(detected)
      localStorage.setItem(STORAGE_KEY, detected)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['it']?.[key] ?? key
  }, [lang])

  return { lang, setLang, t }
}

// ─── Time Ago (localised) ─────────────────────────────────────────────────────
export function timeAgoI18n(dateString: string, lang: Lang): string {
  const min = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (min < 1) return T_TIME[lang].now
  if (min < 60) return `${min}${T_TIME[lang].m}`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}${T_TIME[lang].h}`
  const days = Math.floor(hrs / 24)
  return `${days}${T_TIME[lang].d}`
}

const T_TIME: Record<Lang, { now: string; m: string; h: string; d: string }> = {
  it: { now: 'Ora',   m: 'm fa', h: 'h fa', d: 'g fa' },
  en: { now: 'Now',   m: 'm ago', h: 'h ago', d: 'd ago' },
  fr: { now: "Maint.", m: 'min',  h: 'h',    d: 'j'    },
  es: { now: 'Ahora', m: 'min',  h: 'h',    d: 'd'    },
  de: { now: 'Jetzt', m: ' Min', h: ' Std',  d: ' T'   },
}

// ─── Plurals helper for "risposte" ────────────────────────────────────────────
export function repliesLabel(count: number, lang: Lang): string {
  const labels: Record<Lang, [string, string]> = {
    it: ['risposta', 'risposte'],
    en: ['reply', 'replies'],
    fr: ['réponse', 'réponses'],
    es: ['respuesta', 'respuestas'],
    de: ['Antwort', 'Antworten'],
  }
  const [s, p] = labels[lang]
  return `${count} ${count === 1 ? s : p}`
}

// ─── Vita label (activity view) ───────────────────────────────────────────────
export function vitaLabelI18n(giorni: number, lang: Lang): string {
  if (giorni === 0) return TRANSLATIONS[lang]['today'] || 'Today'
  return `${giorni}${T_TIME[lang].d.replace(' ago', '').replace(' fa', '').trim()}`
}

// ─── Translations Dictionary ──────────────────────────────────────────────────
const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ITALIANO (base)
  // ═══════════════════════════════════════════════════════════════════════════
  it: {
    // ── Feed ──
    feed: 'Feed',
    pensieri_sparsi: 'PENSIERI SPARSI',
    cerca_pensieri: 'Cerca pensieri nel mondo...',
    archiviati: 'Archiviati',
    sfoglia_archivio: 'Sfoglia pensieri passati e conclusi',
    recenti: 'Recenti',
    tendenze: 'Tendenze',
    vicini: 'Vicini',
    archivio: 'Archivio',

    // ── Chat view ──
    attivo: 'Attivo',
    in_declino: 'In declino',
    sviluppi: 'Sviluppi',
    nessuna_risposta: 'Nessuna risposta ancora',
    sii_il_primo: 'Sii il primo a contribuire a questo pensiero.',
    segnala: 'Segnala',
    condividi: 'Condividi',
    salva: 'Salva',
    segnala_risposta: 'Segnala risposta',
    rispondi: 'Rispondi...',

    // ── Nav / Tabs ──
    attivita: 'Attività',
    profilo: 'Profilo',
    lancia_pensiero: 'Lancia un pensiero',

    // ── Account ──
    account: 'Account',
    visitatore_anonimo: 'Visitatore Anonimo',
    sblocca_potenziale: 'Sblocca il Potenziale',
    crea_account_desc: 'Crea un account per salvare pensieri, tenere traccia delle risposte e molto altro.',
    accedi_registrati: 'Accedi o Registrati',
    impostazioni: 'Impostazioni',
    lingua_app: 'Lingua App',
    tema_app: 'Tema App',
    sistema: 'Sistema',
    chiaro: 'Chiaro',
    scuro: 'Scuro',
    notifiche_push: 'Notifiche Push',
    presto: 'Presto',
    connesso_google: 'Connesso con Google',
    connesso_email: 'Connesso via Email',
    account_verificato: 'Account verificato',
    badge_pioniere: 'Pioniera di Think',
    badge_desc: 'Sei tra i primi esploratori ad utilizzare Think. Il tuo account ha il badge premium attivo.',
    pseudonimo: 'Il tuo Pseudonimo Globale',
    nick_regole: 'Solo lettere, numeri e underscore. 3–20 caratteri.',
    logout: 'Logout',
    nick_salvato: 'Nickname salvato con successo!',
    errore_salvataggio: 'Errore durante il salvataggio',

    // ── Feedback ──
    segnala_bug: 'Segnala un bug o dai un consiglio 💡',
    lascia_messaggio: 'Lasciaci un messaggio',
    bug: '🐛 Bug',
    consiglio: '💡 Consiglio',
    descrivi_problema: 'Descrivi il problema...',
    tua_idea: 'La tua idea o suggerimento...',
    ricevuto_grazie: '✅ Ricevuto, grazie!',
    errore_riprova: '❌ Errore. Riprova.',
    annulla: 'Annulla',
    invio: 'Invio...',
    invia: 'Invia',

    // ── Modals ──
    nuovo_pensiero: 'Nuovo Pensiero',
    placeholder_componi: 'A cosa stai pensando nel tuo angolo di mondo?',
    lancia: 'Lancia',
    il_tuo_nome: 'Il tuo Nome',
    scegli_nome: 'Scegli un nome per farti riconoscere dagli altri esploratori.',
    salva_nome: 'Salva Nome',
    salvataggio: 'Salvataggio...',
    accedi_think: 'Accedi a Think',
    nessuna_password: 'Nessuna password da ricordare. Entra e proteggi il tuo nome per sempre.',
    continua_google: 'Continua con Google',
    oppure_email: 'oppure via email',
    ricevi_magic: 'Ricevi Magic Link',
    invio_corso: 'Invio in corso...',
    controlla_mail: 'Controlla la Mail',
    mail_inviata: 'Abbiamo inviato un magic link a',
    mail_clicca: '. Cliccalo dal tuo dispositivo per entrare!',
    benvenuto: 'Benvenuta/o su Think!',
    quasi_pronto: 'Sei quasi pronto ad entrare. Come vuoi farti chiamare nel mondo? Scegli il tuo nickname unico.',
    esempio_nick: 'Esempio: Esploratore_99',
    caratteri_nick: '3-20 caratteri, solo lettere, numeri e _',
    inizia_esplorazione: "Inizia l'Esplorazione",
    nick_gia_preso: 'Questo nickname è già stato preso da un altro utente',
    errore_salv_riprova: 'Errore durante il salvataggio. Riprova.',

    // ── Activity ──
    la_tua_cronologia: 'La tua cronologia',
    accedi_attivita: 'Accedi per vedere la tua attività',
    pensieri_risposte_qui: 'I tuoi pensieri, risposte e segnalibri appariranno qui.',
    miei_pensieri: 'I miei Pensieri',
    mie_risposte: 'Le mie Risposte',
    pensieri_salvati: 'Pensieri Salvati',
    no_pensieri: 'Non hai ancora creato nessun pensiero.',
    no_risposte: 'Non hai ancora risposto a nessun pensiero.',
    no_salvati: 'Non hai salvato nessun pensiero.',
    today: 'Oggi',

    // ── Report ──
    segnala_contenuto: 'Segnala Contenuto',
    segnalazione_inviata: 'Segnalazione Inviata',
    grazie_segnalazione: 'Grazie per aver segnalato. Il nostro team esaminerà il contenuto.',
    chiudi: 'Chiudi',
    seleziona_motivo: 'Seleziona il motivo della segnalazione:',
    motivo_spam: 'Spam o pubblicità',
    motivo_odio: "Contenuto d'odio o discriminazione",
    motivo_violenza: 'Violenza o minacce',
    motivo_nsfw: 'Contenuti inappropriati',
    motivo_altro: 'Altro',
    invia_segnalazione: 'Invia Segnalazione',

    // ── MapGlobe (STILI_STATO) ──
    stato_nuova: 'Nuova',
    stato_crescita: 'Crescita',
    stato_popolare: 'Popolare',
    stato_inattiva: 'Inattiva',
    stato_archivio: 'Archivio',

    // ── ChatCard ──
    condividi_pensiero: 'Condividi pensiero',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════════
  en: {
    feed: 'Feed',
    pensieri_sparsi: 'SCATTERED THOUGHTS',
    cerca_pensieri: 'Search thoughts around the world...',
    archiviati: 'Archived',
    sfoglia_archivio: 'Browse past and concluded thoughts',
    recenti: 'Recent',
    tendenze: 'Trending',
    vicini: 'Nearby',
    archivio: 'Archive',

    attivo: 'Active',
    in_declino: 'Declining',
    sviluppi: 'Developments',
    nessuna_risposta: 'No replies yet',
    sii_il_primo: 'Be the first to contribute to this thought.',
    segnala: 'Report',
    condividi: 'Share',
    salva: 'Save',
    segnala_risposta: 'Report reply',
    rispondi: 'Reply...',

    attivita: 'Activity',
    profilo: 'Profile',
    lancia_pensiero: 'Launch a thought',

    account: 'Account',
    visitatore_anonimo: 'Anonymous Visitor',
    sblocca_potenziale: 'Unlock Your Potential',
    crea_account_desc: 'Create an account to save thoughts, track replies, and much more.',
    accedi_registrati: 'Log In or Sign Up',
    impostazioni: 'Settings',
    lingua_app: 'App Language',
    tema_app: 'App Theme',
    sistema: 'System',
    chiaro: 'Light',
    scuro: 'Dark',
    notifiche_push: 'Push Notifications',
    presto: 'Soon',
    connesso_google: 'Connected with Google',
    connesso_email: 'Connected via Email',
    account_verificato: 'Verified account',
    badge_pioniere: 'Think Pioneer',
    badge_desc: "You're among the first explorers to use Think. Your account has the premium badge active.",
    pseudonimo: 'Your Global Pseudonym',
    nick_regole: 'Letters, numbers and underscores only. 3–20 characters.',
    logout: 'Logout',
    nick_salvato: 'Nickname saved successfully!',
    errore_salvataggio: 'Error saving',

    segnala_bug: 'Report a bug or give a suggestion 💡',
    lascia_messaggio: 'Leave us a message',
    bug: '🐛 Bug',
    consiglio: '💡 Suggestion',
    descrivi_problema: 'Describe the issue...',
    tua_idea: 'Your idea or suggestion...',
    ricevuto_grazie: '✅ Received, thanks!',
    errore_riprova: '❌ Error. Try again.',
    annulla: 'Cancel',
    invio: 'Sending...',
    invia: 'Send',

    nuovo_pensiero: 'New Thought',
    placeholder_componi: 'What are you thinking in your corner of the world?',
    lancia: 'Launch',
    il_tuo_nome: 'Your Name',
    scegli_nome: 'Choose a name to be recognised by other explorers.',
    salva_nome: 'Save Name',
    salvataggio: 'Saving...',
    accedi_think: 'Log In to Think',
    nessuna_password: 'No password to remember. Log in and protect your name forever.',
    continua_google: 'Continue with Google',
    oppure_email: 'or via email',
    ricevi_magic: 'Get Magic Link',
    invio_corso: 'Sending...',
    controlla_mail: 'Check Your Email',
    mail_inviata: 'We sent a magic link to',
    mail_clicca: '. Click it from your device to enter!',
    benvenuto: 'Welcome to Think!',
    quasi_pronto: 'You\'re almost ready. What do you want to be called? Choose your unique nickname.',
    esempio_nick: 'Example: Explorer_99',
    caratteri_nick: '3-20 characters, letters, numbers and _ only',
    inizia_esplorazione: 'Start Exploring',
    nick_gia_preso: 'This nickname is already taken by another user',
    errore_salv_riprova: 'Error saving. Please try again.',

    la_tua_cronologia: 'Your timeline',
    accedi_attivita: 'Log in to see your activity',
    pensieri_risposte_qui: 'Your thoughts, replies and bookmarks will appear here.',
    miei_pensieri: 'My Thoughts',
    mie_risposte: 'My Replies',
    pensieri_salvati: 'Saved Thoughts',
    no_pensieri: "You haven't created any thoughts yet.",
    no_risposte: "You haven't replied to any thoughts yet.",
    no_salvati: "You haven't saved any thoughts.",
    today: 'Today',

    segnala_contenuto: 'Report Content',
    segnalazione_inviata: 'Report Sent',
    grazie_segnalazione: 'Thanks for reporting. Our team will review the content.',
    chiudi: 'Close',
    seleziona_motivo: 'Select the reason for reporting:',
    motivo_spam: 'Spam or advertising',
    motivo_odio: 'Hate speech or discrimination',
    motivo_violenza: 'Violence or threats',
    motivo_nsfw: 'Inappropriate content',
    motivo_altro: 'Other',
    invia_segnalazione: 'Submit Report',

    stato_nuova: 'New',
    stato_crescita: 'Growing',
    stato_popolare: 'Popular',
    stato_inattiva: 'Inactive',
    stato_archivio: 'Archive',

    condividi_pensiero: 'Share thought',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FRANÇAIS
  // ═══════════════════════════════════════════════════════════════════════════
  fr: {
    feed: 'Fil',
    pensieri_sparsi: 'PENSÉES ÉPARSES',
    cerca_pensieri: 'Chercher des pensées dans le monde...',
    archiviati: 'Archivés',
    sfoglia_archivio: 'Parcourir les pensées passées et conclues',
    recenti: 'Récents',
    tendenze: 'Tendances',
    vicini: 'Proches',
    archivio: 'Archives',

    attivo: 'Actif',
    in_declino: 'En déclin',
    sviluppi: 'Développements',
    nessuna_risposta: 'Aucune réponse encore',
    sii_il_primo: 'Soyez le premier à contribuer à cette pensée.',
    segnala: 'Signaler',
    condividi: 'Partager',
    salva: 'Sauvegarder',
    segnala_risposta: 'Signaler la réponse',
    rispondi: 'Répondre...',

    attivita: 'Activité',
    profilo: 'Profil',
    lancia_pensiero: 'Lancer une pensée',

    account: 'Compte',
    visitatore_anonimo: 'Visiteur Anonyme',
    sblocca_potenziale: 'Libérez le Potentiel',
    crea_account_desc: 'Créez un compte pour sauvegarder vos pensées, suivre les réponses et bien plus.',
    accedi_registrati: "S'inscrire ou Se connecter",
    impostazioni: 'Paramètres',
    lingua_app: 'Langue',
    tema_app: 'Thème',
    sistema: 'Système',
    chiaro: 'Clair',
    scuro: 'Sombre',
    notifiche_push: 'Notifications Push',
    presto: 'Bientôt',
    connesso_google: 'Connecté avec Google',
    connesso_email: 'Connecté par Email',
    account_verificato: 'Compte vérifié',
    badge_pioniere: 'Pionnier de Think',
    badge_desc: "Vous êtes parmi les premiers explorateurs à utiliser Think. Votre compte a le badge premium actif.",
    pseudonimo: 'Votre Pseudonyme Global',
    nick_regole: 'Lettres, chiffres et underscores uniquement. 3–20 caractères.',
    logout: 'Déconnexion',
    nick_salvato: 'Pseudo sauvegardé avec succès !',
    errore_salvataggio: 'Erreur lors de la sauvegarde',

    segnala_bug: 'Signaler un bug ou donner un conseil 💡',
    lascia_messaggio: 'Laissez-nous un message',
    bug: '🐛 Bug',
    consiglio: '💡 Conseil',
    descrivi_problema: 'Décrivez le problème...',
    tua_idea: 'Votre idée ou suggestion...',
    ricevuto_grazie: '✅ Reçu, merci !',
    errore_riprova: '❌ Erreur. Réessayez.',
    annulla: 'Annuler',
    invio: 'Envoi...',
    invia: 'Envoyer',

    nuovo_pensiero: 'Nouvelle Pensée',
    placeholder_componi: 'À quoi pensez-vous dans votre coin du monde ?',
    lancia: 'Lancer',
    il_tuo_nome: 'Votre Nom',
    scegli_nome: 'Choisissez un nom pour être reconnu par les autres explorateurs.',
    salva_nome: 'Sauvegarder',
    salvataggio: 'Sauvegarde...',
    accedi_think: 'Connexion à Think',
    nessuna_password: 'Aucun mot de passe à retenir. Connectez-vous et protégez votre nom pour toujours.',
    continua_google: 'Continuer avec Google',
    oppure_email: 'ou par email',
    ricevi_magic: 'Recevoir le Magic Link',
    invio_corso: 'Envoi en cours...',
    controlla_mail: 'Vérifiez votre boîte mail',
    mail_inviata: 'Nous avons envoyé un magic link à',
    mail_clicca: '. Cliquez dessus depuis votre appareil pour entrer !',
    benvenuto: 'Bienvenue sur Think !',
    quasi_pronto: 'Vous êtes presque prêt. Comment voulez-vous être appelé ? Choisissez votre pseudo unique.',
    esempio_nick: 'Exemple : Explorateur_99',
    caratteri_nick: '3-20 caractères, lettres, chiffres et _ uniquement',
    inizia_esplorazione: "Commencer l'Exploration",
    nick_gia_preso: 'Ce pseudo est déjà pris par un autre utilisateur',
    errore_salv_riprova: 'Erreur lors de la sauvegarde. Réessayez.',

    la_tua_cronologia: 'Votre historique',
    accedi_attivita: 'Connectez-vous pour voir votre activité',
    pensieri_risposte_qui: 'Vos pensées, réponses et favoris apparaîtront ici.',
    miei_pensieri: 'Mes Pensées',
    mie_risposte: 'Mes Réponses',
    pensieri_salvati: 'Pensées Sauvegardées',
    no_pensieri: "Vous n'avez encore créé aucune pensée.",
    no_risposte: "Vous n'avez encore répondu à aucune pensée.",
    no_salvati: "Vous n'avez sauvegardé aucune pensée.",
    today: "Aujourd'hui",

    segnala_contenuto: 'Signaler le Contenu',
    segnalazione_inviata: 'Signalement Envoyé',
    grazie_segnalazione: 'Merci pour le signalement. Notre équipe examinera le contenu.',
    chiudi: 'Fermer',
    seleziona_motivo: 'Sélectionnez le motif du signalement :',
    motivo_spam: 'Spam ou publicité',
    motivo_odio: 'Discours haineux ou discrimination',
    motivo_violenza: 'Violence ou menaces',
    motivo_nsfw: 'Contenu inapproprié',
    motivo_altro: 'Autre',
    invia_segnalazione: 'Envoyer le Signalement',

    stato_nuova: 'Nouvelle',
    stato_crescita: 'Croissance',
    stato_popolare: 'Populaire',
    stato_inattiva: 'Inactive',
    stato_archivio: 'Archives',

    condividi_pensiero: 'Partager la pensée',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ESPAÑOL
  // ═══════════════════════════════════════════════════════════════════════════
  es: {
    feed: 'Feed',
    pensieri_sparsi: 'PENSAMIENTOS DISPERSOS',
    cerca_pensieri: 'Buscar pensamientos en el mundo...',
    archiviati: 'Archivados',
    sfoglia_archivio: 'Explorar pensamientos pasados y concluidos',
    recenti: 'Recientes',
    tendenze: 'Tendencias',
    vicini: 'Cercanos',
    archivio: 'Archivo',

    attivo: 'Activo',
    in_declino: 'En declive',
    sviluppi: 'Desarrollos',
    nessuna_risposta: 'Sin respuestas aún',
    sii_il_primo: 'Sé el primero en contribuir a este pensamiento.',
    segnala: 'Reportar',
    condividi: 'Compartir',
    salva: 'Guardar',
    segnala_risposta: 'Reportar respuesta',
    rispondi: 'Responder...',

    attivita: 'Actividad',
    profilo: 'Perfil',
    lancia_pensiero: 'Lanzar un pensamiento',

    account: 'Cuenta',
    visitatore_anonimo: 'Visitante Anónimo',
    sblocca_potenziale: 'Desbloquea tu Potencial',
    crea_account_desc: 'Crea una cuenta para guardar pensamientos, seguir respuestas y mucho más.',
    accedi_registrati: 'Iniciar sesión o Registrarse',
    impostazioni: 'Ajustes',
    lingua_app: 'Idioma',
    tema_app: 'Tema',
    sistema: 'Sistema',
    chiaro: 'Claro',
    scuro: 'Oscuro',
    notifiche_push: 'Notificaciones Push',
    presto: 'Próximamente',
    connesso_google: 'Conectado con Google',
    connesso_email: 'Conectado por Email',
    account_verificato: 'Cuenta verificada',
    badge_pioniere: 'Pionero de Think',
    badge_desc: 'Eres de los primeros exploradores en usar Think. Tu cuenta tiene la insignia premium activa.',
    pseudonimo: 'Tu Seudónimo Global',
    nick_regole: 'Solo letras, números y guiones bajos. 3–20 caracteres.',
    logout: 'Cerrar sesión',
    nick_salvato: '¡Nickname guardado con éxito!',
    errore_salvataggio: 'Error al guardar',

    segnala_bug: 'Reportar un bug o dar un consejo 💡',
    lascia_messaggio: 'Déjanos un mensaje',
    bug: '🐛 Bug',
    consiglio: '💡 Consejo',
    descrivi_problema: 'Describe el problema...',
    tua_idea: 'Tu idea o sugerencia...',
    ricevuto_grazie: '✅ Recibido, ¡gracias!',
    errore_riprova: '❌ Error. Inténtalo de nuevo.',
    annulla: 'Cancelar',
    invio: 'Enviando...',
    invia: 'Enviar',

    nuovo_pensiero: 'Nuevo Pensamiento',
    placeholder_componi: '¿En qué estás pensando en tu rincón del mundo?',
    lancia: 'Lanzar',
    il_tuo_nome: 'Tu Nombre',
    scegli_nome: 'Elige un nombre para ser reconocido por otros exploradores.',
    salva_nome: 'Guardar Nombre',
    salvataggio: 'Guardando...',
    accedi_think: 'Entrar a Think',
    nessuna_password: 'Sin contraseña que recordar. Entra y protege tu nombre para siempre.',
    continua_google: 'Continuar con Google',
    oppure_email: 'o por email',
    ricevi_magic: 'Recibir Magic Link',
    invio_corso: 'Enviando...',
    controlla_mail: 'Revisa tu correo',
    mail_inviata: 'Hemos enviado un magic link a',
    mail_clicca: '. Haz clic desde tu dispositivo para entrar.',
    benvenuto: '¡Bienvenido/a a Think!',
    quasi_pronto: 'Casi listo para entrar. ¿Cómo quieres que te llamen? Elige tu nickname único.',
    esempio_nick: 'Ejemplo: Explorador_99',
    caratteri_nick: '3-20 caracteres, solo letras, números y _',
    inizia_esplorazione: 'Comenzar la Exploración',
    nick_gia_preso: 'Este nickname ya está en uso por otro usuario',
    errore_salv_riprova: 'Error al guardar. Inténtalo de nuevo.',

    la_tua_cronologia: 'Tu historial',
    accedi_attivita: 'Inicia sesión para ver tu actividad',
    pensieri_risposte_qui: 'Tus pensamientos, respuestas y marcadores aparecerán aquí.',
    miei_pensieri: 'Mis Pensamientos',
    mie_risposte: 'Mis Respuestas',
    pensieri_salvati: 'Pensamientos Guardados',
    no_pensieri: 'Aún no has creado ningún pensamiento.',
    no_risposte: 'Aún no has respondido a ningún pensamiento.',
    no_salvati: 'No has guardado ningún pensamiento.',
    today: 'Hoy',

    segnala_contenuto: 'Reportar Contenido',
    segnalazione_inviata: 'Reporte Enviado',
    grazie_segnalazione: 'Gracias por el reporte. Nuestro equipo revisará el contenido.',
    chiudi: 'Cerrar',
    seleziona_motivo: 'Selecciona el motivo del reporte:',
    motivo_spam: 'Spam o publicidad',
    motivo_odio: 'Discurso de odio o discriminación',
    motivo_violenza: 'Violencia o amenazas',
    motivo_nsfw: 'Contenido inapropiado',
    motivo_altro: 'Otro',
    invia_segnalazione: 'Enviar Reporte',

    stato_nuova: 'Nueva',
    stato_crescita: 'Crecimiento',
    stato_popolare: 'Popular',
    stato_inattiva: 'Inactiva',
    stato_archivio: 'Archivo',

    condividi_pensiero: 'Compartir pensamiento',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEUTSCH
  // ═══════════════════════════════════════════════════════════════════════════
  de: {
    feed: 'Feed',
    pensieri_sparsi: 'VERSTREUTE GEDANKEN',
    cerca_pensieri: 'Gedanken weltweit suchen...',
    archiviati: 'Archiviert',
    sfoglia_archivio: 'Vergangene und abgeschlossene Gedanken durchsuchen',
    recenti: 'Neueste',
    tendenze: 'Trends',
    vicini: 'In der Nähe',
    archivio: 'Archiv',

    attivo: 'Aktiv',
    in_declino: 'Abnehmend',
    sviluppi: 'Entwicklungen',
    nessuna_risposta: 'Noch keine Antworten',
    sii_il_primo: 'Sei der Erste, der zu diesem Gedanken beiträgt.',
    segnala: 'Melden',
    condividi: 'Teilen',
    salva: 'Speichern',
    segnala_risposta: 'Antwort melden',
    rispondi: 'Antworten...',

    attivita: 'Aktivität',
    profilo: 'Profil',
    lancia_pensiero: 'Gedanken starten',

    account: 'Konto',
    visitatore_anonimo: 'Anonymer Besucher',
    sblocca_potenziale: 'Potenzial freischalten',
    crea_account_desc: 'Erstelle ein Konto, um Gedanken zu speichern, Antworten zu verfolgen und vieles mehr.',
    accedi_registrati: 'Anmelden oder Registrieren',
    impostazioni: 'Einstellungen',
    lingua_app: 'Sprache',
    tema_app: 'Farbschema',
    sistema: 'System',
    chiaro: 'Hell',
    scuro: 'Dunkel',
    notifiche_push: 'Push-Benachrichtigungen',
    presto: 'Bald',
    connesso_google: 'Mit Google verbunden',
    connesso_email: 'Per E-Mail verbunden',
    account_verificato: 'Verifiziertes Konto',
    badge_pioniere: 'Think-Pionier',
    badge_desc: 'Du gehörst zu den ersten Entdeckern von Think. Dein Konto hat das Premium-Abzeichen.',
    pseudonimo: 'Dein globales Pseudonym',
    nick_regole: 'Nur Buchstaben, Zahlen und Unterstriche. 3–20 Zeichen.',
    logout: 'Abmelden',
    nick_salvato: 'Nickname erfolgreich gespeichert!',
    errore_salvataggio: 'Fehler beim Speichern',

    segnala_bug: 'Bug melden oder Vorschlag machen 💡',
    lascia_messaggio: 'Hinterlasse uns eine Nachricht',
    bug: '🐛 Bug',
    consiglio: '💡 Vorschlag',
    descrivi_problema: 'Beschreibe das Problem...',
    tua_idea: 'Deine Idee oder Vorschlag...',
    ricevuto_grazie: '✅ Erhalten, danke!',
    errore_riprova: '❌ Fehler. Erneut versuchen.',
    annulla: 'Abbrechen',
    invio: 'Sende...',
    invia: 'Senden',

    nuovo_pensiero: 'Neuer Gedanke',
    placeholder_componi: 'Was denkst du gerade in deinem Teil der Welt?',
    lancia: 'Starten',
    il_tuo_nome: 'Dein Name',
    scegli_nome: 'Wähle einen Namen, um von anderen Entdeckern erkannt zu werden.',
    salva_nome: 'Name speichern',
    salvataggio: 'Speichere...',
    accedi_think: 'Bei Think anmelden',
    nessuna_password: 'Kein Passwort nötig. Melde dich an und sichere deinen Namen für immer.',
    continua_google: 'Weiter mit Google',
    oppure_email: 'oder per E-Mail',
    ricevi_magic: 'Magic Link erhalten',
    invio_corso: 'Wird gesendet...',
    controlla_mail: 'Überprüfe deine E-Mail',
    mail_inviata: 'Wir haben einen Magic Link gesendet an',
    mail_clicca: '. Klicke darauf von deinem Gerät, um einzutreten!',
    benvenuto: 'Willkommen bei Think!',
    quasi_pronto: 'Du bist fast bereit. Wie möchtest du genannt werden? Wähle deinen einzigartigen Nickname.',
    esempio_nick: 'Beispiel: Entdecker_99',
    caratteri_nick: '3-20 Zeichen, nur Buchstaben, Zahlen und _',
    inizia_esplorazione: 'Erkundung starten',
    nick_gia_preso: 'Dieser Nickname wird bereits von einem anderen Benutzer verwendet',
    errore_salv_riprova: 'Fehler beim Speichern. Bitte erneut versuchen.',

    la_tua_cronologia: 'Dein Verlauf',
    accedi_attivita: 'Melde dich an, um deine Aktivität zu sehen',
    pensieri_risposte_qui: 'Deine Gedanken, Antworten und Lesezeichen erscheinen hier.',
    miei_pensieri: 'Meine Gedanken',
    mie_risposte: 'Meine Antworten',
    pensieri_salvati: 'Gespeicherte Gedanken',
    no_pensieri: 'Du hast noch keine Gedanken erstellt.',
    no_risposte: 'Du hast noch auf keinen Gedanken geantwortet.',
    no_salvati: 'Du hast keine Gedanken gespeichert.',
    today: 'Heute',

    segnala_contenuto: 'Inhalt melden',
    segnalazione_inviata: 'Meldung gesendet',
    grazie_segnalazione: 'Danke für die Meldung. Unser Team wird den Inhalt überprüfen.',
    chiudi: 'Schließen',
    seleziona_motivo: 'Grund für die Meldung auswählen:',
    motivo_spam: 'Spam oder Werbung',
    motivo_odio: 'Hassrede oder Diskriminierung',
    motivo_violenza: 'Gewalt oder Drohungen',
    motivo_nsfw: 'Unangemessener Inhalt',
    motivo_altro: 'Sonstiges',
    invia_segnalazione: 'Meldung senden',

    stato_nuova: 'Neu',
    stato_crescita: 'Wachstum',
    stato_popolare: 'Beliebt',
    stato_inattiva: 'Inaktiv',
    stato_archivio: 'Archiv',

    condividi_pensiero: 'Gedanken teilen',
  },
}
