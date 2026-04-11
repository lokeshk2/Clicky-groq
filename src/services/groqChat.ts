import { SYSTEM_PROMPT, type ChatMessage } from '@shared/types'

const DEFAULT_WORKER = import.meta.env.VITE_WORKER_URL as string | undefined

function workerUrl(): string {
  return localStorage.getItem('clicky-worker-url') ?? DEFAULT_WORKER ?? ''
}

function workerSecret(): string {
  return localStorage.getItem('clicky-worker-secret') ?? ''
}

export async function streamGroqChat(
  messages: ChatMessage[],
  model: string,
  onDelta: (text: string) => void
): Promise<string> {
  const url = workerUrl()
  const secret = workerSecret()
  if (!url || !secret) {
    throw new Error('Set Worker URL and secret in the panel (localStorage or VITE_WORKER_URL).')
  }

  const body = JSON.stringify({
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    stream: true
  })

  const res = await fetch(`${url.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret
    },
    body
  })

  if (!res.ok || !res.body) {
    const t = await res.text()
    throw new Error(t || `Chat failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const chunk = json.choices?.[0]?.delta?.content
        if (chunk) {
          full += chunk
          onDelta(chunk)
        }
      } catch {
        // ignore partial JSON lines
      }
    }
  }

  return full
}
