/// <reference types="vite/client" />

import type { ClickyApi } from '../preload/preload'

declare global {
  interface Window {
    clicky: ClickyApi
  }
}

export {}
