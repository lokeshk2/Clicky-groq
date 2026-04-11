import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointCursorPayload } from '@shared/types'

type OverlayPhase = 'idle' | 'processing' | 'speaking'

export default function Overlay(): JSX.Element {
  const [phase, setPhase] = useState<OverlayPhase>('idle')
  const [responseText, setResponseText] = useState('')
  const [dot, setDot] = useState<{ x: number; y: number; label: string; transition: boolean } | null>(null)
  const [opacity, setOpacity] = useState(0)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const dotPosRef = useRef<{ x: number; y: number } | null>(null)

  const bumpActivity = useCallback(() => {
    setOpacity(1)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      setOpacity(0)
      setTimeout(() => {
        setDot(null)
        setResponseText('')
        setPhase('idle')
        dotPosRef.current = null
      }, 500)
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [])

  const globalToLocal = useCallback(async (gx: number, gy: number) => {
    const b = await window.clicky.getOverlayBounds()
    if (!b) return { x: gx, y: gy }
    return { x: gx - b.x, y: gy - b.y }
  }, [])

  useEffect(() => {
    return window.clicky.onPointCursor(async (p: PointCursorPayload) => {
      bumpActivity()
      const local = await globalToLocal(p.x, p.y)
      const prev = dotPosRef.current ?? local
      dotPosRef.current = { x: local.x, y: local.y }

      setDot({ x: prev.x, y: prev.y, label: p.label, transition: false })
      requestAnimationFrame(() => {
        setDot({ x: local.x, y: local.y, label: p.label, transition: true })
      })
    })
  }, [bumpActivity, globalToLocal])

  useEffect(() => {
    return window.clicky.onAssistantDisplayChunk((chunk) => {
      bumpActivity()
      setResponseText((t) => t + chunk)
    })
  }, [bumpActivity])

  useEffect(() => {
    return window.clicky.onAssistantStreamEnd(() => {
      bumpActivity()
    })
  }, [bumpActivity])

  useEffect(() => {
    return window.clicky.onAssistantClear(() => {
      setResponseText('')
      setDot(null)
      dotPosRef.current = null
    })
  }, [])

  useEffect(() => {
    return window.clicky.onOverlayState((s) => {
      if (s.processing) {
        setPhase('processing')
        bumpActivity()
      }
      if (s.speaking) {
        setPhase('speaking')
        bumpActivity()
      }
      if (s.processing === false && s.speaking === false) {
        setPhase('idle')
      }
    })
  }, [bumpActivity])

  useEffect(() => {
    return window.clicky.onPlayAudio(async (buf) => {
      bumpActivity()
      setPhase('speaking')
      try {
        const ctx = audioCtxRef.current ?? new AudioContext()
        audioCtxRef.current = ctx
        const copy = buf.slice(0)
        const decoded = await ctx.decodeAudioData(copy)
        const src = ctx.createBufferSource()
        src.buffer = decoded
        src.connect(ctx.destination)
        src.onended = () => {
          window.clicky.speakingDone()
          setPhase('idle')
        }
        src.start()
      } catch (e) {
        console.error(e)
        window.clicky.speakingDone()
        setPhase('idle')
      }
    })
  }, [bumpActivity])

  const showChrome = opacity > 0 || phase === 'processing' || phase === 'speaking'

  return (
    <div className="pointer-events-none fixed inset-0">
      {showChrome && (
        <div className="pointer-events-none transition-opacity duration-500" style={{ opacity }}>
          {phase === 'processing' && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Thinking…
            </div>
          )}

          {dot && (
            <div
              className="absolute z-50"
              style={{
                left: dot.x,
                top: dot.y,
                transform: 'translate(-50%, -50%)',
                transition: dot.transition ? 'left 700ms cubic-bezier(0.34, 1.45, 0.64, 1), top 700ms cubic-bezier(0.34, 1.45, 0.64, 1)' : 'none'
              }}
            >
              <div
                className="h-5 w-5 rounded-full shadow-lg"
                style={{ backgroundColor: '#007AFF', boxShadow: '0 0 12px rgba(0,122,255,0.8)' }}
              />
              {dot.label && (
                <div className="absolute left-1/2 top-full mt-2 max-w-[300px] -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-xs text-white">
                  {dot.label}
                </div>
              )}
            </div>
          )}

          {responseText && (
            <div className="absolute bottom-24 left-1/2 z-40 max-w-[300px] -translate-x-1/2 rounded-lg bg-black/80 px-3 py-2 text-sm leading-snug text-white shadow-lg backdrop-blur">
              {responseText}
            </div>
          )}

          {phase === 'speaking' && (
            <div className="absolute bottom-10 left-1/2 flex h-10 -translate-x-1/2 items-end gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="wave-bar w-1.5 origin-bottom rounded-sm bg-sky-400"
                  style={{ animationDelay: `${i * 0.12}s`, height: '24px' }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
