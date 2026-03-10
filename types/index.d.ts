// Define global types to fix TypeScript errors
declare global {
  interface Chat {
    id: number;
    titolo: string;
    lat: number;
    lng: number;
    regione: string;
    risposte_count: number;
    autore: string;
    user_id: string | null;
    created_at: string;
    ultima_attivita?: string;
  }

  interface Risposta {
    id: number;
    testo: string;
    chat_id: number;
    autore: string;
    user_id: string | null;
    created_at: string;
    regione?: string;
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
}

export {};
