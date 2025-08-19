import { useState } from 'react'
import { searchBooks, ragSearch, recommendChat, type BookHit } from './lib/api'

export default function App() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [olHits, setOlHits] = useState<BookHit[]>([])
  const [ragHits, setRagHits] = useState<{ title: string; snippet: string }[]>([])
  const [rec, setRec] = useState<{ title: string; summary: string; message: string } | null>(null)

  async function runOpenLibrary() {
    setLoading(true); setError(null); setRec(null); setRagHits([])
    try {
      const data = await searchBooks(q.trim(), 10)
      setOlHits(data)
    } catch (e: any) {
      setError(e?.message ?? 'Open Library search failed')
    } finally {
      setLoading(false)
    }
  }

  async function runRag() {
    setLoading(true); setError(null); setRec(null); setOlHits([])
    try {
      const data = await ragSearch(q.trim(), 3)
      setRagHits(data)
    } catch (e: any) {
      setError(e?.message ?? 'RAG search failed')
    } finally {
      setLoading(false)
    }
  }

  async function runRecommend() {
    setLoading(true); setError(null); setOlHits([]); setRagHits([])
    try {
      const r = await recommendChat(q.trim(), 3)
      setRec({ title: r.title, summary: r.summary, message: r.message })
    } catch (e: any) {
      setError(e?.message ?? 'Recommendation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Inter, system-ui, Arial' }}>
      <h1>Smart Librarian</h1>
      <p style={{ color: '#666' }}>Search with Open Library, semantic RAG, or get a smart recommendation (LLM + tool).</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="e.g. friendship and magic"
          style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: 16 }}
        />
        <button onClick={runOpenLibrary} disabled={loading || !q.trim()} style={{ padding: '0.6rem 1rem' }}>
          Open Library
        </button>
        <button onClick={runRag} disabled={loading || !q.trim()} style={{ padding: '0.6rem 1rem' }}>
          RAG search
        </button>
        <button onClick={runRecommend} disabled={loading || !q.trim()} style={{ padding: '0.6rem 1rem' }}>
          Smart recommend
        </button>
      </div>

      {loading && <p style={{ marginTop: 12 }}>Loading…</p>}
      {error && <p style={{ marginTop: 12, color: 'crimson' }}>Error: {error}</p>}

      {/* Open Library results */}
      {olHits.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2>Open Library results</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Title</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Authors</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Year</th>
            </tr></thead>
            <tbody>
              {olHits.map(h => (
                <tr key={h.key}>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{h.title}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{(h.author_name ?? []).slice(0,3).join(', ')}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8, textAlign: 'right' }}>{h.first_publish_year ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RAG hits */}
      {ragHits.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2>RAG matches</h2>
          <ul>
            {ragHits.map((h, i) => (
              <li key={i}><strong>{h.title}</strong> — {h.snippet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Smart recommendation */}
      {rec && (
        <div style={{ marginTop: 16 }}>
          <h2>Recommended: {rec.title}</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{rec.message}</p>
          <h3>Full summary</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{rec.summary}</p>
        </div>
      )}
    </div>
  )
}
