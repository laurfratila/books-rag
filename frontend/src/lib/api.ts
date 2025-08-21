export type BookHit = {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
}

export async function searchBooks(q: string, limit = 10): Promise<BookHit[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export type RagHit = { title: string; snippet: string; score?: number | null }
export async function ragSearch(q: string, k = 3): Promise<RagHit[]> {
  const res = await fetch(`/api/rag/search?q=${encodeURIComponent(q)}&k=${k}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export type RecommendResult = {
  title: string
  summary: string
  message: string
  candidates: string[]
}
export async function recommendChat(q: string, k = 3): Promise<RecommendResult> {
  const res = await fetch(`/api/recommend_chat?q=${encodeURIComponent(q)}&k=${k}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}


// add at the bottom (keep existing exports)

export type UnifiedAnswer = {
  query: string
  title: string
  reason_message: string
  summary: string
  details?: {
    title?: string
    authors?: string[]
    year?: number
    openlibrary_url?: string
    cover_url?: string
  }
  rag_candidates: { title: string; snippet: string; score?: number | null }[]
  k: number
  source: string
}

export async function askUnified(q: string, k = 3): Promise<UnifiedAnswer> {
  const res = await fetch(`/api/answer?q=${encodeURIComponent(q)}&k=${k}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

