import { execFileSync } from 'node:child_process'
import { RevoTuiLaunchError } from '../errors.js'

const ANSI_RESET =
  '\u001b[?1049l' +
  '\u001b[?25h' +
  '\u001b[0m' +
  '\u001b[?1000l\u001b[?1002l\u001b[?1003l\u001b[?1006l\u001b[?1015l\u001b[?1004l' +
  '\u001b[?2004l' +
  '\u001b[?1l\u001b>' +
  '\u001b[?2026l' +
  '\u001b[?u'
const STTY_EXECUTABLE = '/bin/stty'

export class PosixTerminal {
  readonly #stdin: NodeJS.ReadStream
  readonly #stdout: NodeJS.WriteStream
  #savedState: string | undefined
  #restored = false

  public constructor(
    stdin: NodeJS.ReadStream = process.stdin,
    stdout: NodeJS.WriteStream = process.stdout,
  ) {
    this.#stdin = stdin
    this.#stdout = stdout
  }

  public capture(): void {
    const fd = this.ttyFd()

    try {
      const state = execFileSync(STTY_EXECUTABLE, ['-g'], {
        encoding: 'utf8',
        stdio: [fd, 'pipe', 'pipe'],
      }).trim()

      if (!state) {
        throw new Error('stty returned an empty state')
      }

      this.#savedState = state
    } catch {
      throw new RevoTuiLaunchError(
        'terminal-capture-failed',
        'Could not capture the terminal state before launching the TUI.',
      )
    }
  }

  public restore(): void {
    if (this.#restored) {
      return
    }

    this.#restored = true
    const state = this.#savedState

    if (!state) {
      throw new RevoTuiLaunchError(
        'terminal-restore-failed',
        'The original terminal state was not available for restoration.',
      )
    }

    try {
      execFileSync(STTY_EXECUTABLE, [state], {
        encoding: 'utf8',
        stdio: [this.ttyFd(), 'pipe', 'pipe'],
      })
    } catch {
      throw new RevoTuiLaunchError(
        'terminal-restore-failed',
        'Could not restore the original terminal state.',
      )
    }

    if (this.#stdout.isTTY && this.#stdout.writable) {
      this.#stdout.write(ANSI_RESET)
    }
  }

  private ttyFd(): number {
    const fd = (this.#stdin as { readonly fd?: number }).fd

    if (!this.#stdin.isTTY || typeof fd !== 'number') {
      throw new RevoTuiLaunchError(
        'terminal-capture-failed',
        'A POSIX TTY file descriptor is required.',
      )
    }

    return fd
  }
}
