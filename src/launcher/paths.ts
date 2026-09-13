import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RevoTuiLaunchError } from './errors.js'

export function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
}

export function uiEntryPath(): string {
  const entry = join(packageRoot(), 'dist', 'ui', 'main.js')

  if (!existsSync(entry)) {
    throw new RevoTuiLaunchError(
      'ui-entry-missing',
      'The Revo TUI UI entry is missing. UI delivery starts in T2.',
    )
  }

  return entry
}
