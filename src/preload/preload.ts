import { contextBridge, ipcRenderer } from 'electron'
import type { SerializedDisplay, PointCursorPayload } from '../shared/types'

export interface ScreenshotPayload {
  jpegBase64: string
  width: number
  height: number
}

const api = {
  takeScreenshot: (): Promise<ScreenshotPayload> => ipcRenderer.invoke('take-screenshot'),
  getDisplays: (): Promise<SerializedDisplay[]> => ipcRenderer.invoke('get-displays'),
  getOverlayBounds: (): Promise<{ x: number; y: number; width: number; height: number } | null> =>
    ipcRenderer.invoke('get-overlay-bounds'),
  setIgnoreMouse: (ignore: boolean): void => {
    ipcRenderer.send('set-ignore-mouse', ignore)
  },
  pointCursor: (payload: PointCursorPayload): void => {
    ipcRenderer.send('point-cursor', payload)
  },
  assistantDisplayChunk: (chunk: string): void => {
    ipcRenderer.send('assistant-display-chunk', chunk)
  },
  assistantStreamEnd: (): void => {
    ipcRenderer.send('assistant-stream-end')
  },
  assistantClear: (): void => {
    ipcRenderer.send('assistant-clear')
  },
  overlayState: (state: { processing?: boolean; speaking?: boolean }): void => {
    ipcRenderer.send('overlay-state', state)
  },
  playAudio: (buffer: ArrayBuffer): void => {
    ipcRenderer.send('play-audio', buffer)
  },
  onHotkeyPressed: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('hotkey-pressed', fn)
    return () => ipcRenderer.removeListener('hotkey-pressed', fn)
  },
  onHotkeyReleased: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('hotkey-released', fn)
    return () => ipcRenderer.removeListener('hotkey-released', fn)
  },
  onShowPanel: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('show-panel', fn)
    return () => ipcRenderer.removeListener('show-panel', fn)
  },
  onHidePanel: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('hide-panel', fn)
    return () => ipcRenderer.removeListener('hide-panel', fn)
  },
  onPointCursor: (cb: (payload: PointCursorPayload) => void): (() => void) => {
    const fn = (_e: Electron.IpcRendererEvent, p: PointCursorPayload) => cb(p)
    ipcRenderer.on('point-cursor', fn)
    return () => ipcRenderer.removeListener('point-cursor', fn)
  },
  onAssistantDisplayChunk: (cb: (chunk: string) => void): (() => void) => {
    const fn = (_e: Electron.IpcRendererEvent, chunk: string) => cb(chunk)
    ipcRenderer.on('assistant-display-chunk', fn)
    return () => ipcRenderer.removeListener('assistant-display-chunk', fn)
  },
  onAssistantStreamEnd: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('assistant-stream-end', fn)
    return () => ipcRenderer.removeListener('assistant-stream-end', fn)
  },
  onAssistantClear: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('assistant-clear', fn)
    return () => ipcRenderer.removeListener('assistant-clear', fn)
  },
  onOverlayState: (cb: (state: { processing?: boolean; speaking?: boolean }) => void): (() => void) => {
    const fn = (_e: Electron.IpcRendererEvent, s: { processing?: boolean; speaking?: boolean }) => cb(s)
    ipcRenderer.on('overlay-state', fn)
    return () => ipcRenderer.removeListener('overlay-state', fn)
  },
  onPlayAudio: (cb: (buffer: ArrayBuffer) => void): (() => void) => {
    const fn = (_e: Electron.IpcRendererEvent, buf: ArrayBuffer) => cb(buf)
    ipcRenderer.on('play-audio', fn)
    return () => ipcRenderer.removeListener('play-audio', fn)
  },
  onDisplaysUpdated: (cb: (d: SerializedDisplay[]) => void): (() => void) => {
    const fn = (_e: Electron.IpcRendererEvent, d: SerializedDisplay[]) => cb(d)
    ipcRenderer.on('displays-updated', fn)
    return () => ipcRenderer.removeListener('displays-updated', fn)
  },
  speakingDone: (): void => {
    ipcRenderer.send('speaking-done')
  },
  captureMeta: (meta: { width: number; height: number }): void => {
    ipcRenderer.send('capture-meta', meta)
  },
  quitApp: (): void => {
    ipcRenderer.send('quit-app')
  },
  onSpeakingDone: (cb: () => void): (() => void) => {
    const fn = (): void => cb()
    ipcRenderer.on('speaking-done', fn)
    return () => ipcRenderer.removeListener('speaking-done', fn)
  },
  onCaptureMeta: (cb: (meta: { width: number; height: number }) => void): (() => void) => {
    const fn = (_e: Electron.IpcRendererEvent, m: { width: number; height: number }) => cb(m)
    ipcRenderer.on('capture-meta', fn)
    return () => ipcRenderer.removeListener('capture-meta', fn)
  }
}

contextBridge.exposeInMainWorld('clicky', api)

export type ClickyApi = typeof api
