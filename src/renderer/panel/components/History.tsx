import type { ChatMessage } from '@shared/types'
import { stripPointTags } from '../../../services/pointerTags'

function textPreview(msg: ChatMessage): string {
  if (typeof msg.content === 'string') {
    return msg.role === 'assistant' ? stripPointTags(msg.content) : msg.content
  }
  const parts = msg.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join(' ')
  const t = parts || '[image]'
  return msg.role === 'assistant' ? stripPointTags(t) : t
}

export function History({ messages }: { messages: ChatMessage[] }): JSX.Element {
  const last = messages.slice(-10)

  return (
    <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/80 p-2 text-xs">
      {last.length === 0 ? (
        <p className="text-zinc-500">No messages yet.</p>
      ) : (
        last.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`rounded px-2 py-1 ${m.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 text-zinc-300'}`}
          >
            <span className="font-semibold text-zinc-500">{m.role}: </span>
            {textPreview(m)}
          </div>
        ))
      )}
    </div>
  )
}
