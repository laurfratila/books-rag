import { useState } from 'react'
import { searchBooks, type BookHit } from './lib/api'

export default function App() {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<BookHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true); setError(null)
    try {
      const data = await searchBooks(q.trim(), 10)
      setHits(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to search')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Inter, system-ui, Arial' }}>
      <h1>Books Search</h1>
      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Try: harry potter"
          style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: 16 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.6rem 1rem' }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson', marginTop: 12 }}>Error: {error}</p>}

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Title</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Authors</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>First year</th>
          </tr>
        </thead>
        <tbody>
          {hits.map(h => (
            <tr key={h.key}>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{h.title}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                {(h.author_name ?? []).slice(0, 3).join(', ')}
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8, textAlign: 'right' }}>
                {h.first_publish_year ?? ''}
              </td>
            </tr>
          ))}
          {!loading && hits.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 8, color: '#666' }}>No results yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
