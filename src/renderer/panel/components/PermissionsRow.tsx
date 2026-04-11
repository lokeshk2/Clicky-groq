import { useState } from 'react'

export function PermissionsRow(): JSX.Element {
  const [mic, setMic] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<boolean | null>(null)

  const check = async (): Promise<void> => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      s.getTracks().forEach((t) => t.stop())
      setMic(true)
    } catch {
      setMic(false)
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      s.getTracks().forEach((t) => t.stop())
      setScreen(true)
    } catch {
      setScreen(false)
    }
  }

  const dot = (ok: boolean | null) =>
    ok === null ? 'bg-zinc-600' : ok ? 'bg-emerald-500' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${dot(mic)}`} />
            Mic
          </span>
          <span className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${dot(screen)}`} />
            Screen
          </span>
        </div>
        <button
          type="button"
          onClick={() => void check()}
          className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
        >
          Check
        </button>
      </div>
      <p className="text-[10px] text-zinc-600">macOS: grant Mic & Screen Recording for this app.</p>
    </div>
  )
}
