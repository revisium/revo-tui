import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RevoTuiLaunchError } from './errors.js'

export function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
}

export interface PackageManifest {
  readonly version?: unknown
  readonly dependencies?: Readonly<Record<string, unknown>>
}

export function readPackageManifest(): PackageManifest {
  return JSON.parse(
    readFileSync(join(packageRoot(), 'package.json'), 'utf8'),
  ) as PackageManifest
}

export function uiEntryPath(): string {
  const entry = join(packageRoot(), 'dist', 'ui', 'main.js')

  if (!existsSync(entry)) {
    throw new RevoTuiLaunchError(
      'ui-entry-missing',
      'The installed Revo TUI package is missing its UI entry.',
    )
  }

  return entry
}
