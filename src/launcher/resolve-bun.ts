import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { RevoTuiLaunchError } from './errors.js'
import { readPackageManifest } from './paths.js'

const VERSION_TIMEOUT_MS = 5_000
const launcherRequire = createRequire(import.meta.url)

interface BunPackageManifest {
  readonly bin?: string | Readonly<Record<string, string>>
  readonly version?: string
}

export function resolveBunExecutable(): string {
  const expectedVersion = expectedBunVersion()
  let manifestPath: string

  try {
    manifestPath = launcherRequire.resolve('bun/package.json')
  } catch {
    throw new RevoTuiLaunchError(
      'bun-not-found',
      `The package-local bun@${expectedVersion} runtime is unavailable. Reinstall the package with lifecycle scripts enabled.`,
    )
  }

  const manifest = readManifest(manifestPath)
  const binPath = bunBinPath(manifest)
  const executable = resolve(dirname(manifestPath), binPath)

  if (!existsSync(executable)) {
    throw new RevoTuiLaunchError(
      'bun-not-found',
      `The package-local bun@${expectedVersion} executable is unavailable. Reinstall the package with lifecycle scripts enabled.`,
    )
  }

  assertBunVersion(executable, manifest.version, expectedVersion)

  return executable
}

function expectedBunVersion(): string {
  const dependency = readPackageManifest().dependencies?.bun

  if (typeof dependency !== 'string' || !/^\d+\.\d+\.\d+$/u.test(dependency)) {
    throw new RevoTuiLaunchError(
      'bun-version-mismatch',
      'The Revo TUI package must pin Bun to an exact version.',
    )
  }

  return dependency
}

function readManifest(path: string): BunPackageManifest {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as BunPackageManifest
  } catch {
    throw new RevoTuiLaunchError(
      'bun-not-found',
      'The package-local Bun manifest could not be read.',
    )
  }
}

function bunBinPath(manifest: BunPackageManifest): string {
  const bin =
    typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.bun

  if (!bin) {
    throw new RevoTuiLaunchError(
      'bun-not-found',
      'The package-local Bun manifest does not declare its executable.',
    )
  }

  return bin
}

function assertBunVersion(
  executable: string,
  packageVersion: string | undefined,
  expectedVersion: string,
): void {
  let runtimeVersion: string

  try {
    runtimeVersion = execFileSync(executable, ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: VERSION_TIMEOUT_MS,
    }).trim()
  } catch {
    throw new RevoTuiLaunchError(
      'bun-not-found',
      'The package-local Bun executable did not start successfully.',
    )
  }

  if (
    packageVersion !== expectedVersion ||
    runtimeVersion !== expectedVersion
  ) {
    throw new RevoTuiLaunchError(
      'bun-version-mismatch',
      `Expected package-local Bun ${expectedVersion}, received package ${packageVersion ?? 'unknown'} and runtime ${runtimeVersion || 'unknown'}.`,
    )
  }
}
