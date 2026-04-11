# Clicky-groq

Menu bar AI companion (Electron + React + TypeScript + Vite) that uses **Groq** for vision chat, Whisper transcription, and PlayAI TTS. API keys stay on a **Cloudflare Worker** proxy.

## Prerequisites

- Node 20+
- macOS (primary target) or Windows
- Groq API key + a shared secret for the worker

## Cloudflare Worker

```bash
cd worker
npm install   # optional; wrangler bundles worker alone
wrangler secret put GROQ_API_KEY
wrangler secret put WORKER_SECRET
wrangler deploy
```

Routes (header `X-Worker-Secret: <WORKER_SECRET>`):

- `POST /chat` — streaming Groq chat completions
- `POST /tts` — Groq speech (`playai-tts`)
- `POST /transcribe` — Groq Whisper (`multipart` field `file`)

## Desktop app

```bash
npm install
# optional: cp .env.example .env and set VITE_WORKER_URL
npm run dev
```

In the panel, set **Worker URL** and **Worker secret** (stored in `localStorage`).

### Build

```bash
npm run build:app    # compile to out/
npm run build        # + electron-builder (.dmg / .exe)
```

## Usage

1. Open the panel from the tray.
2. Hold **Control + Alt** to talk; release to send (screenshot + transcript → Groq).
3. The overlay shows the assistant text, optional pointer dot for `[POINT:x,y:label:screen0]` tags, TTS, and a waveform while speaking.

## Permissions

Grant **Microphone** and **Screen Recording** when macOS prompts (or System Settings).

## Project layout

- `src/main/` — Electron main process (tray, overlay, hotkey, IPC, screenshot)
- `src/renderer/panel` & `overlay` — React UIs
- `src/services/` — Worker client (chat SSE, TTS, transcribe) + pointer tag parsing
- `worker/` — Cloudflare Worker proxy
