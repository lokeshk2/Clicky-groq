import { Menu, Tray, nativeImage, app, BrowserWindow } from 'electron'
import { positionPanelNearTray } from './panel'

function createTrayIcon(): Electron.NativeImage {
  const size = process.platform === 'darwin' ? 18 : 16
  // Simple 1-bit style template image for macOS (inverted in menu bar)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="8"/></svg>`
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  return nativeImage.createFromDataURL(dataUrl)
}

export function setupTray(panel: BrowserWindow, onQuit: () => void): Tray {
  const tray = new Tray(createTrayIcon())
  tray.setToolTip('Clicky-groq')

  const togglePanel = (): void => {
    const b = tray.getBounds()
    positionPanelNearTray(panel, b)
    if (panel.isVisible()) {
      panel.hide()
      panel.webContents.send('hide-panel')
    } else {
      panel.show()
      panel.webContents.send('show-panel')
    }
  }

  tray.on('click', togglePanel)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle Panel',
      click: togglePanel
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        onQuit()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)

  return tray
}
