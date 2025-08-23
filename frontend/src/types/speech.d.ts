// Minimal Web Speech API shims (Chromium)
interface SpeechRecognitionResult {
  0: { transcript: string; confidence?: number }
  isFinal: boolean
  length: number
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: (event: any) => void
  onstart?: (event: Event) => void
  onend?: (event: Event) => void
  onerror?: (event: any) => void
}
interface Window {
  webkitSpeechRecognition?: { new (): SpeechRecognition }
  SpeechRecognition?: { new (): SpeechRecognition }
}
