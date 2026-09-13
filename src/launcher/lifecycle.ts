import { type ChildProcess } from 'node:child_process'
import { constants } from 'node:os'
import { RevoTuiLaunchError } from './errors.js'
import { PosixTerminal } from './platform/posix-terminal.js'

const GRACE_PERIOD_MS = 2_000
const SIGNAL_EXIT_CODE_BASE = 128
const PARENT_SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const

type ParentSignal = (typeof PARENT_SIGNALS)[number]

export class ChildLifecycle {
  readonly #child: ChildProcess
  readonly #terminal: PosixTerminal
  readonly #abortSignal: AbortSignal | undefined
  readonly #resolve: (code: number) => void
  readonly #reject: (error: unknown) => void
  readonly #signalHandlers = new Map<ParentSignal, () => void>()
  #graceTimer: ReturnType<typeof setTimeout> | undefined
  #interruptionCode: number | undefined
  #settled = false

  public constructor(
    child: ChildProcess,
    terminal: PosixTerminal,
    abortSignal: AbortSignal | undefined,
    resolvePromise: (code: number) => void,
    rejectPromise: (error: unknown) => void,
  ) {
    this.#child = child
    this.#terminal = terminal
    this.#abortSignal = abortSignal
    this.#resolve = resolvePromise
    this.#reject = rejectPromise
  }

  public start(): void {
    for (const signal of PARENT_SIGNALS) {
      const handler = (): void => this.onParentSignal(signal)
      this.#signalHandlers.set(signal, handler)
      process.on(signal, handler)
    }

    this.#abortSignal?.addEventListener('abort', this.onAbort, { once: true })
    this.#child.once('error', this.onError)
    this.#child.once('exit', this.onExit)

    if (this.#abortSignal?.aborted) {
      this.onAbort()
    }
  }

  private onParentSignal(signal: ParentSignal): void {
    this.interrupt(signal, signalExitCode(signal))
  }

  private readonly onAbort = (): void => {
    this.interrupt('SIGTERM', signalExitCode('SIGTERM'))
  }

  private readonly onError = (error: Error): void => {
    this.finish(
      undefined,
      new RevoTuiLaunchError(
        'spawn-failed',
        `Could not start the Revo TUI: ${error.message}`,
      ),
    )
  }

  private readonly onExit = (
    code: number | null,
    signal: NodeJS.Signals | null,
  ): void => {
    const result =
      this.#interruptionCode ?? (signal ? signalExitCode(signal) : (code ?? 1))
    this.finish(result)
  }

  private interrupt(signal: ParentSignal, exitCode: number): void {
    if (this.#settled || this.#interruptionCode !== undefined) {
      return
    }

    this.#interruptionCode = exitCode
    this.#child.kill(signal)
    this.#graceTimer = setTimeout(() => {
      if (this.#child.exitCode === null && this.#child.signalCode === null) {
        this.#child.kill('SIGKILL')
      }
    }, GRACE_PERIOD_MS)
    this.#graceTimer.unref()
  }

  private finish(code: number | undefined, error?: unknown): void {
    if (this.#settled) {
      return
    }

    this.#settled = true
    this.cleanup()

    try {
      this.#terminal.restore()
    } catch (restoreError) {
      this.#reject(restoreError)
      return
    }

    if (error !== undefined) {
      this.#reject(error)
      return
    }

    this.#resolve(code ?? 1)
  }

  private cleanup(): void {
    if (this.#graceTimer !== undefined) {
      clearTimeout(this.#graceTimer)
    }

    for (const signal of PARENT_SIGNALS) {
      const handler = this.#signalHandlers.get(signal)

      if (handler) {
        process.off(signal, handler)
      }
    }

    this.#abortSignal?.removeEventListener('abort', this.onAbort)
    this.#child.off('error', this.onError)
    this.#child.off('exit', this.onExit)
  }
}

function signalExitCode(signal: NodeJS.Signals): number {
  return SIGNAL_EXIT_CODE_BASE + (constants.signals[signal] ?? 1)
}
