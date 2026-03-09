// lib/bannedWords.ts

// Lista estesa multilingua di parole bannate
// Tutte in minuscolo per il confronto case-insensitive
export const BANNED_WORDS: string[] = [
  // Italiano
  "porno", "cazzo", "merda", "troia", "puttana", "stronzo", "stronza",
  "minchia", "figa", "vaffanculo", "coglione", "bastardo", "bastarda",
  "mignotta", "zoccola", "baldracca", "cesso", "porco", "porca",
  "negro", "negra", "frocio", "finocchio", "culattone", "ricchione",
  "terrone", "mongoloide", "ritardato", "ritardata", "handicappato",
  "scemo", "deficiente", "idiota", "cretino", "imbecille",
  "merdoso", "merdosa", "testa_di_cazzo", "figlio_di_puttana",
  "pompino", "pompinara", "segaiolo", "scopare", "scopata",
  "incazzato", "incazzata", "cazzone", "cazzona", "troione",
  "sborra", "sborrata", "eiaculazione", "orgasmo", "orgasmi",
  "sesso", "sessuale", "sessuali", "prostituta", "prostituto",

  // English
  "fuck", "fucker", "fucking", "motherfucker", "shit", "shitty",
  "bitch", "asshole", "ass", "bastard", "damn", "dick", "dickhead",
  "pussy", "cock", "cocksucker",
  "cunt", "whore", "slut", "nigger", "nigga", "faggot", "fag",
  "retard", "retarded", "moron", "idiot",
  "wanker", "twat", "bollocks", "prick", "tosser",
  "cum", "cumshot", "blowjob", "handjob",
  "rape", "rapist",
  "nazi", "neonazi", "hitler",
  "kike", "spic", "chink", "gook", "wetback", "cracker",
  "tranny", "shemale", "dyke", "lesbo",

  // Spanish
  "puta", "mierda", "joder", "jodido", "jodida", "coño",
  "cabrón", "cabrona", "pendejo", "pendeja", "verga",
  "chingar", "chingada", "chingado", "culero", "culera",
  "maricón", "marica", "perra", "perro", "hijueputa",
  "gonorrea", "malparido", "malparida",
  "culo", "ano", "tetas", "polvo",
  "boludo", "boluda", "pelotudo", "pelotuda",

  // French
  "merde", "putain", "enculé", "enculée", "connard", "connasse",
  "salaud", "salope", "bordel", "foutre", "nique",
  "baise", "baiser", "pédé", "tapette", "gouine",
  "couilles", "bite", "chatte", "niquer",
  "enfoiré", "enfoirée", "branleur", "branleuse",

  // German
  "scheiße", "scheisse", "arschloch", "wichser", "hurensohn",
  "fotze", "schwuchtel", "schwanz", "titten",
  "nutte", "hure", "missgeburt", "behindert",
  "drecksau", "vollidiot", "dummschwätzer",
  "fick", "ficken", "gefickt",

  // Portuguese
  "porra", "caralho", "foda", "foder", "fodido", "fodida",
  "merda", "puta", "vadia", "vagabunda", "cuzão",
  "buceta", "piranha", "otário", "otária",
  "viado", "veado", "bicha", "sapatão",
  "desgraçado", "desgraçada", "arrombado", "arrombada",

  // Dutch
  "kut", "lul", "klootzak", "hoer", "kanker",
  "tering", "tyfus", "godverdomme",

  // Russian (transliterated)
  "suka", "blyad", "blyat", "pizda", "ebat", "mudak",
  "debil", "zalupa", "pidar", "pidoras",

  // Arabic (transliterated)
  "sharmouta", "sharmuta", "kuss", "ibn_sharmouta",
  "himar", "kharaa",

  // Turkish
  "orospu", "amina", "siktir", "göt", "yarak",
  "piç", "pezevenk",

  // Common slurs / hate speech
  "isis", "jihad", "terrorista", "terrorismo",
  "supremacist", "genocide", "holocaust_denier",
  "pedo", "pedofilo", "pedophile",
]

// Controlla se un testo contiene una delle parole vietate
export function containsBannedWord(text: string) {
  const t = (text || "").toLowerCase()
  return BANNED_WORDS.some(word => t.includes(word))
}