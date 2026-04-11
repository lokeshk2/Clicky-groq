import { GlobalKeyboardListener, type IGlobalKeyEvent } from 'node-global-key-listener'
import { BrowserWindow } from 'electron'

type Modifiers = { ctrl: boolean; alt: boolean }

function isCtrl(e: IGlobalKeyEvent): boolean {
  const n = e.name ?? ''
  return n === 'LEFT CTRL' || n === 'RIGHT CTRL'
}

function isAlt(e: IGlobalKeyEvent): boolean {
  const n = e.name ?? ''
  return n === 'LEFT ALT' || n === 'RIGHT ALT'
}

/**
 * Push-to-talk: both Control and Alt must be held.
 */
export function registerPushToTalkHotkey(panel: BrowserWindow, overlay: BrowserWindow): () => void {
  const listener = new GlobalKeyboardListener()
  const mods: Modifiers = { ctrl: false, alt: false }
  let active = false

  const sync = (): void => {
    const should = mods.ctrl && mods.alt
    if (should && !active) {
      active = true
      panel.webContents.send('hotkey-pressed')
      overlay.webContents.send('hotkey-pressed')
    } else if (!should && active) {
      active = false
      panel.webContents.send('hotkey-released')
      overlay.webContents.send('hotkey-released')
    }
  }

  const keyListener = (e: IGlobalKeyEvent): void => {
    if (e.state === 'DOWN') {
      if (isCtrl(e)) mods.ctrl = true
      if (isAlt(e)) mods.alt = true
    } else if (e.state === 'UP') {
      if (isCtrl(e)) mods.ctrl = false
      if (isAlt(e)) mods.alt = false
    }
    sync()
  }

  void listener.addListener(keyListener).catch((err) => {
    console.error('[Clicky] Global keyboard listener failed (push-to-talk may not work):', err)
  })

  return () => {
    listener.removeListener(keyListener)
    listener.kill()
  }
}
