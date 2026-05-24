// Define global types to fix TypeScript errors
declare global {
  interface Chat {
    id: number;
    titolo: string;
    lat: number;
    lng: number;
    regione: string;
    lat_originale: number | null;
    lng_originale: number | null;
    regione_originale: string | null;
    km_viaggiati: number;
    risposte_count: number;
    autore: string;
    user_id: string | null;
    created_at: string;
    ultima_attivita?: string;
    citta_nome?: string;
    revive_count?: number;
    // News/Domanda fields
    tipo?: 'utente' | 'domanda_notizia' | 'domanda_trending';
    news_id?: string | null;
    blog_slug?: string | null;
    // Trending / Category fields
    country_code?: string | null;
    categoria?: string | null;
  }

  interface Risposta {
    id: number;
    testo: string;
    chat_id: number;
    autore: string;
    user_id: string | null;
    created_at: string;
    regione?: string;
    parent_id?: number | null;
  }

  interface Bookmark {
    id: number;
    user_id: string;
    chat_id: number;
    created_at: string;
    chat?: Chat;
  }

  interface Utente {
    id: string;
    email: string;
    app_metadata?: {
      provider?: string;
    };
  }

  // ---- Gamification ----

  interface DepthLevel {
    id: number
    nome: string
    slug: string
    soglia_punti: number
    descrizione: string | null
    recognition_nome: string | null
    recognition_descrizione: string | null
    recognition_tipo: string | null
  }

  interface Challenge {
    id: string
    title: string
    description: string | null
    categoria: 'attivita' | 'sociale' | 'pensiero' | 'lettura'
    xp_reward: number
    difficulty_order: number
    repeatable: boolean
    progress_target: number
    tracking_type: 'client' | 'hybrid' | 'server'
    status_visibility: 'always'
    icona: string
  }

  interface UserChallengeProgress {
    id: number
    user_id: string | null
    challenge_id: string
    current_value: number
    completed: boolean
    completed_at: string | null
    times_completed: number
    last_notified_at: string | null
    meta?: Record<string, unknown> | null
    updated_at?: string
  }

  interface UserGamification {
    user_id: string | null
    think_points: number
    depth_level: number
    streak_days: number
    last_activity_date: string | null
    updated_at: string
    current_level_points: number
    next_level_points: number
  }

  interface GamificationPopupItem {
    type: 'challenge_completed' | 'challenge_progress' | 'depth_up' | 'think_points' | 'recognition' | 'anon_notice'
    challengeId?: string
    challengeTitle?: string
    challengeIcon?: string
    points?: number
    depthLevel?: number
    depthName?: string
    recognitionName?: string
    counterText?: string
    description?: string
    popupKey: string
  }
}

export {};
