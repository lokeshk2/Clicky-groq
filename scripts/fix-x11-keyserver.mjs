/**
 * node-global-key-listener ships X11KeyServer without the executable bit after npm unpack.
 * Without +x, startup fails and the package tries sudo-prompt → "Unable to find pkexec or kdesudo".
 */
import { chmodSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const x11 = join(root, 'node_modules', 'node-global-key-listener', 'bin', 'X11KeyServer')

if (process.platform === 'linux' && existsSync(x11)) {
  try {
    chmodSync(x11, 0o755)
  } catch (e) {
    console.warn('[postinstall] Could not chmod X11KeyServer:', e)
  }
}
