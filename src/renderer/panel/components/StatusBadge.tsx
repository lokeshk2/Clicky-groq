import type { AppState } from '@shared/types'

const labels: Record<AppState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
  speaking: 'Speaking'
}

export function StatusBadge({ state }: { state: AppState }): JSX.Element {
  const color =
    state === 'idle'
      ? 'bg-zinc-600'
      : state === 'listening'
        ? 'bg-amber-500'
        : state === 'processing'
          ? 'bg-sky-500'
          : 'bg-emerald-500'

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color} animate-pulse`} />
      <span className="text-sm font-medium text-zinc-200">{labels[state]}</span>
    </div>
  )
}
