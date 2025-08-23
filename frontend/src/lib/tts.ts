export function isTtsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function cancelSpeech() {
  if (!isTtsAvailable()) return
  window.speechSynthesis.cancel()
}

export function speakText(text: string, opts?: { rate?: number; pitch?: number; voice?: string; onend?: () => void; onerror?: (e: any) => void }) {
  if (!isTtsAvailable() || !text?.trim()) return
  cancelSpeech()

  const u = new SpeechSynthesisUtterance(text)
  u.rate = opts?.rate ?? 1
  u.pitch = opts?.pitch ?? 1

  const voices = window.speechSynthesis.getVoices()
  if (opts?.voice) {
    const v = voices.find(v => v.name === opts.voice)
    if (v) u.voice = v
  }

  u.onend = () => opts?.onend?.()
  u.onerror = (e) => opts?.onerror?.(e)
  window.speechSynthesis.speak(u)
}
