import { recordApiUsage } from '@/lib/apiUsage'

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

interface GeminiCallParams {
  prompt: string
  operation: string
  model?: string
  temperature?: number
  topP?: number
  maxOutputTokens?: number
}

interface GeminiUsageMetadata {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
}

export async function callGeminiText({
  prompt,
  operation,
  model = DEFAULT_GEMINI_MODEL,
  temperature = 0.6,
  topP = 0.8,
  maxOutputTokens = 2048
}: GeminiCallParams) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY non configurata')
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, topP, maxOutputTokens },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    await recordApiUsage({
      provider: 'gemini',
      operation,
      model,
      success: false,
      statusCode: res.status,
      errorMessage: errorText.slice(0, 500)
    })
    throw new Error(`Gemini API error ${res.status}: ${errorText.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const usage = (data?.usageMetadata || {}) as GeminiUsageMetadata

  await recordApiUsage({
    provider: 'gemini',
    operation,
    model,
    inputTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
    metadata: {
      candidateCount: Array.isArray(data?.candidates) ? data.candidates.length : 0
    }
  })

  return { text, data, usage }
}

export function extractJsonObject<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Gemini non ha restituito JSON valido')
  }

  return JSON.parse(jsonMatch[0]) as T
}

export function isWeakDebateQuestion(question: string) {
  const normalized = question.trim().toLowerCase()
  if (!normalized) return true

  const bannedStarts = [
    'cosa ne pensi',
    'che ne pensi',
    'sei d\'accordo',
    'siete d\'accordo',
    'do you think',
    'what do you think',
    'are you in favor'
  ]

  if (bannedStarts.some(pattern => normalized.includes(pattern))) return true
  if (normalized.length < 35) return true

  const genericMarkers = [
    'di questo',
    'di questa situazione',
    'di questo caso',
    'su questo tema',
    'about this',
    'this issue'
  ]

  return genericMarkers.some(pattern => normalized.includes(pattern))
}
