const PARENT_POLL_MS = 1_000

export class TerminalPresence {
  readonly #parentPid = process.ppid
  #onLost: (() => void) | undefined
  #timer: ReturnType<typeof setInterval> | undefined

  public start(onLost: () => void): void {
    if (this.#onLost !== undefined) {
      return
    }

    this.#onLost = onLost
    process.stdin.on('end', this.lose)
    process.stdin.on('close', this.lose)
    this.#timer = setInterval(this.checkParent, PARENT_POLL_MS)
    this.#timer.unref()
  }

  public stop(): void {
    if (this.#onLost === undefined) {
      return
    }

    this.#onLost = undefined
    process.stdin.off('end', this.lose)
    process.stdin.off('close', this.lose)
    clearInterval(this.#timer)
    this.#timer = undefined
  }

  private readonly checkParent = (): void => {
    if (process.ppid !== this.#parentPid) {
      this.lose()
    }
  }

  private readonly lose = (): void => {
    this.#onLost?.()
  }
}
