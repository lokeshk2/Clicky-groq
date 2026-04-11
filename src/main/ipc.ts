import { app, ipcMain, BrowserWindow, screen } from 'electron'
import { captureScreenJpeg } from './screenshot'
import { fitOverlayToAllDisplays } from './overlay'
import type { SerializedDisplay } from '../shared/types'

function serializeDisplays(): SerializedDisplay[] {
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    bounds: { ...d.bounds },
    workArea: { ...d.workArea },
    scaleFactor: d.scaleFactor,
    rotation: d.rotation,
    internal: d.internal ?? false
  }))
}

export function registerIpcHandlers(overlay: BrowserWindow, panel: BrowserWindow): {
  onDisplaysChanged: () => void
} {
  ipcMain.handle('take-screenshot', async () => {
    return await captureScreenJpeg()
  })

  ipcMain.handle('get-displays', () => serializeDisplays())

  ipcMain.handle('get-overlay-bounds', () => {
    if (overlay.isDestroyed()) return null
    return overlay.getBounds()
  })

  ipcMain.on('set-ignore-mouse', (_e, ignore: boolean) => {
    if (!overlay.isDestroyed()) {
      overlay.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  ipcMain.on('point-cursor', (_e, payload: { x: number; y: number; label: string; screen?: number }) => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('point-cursor', payload)
    }
  })

  ipcMain.on('assistant-display-chunk', (_e, chunk: string) => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('assistant-display-chunk', chunk)
    }
  })

  ipcMain.on('assistant-stream-end', () => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('assistant-stream-end')
    }
  })

  ipcMain.on('overlay-state', (_e, state: { processing?: boolean; speaking?: boolean }) => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('overlay-state', state)
    }
  })

  ipcMain.on('play-audio', (_e, buffer: ArrayBuffer) => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('play-audio', buffer)
    }
  })

  ipcMain.on('speaking-done', () => {
    if (!panel.isDestroyed()) {
      panel.webContents.send('speaking-done')
    }
  })

  ipcMain.on('capture-meta', (_e, meta: { width: number; height: number }) => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('capture-meta', meta)
    }
  })

  ipcMain.on('assistant-clear', () => {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('assistant-clear')
    }
  })

  ipcMain.on('quit-app', () => {
    app.quit()
  })

  const onDisplaysChanged = (): void => {
    fitOverlayToAllDisplays(overlay)
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('displays-updated', serializeDisplays())
    }
  }

  return { onDisplaysChanged }
}
