import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState, ChatMessage } from '@shared/types'
import { MODEL_OPTIONS } from '@shared/types'
import { streamGroqChat } from '../../services/groqChat'
import { fetchTtsWav } from '../../services/groqTTS'
import { transcribeBlob } from '../../services/transcription'
import { processStreamForPoints, stripPointTags } from '../../services/pointerTags'
import { History } from './components/History'
import { ModelPicker } from './components/ModelPicker'
import { PermissionsRow } from './components/PermissionsRow'
import { StatusBadge } from './components/StatusBadge'

const DEFAULT_MODEL = MODEL_OPTIONS[0].id

function loadLs(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export default function App(): JSX.Element {
  const [workerUrl, setWorkerUrl] = useState(() => loadLs('clicky-worker-url', import.meta.env.VITE_WORKER_URL ?? ''))
  const [workerSecret, setWorkerSecret] = useState(() => loadLs('clicky-worker-secret', ''))
  const [model, setModel] = useState(() => loadLs('clicky-model', DEFAULT_MODEL))
  const [appState, setAppState] = useState<AppState>('idle')
  const [history, setHistory] = useState<ChatMessage[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const busyRef = useRef(false)
  const listeningRef = useRef(false)

  const historyRef = useRef<ChatMessage[]>([])
  const modelRef = useRef(model)
  const workerUrlRef = useRef(workerUrl)
  const workerSecretRef = useRef(workerSecret)

  useEffect(() => {
    historyRef.current = history
  }, [history])
  useEffect(() => {
    modelRef.current = model
  }, [model])
  useEffect(() => {
    workerUrlRef.current = workerUrl
  }, [workerUrl])
  useEffect(() => {
    workerSecretRef.current = workerSecret
  }, [workerSecret])

  useEffect(() => {
    localStorage.setItem('clicky-worker-url', workerUrl)
  }, [workerUrl])
  useEffect(() => {
    localStorage.setItem('clicky-worker-secret', workerSecret)
  }, [workerSecret])
  useEffect(() => {
    localStorage.setItem('clicky-model', model)
  }, [model])

  const setOverlayProcessing = useCallback((on: boolean) => {
    window.clicky.overlayState({ processing: on })
  }, [])

  const setOverlaySpeaking = useCallback((on: boolean) => {
    window.clicky.overlayState({ speaking: on })
  }, [])

  useEffect(() => {
    return window.clicky.onSpeakingDone(() => {
      setAppState('idle')
      setOverlaySpeaking(false)
      busyRef.current = false
    })
  }, [setOverlaySpeaking])

  const startRecording = useCallback(async () => {
    if (busyRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = rec
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.start(100)
      listeningRef.current = true
      setAppState('listening')
    } catch (e) {
      console.error(e)
      listeningRef.current = false
      setAppState('idle')
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const rec = mediaRecorderRef.current
      const stream = streamRef.current
      mediaRecorderRef.current = null
      streamRef.current = null
      listeningRef.current = false
      if (!rec || rec.state === 'inactive') {
        stream?.getTracks().forEach((t) => t.stop())
        resolve(null)
        return
      }
      rec.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: rec.mimeType })
        chunksRef.current = []
        resolve(blob.size ? blob : null)
      }
      rec.stop()
    })
  }, [])

  const runPipeline = useCallback(async (audio: Blob | null) => {
    const wu = workerUrlRef.current
    const ws = workerSecretRef.current
    if (!wu || !ws) {
      alert('Set Worker URL and X-Worker-Secret in the panel.')
      setAppState('idle')
      return
    }
    busyRef.current = true
    setAppState('processing')
    setOverlayProcessing(true)
    window.clicky.assistantClear()

    const tagAccRef = { acc: '' }

    try {
      const transcript = audio ? (await transcribeBlob(audio)).trim() : ''
      const shot = await window.clicky.takeScreenshot()
      window.clicky.captureMeta({ width: shot.width, height: shot.height })

      const displays = await window.clicky.getDisplays()

      const userContent: ChatMessage['content'] = [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${shot.jpegBase64}` }
        },
        { type: 'text', text: transcript || '(no speech detected)' }
      ]

      const userMsg: ChatMessage = { role: 'user', content: userContent }
      const messages = [...historyRef.current, userMsg]

      let full = ''
      await streamGroqChat(messages, modelRef.current, (chunk) => {
        full += chunk
        const parsed = processStreamForPoints(tagAccRef.acc, chunk, shot.width, shot.height, displays)
        tagAccRef.acc = parsed.acc
        for (const p of parsed.points) {
          window.clicky.pointCursor({ x: p.x, y: p.y, label: p.label, screen: p.screen })
        }
        if (parsed.displayable) {
          window.clicky.assistantDisplayChunk(parsed.displayable)
        }
      })
      window.clicky.assistantStreamEnd()

      const assistantMsg: ChatMessage = { role: 'assistant', content: full }
      setHistory((h) => [...h, userMsg, assistantMsg])

      const clean = stripPointTags(full)
      if (clean) {
        setAppState('speaking')
        setOverlaySpeaking(true)
        const wav = await fetchTtsWav(clean)
        window.clicky.playAudio(wav)
      } else {
        setAppState('idle')
        busyRef.current = false
      }
    } catch (e) {
      console.error(e)
      window.clicky.assistantStreamEnd()
      setAppState('idle')
      busyRef.current = false
    } finally {
      setOverlayProcessing(false)
    }
  }, [setOverlayProcessing, setOverlaySpeaking])

  useEffect(() => {
    const off1 = window.clicky.onHotkeyPressed(() => {
      void startRecording()
    })
    const off2 = window.clicky.onHotkeyReleased(() => {
      void (async () => {
        if (!listeningRef.current) return
        const blob = await stopRecording()
        await runPipeline(blob)
      })()
    })
    return () => {
      off1()
      off2()
    }
  }, [runPipeline, startRecording, stopRecording])

  return (
    <div className="flex h-full min-h-[400px] flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-tight">Clicky-groq</h1>
        <StatusBadge state={appState} />
      </div>
      <p className="text-xs text-zinc-400">Hold Control+Alt to speak</p>

      <ModelPicker value={model} onChange={setModel} />

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Worker URL
        <input
          value={workerUrl}
          onChange={(e) => setWorkerUrl(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-white outline-none focus:border-sky-500"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Worker secret
        <input
          type="password"
          value={workerSecret}
          onChange={(e) => setWorkerSecret(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-white outline-none focus:border-sky-500"
        />
      </label>

      <PermissionsRow />

      <div className="flex-1 overflow-hidden">
        <p className="text-[11px] font-medium text-zinc-500">Recent turns</p>
        <History messages={history} />
      </div>

      <button
        type="button"
        onClick={() => window.clicky.quitApp()}
        className="mt-auto rounded-md bg-red-900/80 py-2 text-sm font-medium text-red-100 hover:bg-red-800"
      >
        Quit
      </button>
    </div>
  )
}
