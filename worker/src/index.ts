export interface Env {
  GROQ_API_KEY: string
  WORKER_SECRET: string
  GROQ_VOICE_ID: string
}

const GROQ_CHAT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_SPEECH = 'https://api.groq.com/openai/v1/audio/speech'
const GROQ_TRANSCRIBE = 'https://api.groq.com/openai/v1/audio/transcriptions'

function unauthorized(): Response {
  return new Response('Unauthorized', { status: 401 })
}

function checkSecret(request: Request, env: Env): boolean {
  const secret = request.headers.get('x-worker-secret') ?? request.headers.get('X-Worker-Secret')
  return !!secret && secret === env.WORKER_SECRET
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (!checkSecret(request, env)) {
      return unauthorized()
    }

    if (request.method === 'POST' && url.pathname === '/chat') {
      const body = await request.text()
      const groqReq = new Request(GROQ_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`
        },
        body
      })
      const res = await fetch(groqReq)
      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      })
    }

    if (request.method === 'POST' && url.pathname === '/tts') {
      const json = (await request.json()) as { text?: string; voice?: string }
      const text = json.text ?? ''
      const voice = json.voice ?? env.GROQ_VOICE_ID ?? 'Chip-PlayAI'

      const ttsBody = JSON.stringify({
        model: 'playai-tts',
        voice,
        input: text,
        response_format: 'wav'
      })

      const groqReq = new Request(GROQ_SPEECH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`
        },
        body: ttsBody
      })

      const res = await fetch(groqReq)
      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'audio/wav',
          'Cache-Control': 'no-store'
        }
      })
    }

    if (request.method === 'POST' && url.pathname === '/transcribe') {
      const incoming = await request.formData()
      const file = incoming.get('file')
      if (!(file instanceof File)) {
        return new Response(JSON.stringify({ error: 'missing file' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const out = new FormData()
      out.append('file', file, file.name || 'audio.webm')
      out.append('model', 'whisper-large-v3')

      const groqReq = new Request(GROQ_TRANSCRIBE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`
        },
        body: out
      })

      const res = await fetch(groqReq)
      const text = await res.text()
      return new Response(text, {
        status: res.status,
        headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' }
      })
    }

    return new Response('Not found', { status: 404 })
  }
}
