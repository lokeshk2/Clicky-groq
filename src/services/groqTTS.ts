const DEFAULT_WORKER = import.meta.env.VITE_WORKER_URL as string | undefined

function workerUrl(): string {
  return localStorage.getItem('clicky-worker-url') ?? DEFAULT_WORKER ?? ''
}

function workerSecret(): string {
  return localStorage.getItem('clicky-worker-secret') ?? ''
}

export async function fetchTtsWav(cleanText: string, voice?: string): Promise<ArrayBuffer> {
  const url = workerUrl()
  const secret = workerSecret()
  if (!url || !secret) {
    throw new Error('Set Worker URL and secret for TTS.')
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret
    },
    body: JSON.stringify({ text: cleanText, voice })
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `TTS failed: ${res.status}`)
  }

  return await res.arrayBuffer()
}
