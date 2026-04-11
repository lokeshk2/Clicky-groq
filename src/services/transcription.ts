const DEFAULT_WORKER = import.meta.env.VITE_WORKER_URL as string | undefined

function workerUrl(): string {
  return localStorage.getItem('clicky-worker-url') ?? DEFAULT_WORKER ?? ''
}

function workerSecret(): string {
  return localStorage.getItem('clicky-worker-secret') ?? ''
}

export async function transcribeBlob(audio: Blob): Promise<string> {
  const url = workerUrl()
  const secret = workerSecret()
  if (!url || !secret) {
    throw new Error('Set Worker URL and secret for transcription.')
  }

  const form = new FormData()
  form.append('file', audio, 'speech.webm')

  const res = await fetch(`${url.replace(/\/$/, '')}/transcribe`, {
    method: 'POST',
    headers: {
      'X-Worker-Secret': secret
    },
    body: form
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || `Transcribe failed: ${res.status}`)
  }

  try {
    const json = JSON.parse(text) as { text?: string }
    return json.text ?? ''
  } catch {
    return text
  }
}
