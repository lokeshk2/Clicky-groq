import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

const PANEL_WIDTH = 320
const PANEL_HEIGHT = 400

export function createPanelWindow(): BrowserWindow {
  const primary = screen.getPrimaryDisplay()
  const { x, y, width } = primary.workArea

  const win = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    x: Math.round(x + width - PANEL_WIDTH - 12),
    y: Math.round(y + 8),
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    transparent: process.platform === 'darwin',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/panel/index.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/panel/index.html'))
  }

  return win
}

export function positionPanelNearTray(panel: BrowserWindow, trayBounds: Electron.Rectangle): void {
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const { x, y, width, height } = display.workArea

  let px = trayBounds.x - PANEL_WIDTH / 2 + trayBounds.width / 2
  let py = trayBounds.y - PANEL_HEIGHT - 4

  // macOS tray is top; Windows often bottom
  if (py < y) {
    py = trayBounds.y + trayBounds.height + 4
  }
  if (py + PANEL_HEIGHT > y + height) {
    py = Math.max(y + 8, y + height - PANEL_HEIGHT - 8)
  }

  px = Math.min(Math.max(x + 8, px), x + width - PANEL_WIDTH - 8)

  panel.setPosition(Math.round(px), Math.round(py))
}
