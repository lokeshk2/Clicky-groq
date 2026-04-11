import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

export function createOverlayWindow(): BrowserWindow {
  const bounds = screen.getPrimaryDisplay().bounds

  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setAlwaysOnTop(true, 'screen-saver')

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/overlay/index.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/overlay/index.html'))
  }

  return win
}

export function fitOverlayToAllDisplays(overlay: BrowserWindow): void {
  const displays = screen.getAllDisplays()
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const d of displays) {
    const b = d.bounds
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }

  overlay.setBounds({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  })
}
