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
