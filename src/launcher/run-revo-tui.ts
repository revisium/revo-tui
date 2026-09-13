import { spawn, type ChildProcess } from 'node:child_process'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { RevoTuiLaunchError } from './errors.js'
import { ChildLifecycle } from './lifecycle.js'
import { uiEntryPath } from './paths.js'
import { PosixTerminal } from './platform/posix-terminal.js'
import { resolveBunExecutable } from './resolve-bun.js'

export interface RunRevoTuiOptions {
  readonly apiUrl: string
  readonly dataDir?: string
  readonly signal?: AbortSignal
}

export async function runRevoTui(options: RunRevoTuiOptions): Promise<number> {
  const apiUrl = normalizeApiUrl(options.apiUrl)
  const dataDir = resolve(options.dataDir ?? defaultDataDir())

  assertTty()
  assertNotAborted(options.signal)

  const bunExecutable = resolveBunExecutable()
  const uiEntry = uiEntryPath()
  const terminal = new PosixTerminal()
  terminal.capture()

  return launchChild({
    bunExecutable,
    uiEntry,
    apiUrl,
    dataDir,
    signal: options.signal,
    terminal,
  })
}

interface LaunchChildOptions {
  readonly bunExecutable: string
  readonly uiEntry: string
  readonly apiUrl: string
  readonly dataDir: string
  readonly signal?: AbortSignal
  readonly terminal: PosixTerminal
}

function launchChild(options: LaunchChildOptions): Promise<number> {
  return new Promise((resolvePromise, rejectPromise) => {
    let child: ChildProcess

    try {
      child = spawn(options.bunExecutable, [options.uiEntry], {
        env: {
          ...process.env,
          REVO_TUI_API_URL: options.apiUrl,
          REVO_TUI_DATA_DIR: options.dataDir,
        },
        stdio: 'inherit',
      })
    } catch (error) {
      rejectSpawn(error, options.terminal, rejectPromise)
      return
    }

    const lifecycle = new ChildLifecycle(
      child,
      options.terminal,
      options.signal,
      resolvePromise,
      rejectPromise,
    )
    lifecycle.start()
  })
}

function rejectSpawn(
  error: unknown,
  terminal: PosixTerminal,
  rejectPromise: (reason: unknown) => void,
): void {
  try {
    terminal.restore()
  } catch (restoreError) {
    rejectPromise(restoreError)
    return
  }

  const detail = error instanceof Error ? error.message : String(error)
  rejectPromise(
    new RevoTuiLaunchError(
      'spawn-failed',
      `Could not start the Revo TUI: ${detail}`,
    ),
  )
}

function normalizeApiUrl(value: string): string {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw invalidApiUrl()
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw invalidApiUrl()
  }

  url.hash = ''
  return url.toString()
}

function invalidApiUrl(): RevoTuiLaunchError {
  return new RevoTuiLaunchError(
    'invalid-api-url',
    'API URL must be absolute HTTP or HTTPS without embedded credentials.',
  )
}

function assertTty(): void {
  if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
    throw new RevoTuiLaunchError(
      'no-tty',
      'revo-tui requires a TTY on stdin and stdout.',
    )
  }
}

function assertNotAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new RevoTuiLaunchError(
      'launch-aborted',
      'The Revo TUI launch was aborted before the child process started.',
    )
  }
}

function defaultDataDir(): string {
  return resolve(homedir(), '.revo', 'tui')
}
