import { app, BrowserWindow, screen, systemPreferences } from 'electron'
import { createPanelWindow } from './panel'
import { createOverlayWindow, fitOverlayToAllDisplays } from './overlay'
import { setupTray } from './tray'
import { registerPushToTalkHotkey } from './hotkey'
import { registerIpcHandlers } from './ipc'

let panelWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let disposeHotkey: (() => void) | null = null
let notifyDisplaysChanged: (() => void) | null = null

function requestPermissions(): void {
  if (process.platform === 'darwin') {
    void systemPreferences.askForMediaAccess('microphone')
    void systemPreferences.getMediaAccessStatus('screen')
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock?.hide()
  }

  requestPermissions()

  panelWindow = createPanelWindow()
  overlayWindow = createOverlayWindow()

  if (overlayWindow && panelWindow) {
    fitOverlayToAllDisplays(overlayWindow)
    ;({ onDisplaysChanged: notifyDisplaysChanged } = registerIpcHandlers(overlayWindow, panelWindow))

    overlayWindow.once('ready-to-show', () => {
      overlayWindow?.show()
      overlayWindow?.setIgnoreMouseEvents(true, { forward: true })
    })

    disposeHotkey = registerPushToTalkHotkey(panelWindow, overlayWindow)

    setupTray(panelWindow, () => {
      disposeHotkey?.()
      disposeHotkey = null
    })
  }

  const onDisplayChange = (): void => {
    if (overlayWindow) fitOverlayToAllDisplays(overlayWindow)
    notifyDisplaysChanged?.()
  }
  screen.on('display-added', onDisplayChange)
  screen.on('display-removed', onDisplayChange)
  screen.on('display-metrics-changed', onDisplayChange)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      panelWindow = createPanelWindow()
      overlayWindow = createOverlayWindow()
      if (overlayWindow && panelWindow) {
        fitOverlayToAllDisplays(overlayWindow)
        ;({ onDisplaysChanged: notifyDisplaysChanged } = registerIpcHandlers(overlayWindow, panelWindow))
        disposeHotkey = registerPushToTalkHotkey(panelWindow, overlayWindow)
      }
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  disposeHotkey?.()
})
