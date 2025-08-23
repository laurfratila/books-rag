import { useEffect, useState, useRef } from 'react'
import { askUnified, type UnifiedAnswer } from './lib/api'
import { isTtsAvailable, speakText, cancelSpeech } from './lib/tts'
import { isSttAvailable, createRecognizer } from './lib/stt'

// ---------- tiny inline icons ----------
function IconSparkles(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 2l1.7 4.7L18 8.4l-4.3 1.7L12 15l-1.7-4.9L6 8.4l4.3-1.7L12 2zM5 15l.9 2.4L8 18l-2.1.6L5 21l-.9-2.4L2 18l2.1-.6L5 15zm12 2l1.2 3.3L21 21l-2.8.8L17 25l-1.2-3.2L13 21l2.8-.7L17 17z" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
function IconSend(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconLink(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M10 14a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 10a5 5 0 00-7.07 0L4.1 12.83a5 5 0 007.07 7.07L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconMic(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 10v1a7 7 0 0014 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconStop(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}



// ---------- skeleton ----------
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800/60 backdrop-blur shadow-soft p-4 md:p-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-6">
        <div className="w-[160px] h-[240px] rounded-xl bg-white/5" />
        <div className="space-y-3">
          <div className="h-6 w-2/3 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="h-24 w-full rounded bg-white/10" />
          <div className="h-6 w-1/3 rounded bg-white/10" />
          <div className="h-20 w-full rounded bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ans, setAns] = useState<UnifiedAnswer | null>(null)
  const [showMore, setShowMore] = useState(false)
  const latestInputRef = useRef('')

  // TTS
  const ttsOk = isTtsAvailable()
  const [speaking, setSpeaking] = useState(false)

  function onListen() {
    if (!ans || !ans.title) return
    if (speaking) {
      cancelSpeech()
      setSpeaking(false)
      return
    }
    const text = [
      `Recommended: ${ans.title}.`,
      ans.reason_message || '',
      ans.summary || ''
    ].filter(Boolean).join('\n\n')
    speakText(text, {
      rate: 1,
      pitch: 1,
      onend: () => setSpeaking(false),
      onerror: () => setSpeaking(false)
    } as any)
    setSpeaking(true)
  }

  useEffect(() => () => cancelSpeech(), [])

  // STT
  const sttOk = isSttAvailable()
  const [sttStatus, setSttStatus] = useState<'idle'|'listening'|'error'>('idle')
  const recRef = useRef<any>(null)

  function toggleMic() {
    if (!sttOk) return
    if (sttStatus === 'listening') {
      try { recRef.current?.stop?.() } catch { }
      setSttStatus('idle')
      return
    }
    try {
      latestInputRef.current = ''  // reset buffer
      const rec = createRecognizer(text => {
        setQ(text)
        latestInputRef.current = text            // <-- keep freshest dictated text
      })
      recRef.current = rec
      rec.onstart = () => setSttStatus('listening')
      rec.onerror = () => setSttStatus('error')
      rec.onend = () => {
        setSttStatus('idle')
        const spoken = (latestInputRef.current || '').trim()
        if (spoken) void onAsk(spoken)           // <-- send the dictation, not stale `q`
      }
      rec.start()
    } catch {
      setSttStatus('error')
    }
  }

  async function onAsk(override?: string) {
    const text = typeof override === 'string' ? override : q
    const query = (text ?? '').trim()
    if (!query || loading) return
    setLoading(true); setErr(null); setAns(null); setShowMore(false); setSpeaking(false); cancelSpeech()
    try {
      const a = await askUnified(query, 3)
      setAns(a)
    } catch (e: any) {
      setErr(e?.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }
  function onEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onAsk()
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 font-[Inter]">
      {/* decorative gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 right-[-10rem] h-72 w-72 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-6rem] h-64 w-64 rounded-full bg-gradient-to-br from-sky-500/20 to-emerald-500/20 blur-3xl" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-ink-900/70 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-2 md:px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-soft" />
            <span className="font-semibold tracking-tight">Smart Librarian</span>
          </div>
          <a className="text-sm text-zinc-400 hover:text-zinc-200 transition" href="https://openlibrary.org" target="_blank">Open Library ↗</a>
        </div>
      </header>

      {/* hero */}
      <section className="py-10 md:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <IconSparkles className="size-4 text-indigo-400" /> RAG • LLM • Open Library
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
            Find the next book you’ll love.
          </h1>
          <p className="mt-2 text-zinc-400">
            Ask in natural language — we retrieve, reason, and enrich with public metadata.
          </p>
        </div>

        {/* command bar */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-ink-800/60 border border-white/10 p-2 focus-within:ring-2 focus-within:ring-indigo-500/40">
            <input
              value={q}
              onChange={e => { setQ(e.target.value); latestInputRef.current = e.target.value }}
              onKeyDown={onEnter}
              placeholder="e.g. what do you recommend for someone that loves stories about war?"
              className="flex-1 bg-transparent px-3 py-3 outline-none placeholder:text-zinc-500 text-zinc-100"
            />
            {/* Mic (STT) */}
            <button
              onClick={toggleMic}
              disabled={!sttOk}
              title={sttOk ? (sttStatus === 'listening' ? 'Stop' : 'Voice mode') : 'Not supported in this browser'}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10 text-sm ${sttStatus==='listening' ? 'bg-rose-500/20 text-rose-200' : 'bg-white/5 text-zinc-200 hover:bg-white/10'} disabled:opacity-40`}
            >
              {sttStatus === 'listening' ? <IconStop className="size-4" /> : <IconMic className="size-4" />} 
              {sttStatus === 'listening' ? 'Stop' : 'Mic'}
            </button>
            {/* Ask */}
            <button
              onClick={() => onAsk()}

              disabled={loading || !q.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 px-4 py-2 font-medium shadow-soft hover:opacity-95 disabled:opacity-50"
            >
              <IconSend className="size-4" /> {loading ? 'Thinking…' : 'Ask'}
            </button>
          </div>

          {/* STT hint / errors */}
          {sttOk ? (
            <div className="text-xs text-zinc-500">Tip: Click Mic to dictate; it auto-sends when you stop.</div>
          ) : (
            <div className="text-xs text-zinc-500">Speech recognition not supported here (try Chrome/Edge).</div>
          )}

          {err && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
              Error: {err}
            </div>
          )}
        </div>
      </section>

      {/* answer */}
      <section className="pb-16">
        {loading && <SkeletonCard />}

        {ans && !loading && (
          <div className="rounded-2xl border border-white/10 bg-ink-800/60 backdrop-blur shadow-soft p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-[180px,1fr] gap-6">
              <div className="w-full">
                {ans.details?.cover_url ? (
                  <img
                    src={ans.details.cover_url}
                    alt="cover"
                    className="w-[180px] h-[270px] object-cover rounded-xl border border-white/10"
                  />
                ) : (
                  <div className="w-[180px] h-[270px] grid place-items-center rounded-xl border border-dashed border-white/10 text-zinc-400">
                    No Cover
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="text-2xl md:text-3xl font-semibold">{ans.title || 'No recommendation found'}</h2>
                  {ans.details?.year && <span className="text-sm text-zinc-400">• {ans.details.year}</span>}
                </div>
                {ans.details?.authors?.length ? (
                  <p className="mt-1 text-zinc-300">{ans.details.authors.join(', ')}</p>
                ) : null}

                {ans.details?.openlibrary_url && (
                  <p className="mt-1">
                    <a className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                       href={ans.details.openlibrary_url} target="_blank" rel="noreferrer">
                      <IconLink className="size-4" /> Open Library page
                    </a>
                  </p>
                )}

                {/* TTS controls */}
                {ttsOk && ans.title && (
                  <button
                    onClick={onListen}
                    className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10 text-sm ${speaking ? 'bg-rose-500/20 text-rose-200' : 'bg-white/5 text-zinc-200 hover:bg-white/10'}`}
                  >
                    {speaking ? <IconStop className="size-4" /> : <IconSparkles className="size-4 text-indigo-400" />}
                    {speaking ? 'Stop' : 'Listen'}
                  </button>
                )}
                {!ttsOk && <p className="mt-2 text-xs text-zinc-500">TTS not supported in this browser.</p>}

                <div className="mt-4">
                  <p className="text-zinc-200 whitespace-pre-wrap">{ans.reason_message}</p>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium">Full summary</h3>
                  <p className="mt-2 text-zinc-200 whitespace-pre-wrap leading-relaxed">{ans.summary}</p>
                </div>

                {ans.rag_candidates?.length > 0 && (
                  <div className="mt-6">
                    <button
                      className="group inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
                      onClick={() => setShowMore(v => !v)}
                    >
                      <span className="font-medium">{showMore ? 'Hide' : 'Show'} other close matches</span>
                      <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${showMore ? 'rotate-180' : ''}`} fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showMore && (
                      <ul className="mt-2 space-y-2 text-zinc-300">
                        {ans.rag_candidates.map((c, i) => (
                          <li key={i}>
                            <span className="font-medium text-zinc-100">{c.title}</span>
                            <span className="text-zinc-400"> — {c.snippet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* footer */}
      <footer className="py-10 text-center text-sm text-zinc-500">
        Built with FastAPI · React · Chroma · Open Library
      </footer>
    </div>
  )
}
