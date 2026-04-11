export type AppState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface DisplayBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface SerializedDisplay {
  id: number
  bounds: DisplayBounds
  workArea: DisplayBounds
  scaleFactor: number
  rotation: number
  internal: boolean
}

/** x,y are global virtual-screen coordinates (e.g. for overlay positioning). */
export interface PointCursorPayload {
  x: number
  y: number
  label: string
  /** Display index from the model tag (screen0 → 0); optional for debugging. */
  screen?: number
}

export interface ChatMessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatMessageContent[]
}

export const SYSTEM_PROMPT = `You are Clicky, an AI teaching assistant that lives on the user's desktop. 
You can see their screen. When referring to a specific UI element, button, 
or area on screen, embed a pointer tag like [POINT:x,y:label:screen0] where 
x,y are pixel coordinates on the captured screenshot and screen0 is the 
display index. Keep responses concise (2-4 sentences). Be helpful, friendly, 
and direct.`

export const MODEL_OPTIONS = [
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    label: 'Llama 4 Scout (vision)'
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    label: 'Llama 4 Maverick'
  }
] as const
