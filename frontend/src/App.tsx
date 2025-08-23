import { useEffect, useState } from 'react'
import { askUnified, type UnifiedAnswer } from './lib/api'
import { isTtsAvailable, speakText, cancelSpeech } from './lib/tts'

export default function App() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ans, setAns] = useState<UnifiedAnswer | null>(null)

  const [isSpeaking, setIsSpeaking] = useState(false)
  const ttsOk = isTtsAvailable()

  async function onAsk() {
    if (!q.trim()) return
    setLoading(true); setErr(null); setAns(null); setIsSpeaking(false); cancelSpeech()
    try {
      const a = await askUnified(q.trim(), 3)
      setAns(a)
    } catch (e: any) {
      setErr(e?.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function onListen() {
    if (!ans) return
    if (isSpeaking) {
      cancelSpeech()
      setIsSpeaking(false)
      return
    }
    const text = [
      ans.title ? `Recommended: ${ans.title}.` : '',
      ans.reason_message || '',
      ans.summary || ''
    ].filter(Boolean).join('\n\n')
    speakText(text, {
      rate: 1,
      pitch: 1,
      onend: () => setIsSpeaking(false),
      onerror: () => setIsSpeaking(false),
    })
    setIsSpeaking(true)
  }

  // Stop speaking when navigating away or answer changes
  useEffect(() => () => cancelSpeech(), [])

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Inter, system-ui, Arial' }}>
      <h1>Smart Librarian</h1>
      <p style={{ color: '#666' }}>Ask once → RAG + LLM + Open Library. (Now with a Listen button 🎧)</p>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="what do you recommend for someone that loves stories about war?"
          style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: 16 }}
        />
        <button onClick={onAsk} disabled={loading || !q.trim()} style={{ padding: '0.6rem 1rem' }}>
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      {err && <p style={{ color: 'crimson', marginTop: 12 }}>Error: {err}</p>}
      {loading && <p style={{ marginTop: 12 }}>Loading…</p>}

      {ans && (
        <div style={{
          marginTop: 18, padding: 16, border: '1px solid #ddd', borderRadius: 12,
          display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16
        }}>
          <div>
            {ans.details?.cover_url ? (
              <img src={ans.details.cover_url} alt="cover" style={{ width: '100%', borderRadius: 8 }} />
            ) : (
              <div style={{
                width: 140, height: 210, border: '1px dashed #bbb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: 8
              }}>No Cover</div>
            )}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{ans.title || 'No recommendation found'}</h2>
            <p style={{ margin: '6px 0', color: '#555' }}>
              {(ans.details?.authors ?? []).join(', ')}
              {ans.details?.year ? ` • ${ans.details.year}` : ''}
              {ans.details?.openlibrary_url ? (
                <> • <a href={ans.details.openlibrary_url} target="_blank">Open Library ↗</a></>
              ) : null}
            </p>

            {/* TTS controls */}
            {ttsOk && ans.title && (
              <button onClick={onListen} style={{ padding: '0.4rem 0.8rem', margin: '4px 0' }}>
                {isSpeaking ? 'Stop' : 'Listen'}
              </button>
            )}
            {!ttsOk && <p style={{ color: '#999' }}>TTS not supported in this browser.</p>}

            <p style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{ans.reason_message}</p>
            <h3 style={{ marginTop: 16 }}>Full summary</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{ans.summary}</p>

            {ans.rag_candidates?.length > 0 && (
              <>
                <h4 style={{ marginTop: 16, color: '#444' }}>Other close matches</h4>
                <ul style={{ paddingLeft: 18 }}>
                  {ans.rag_candidates.map((c, i) => (
                    <li key={i}><strong>{c.title}</strong> — {c.snippet}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
