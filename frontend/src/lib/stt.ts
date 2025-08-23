export type SttStatus = 'idle' | 'listening' | 'error'

export function isSttAvailable(): boolean {
  return typeof window !== 'undefined' &&
    ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)
}

export function createRecognizer(onResult: (text: string) => void) {
  // Prefer webkit prefix (widely supported in Chromium)
  const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!SR) throw new Error('SpeechRecognition not supported in this browser')

  const rec: any = new SR()
  rec.lang = 'en-US'
  rec.interimResults = true
  rec.continuous = false

  let finalText = ''
  rec.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]
      const t = res[0].transcript
      if (res.isFinal) finalText += t
      else interim += t
    }
    onResult((finalText + ' ' + interim).trim())
  }

  return rec
}
