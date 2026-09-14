import { makeAutoObservable } from 'mobx'
import type { DialogueWatchOptions } from '../contracts/backend.types.js'
import type { DialogueChange } from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { SubscriptionState } from '../../graphql-subscriptions/index.js'

interface ChangeFeedOptions {
  readonly watch: (options: DialogueWatchOptions) => {
    readonly done: Promise<void>
    dispose(): void
  }
  readonly snapshot: (signal: AbortSignal) => Promise<string>
  readonly apply: (change: DialogueChange, signal: AbortSignal) => Promise<void>
  readonly failed?: (message: string) => void
  readonly changed?: (state: SubscriptionState) => void
}

export class ChangeFeed {
  private controller: AbortController | undefined
  private lease: ReturnType<ChangeFeedOptions['watch']> | undefined
  private cursor: string | undefined
  private generation = 0
  private recoveryRequested = false
  private recovered = false
  private readySettled = false
  private readonly readyResolve: () => void
  private readonly readyReject: (error: unknown) => void
  public readonly ready: Promise<void>
  public error = ''

  public constructor(private readonly options: ChangeFeedOptions) {
    let resolve!: () => void
    let reject!: (error: unknown) => void
    this.ready = new Promise<void>((accept, decline) => {
      resolve = accept
      reject = decline
    })
    this.readyResolve = resolve
    this.readyReject = reject
    makeAutoObservable<
      this,
      'controller' | 'lease' | 'options' | 'readyResolve' | 'readyReject'
    >(this, {
      controller: false,
      lease: false,
      options: false,
      ready: false,
      readyResolve: false,
      readyReject: false,
    })
  }

  public start(): void {
    if (this.controller !== undefined) return
    this.ready.catch(() => undefined)
    this.controller = new AbortController()
    const generation = ++this.generation
    this.change(generation, { status: 'Connecting', error: '' })
    if (generation === this.generation && this.controller !== undefined)
      this.open(generation)
  }

  public stop(): void {
    if (this.controller === undefined) return
    this.generation += 1
    this.controller.abort()
    this.lease?.dispose()
    this.lease = undefined
    this.controller = undefined
    this.options.changed?.({ status: 'Stopped', error: '' })
    this.settleReady(
      new DialogueError('protocol', 'Dialogue loading was cancelled.', 'stop'),
    )
  }

  private open(generation: number): void {
    const controller = this.controller
    if (controller === undefined) return
    try {
      const lease = this.options.watch({
        signal: controller.signal,
        prepare: (signal) => this.prepare(generation, signal),
        receive: (change, signal) => this.receive(generation, change, signal),
        changed: (state) => this.change(generation, state),
      })
      if (generation !== this.generation) {
        lease.dispose()
        return
      }
      this.lease = lease
      lease.done.then(
        () =>
          this.finished(
            generation,
            new DialogueError('network', 'Dialogue updates ended.', 'retry'),
          ),
        (error: unknown) => this.finished(generation, error),
      )
    } catch (error) {
      this.finished(generation, error)
    }
  }

  private async prepare(
    generation: number,
    signal: AbortSignal,
  ): Promise<string | undefined> {
    if (this.cursor !== undefined) return this.cursor
    const cursor = await this.options.snapshot(signal)
    if (generation !== this.generation || signal.aborted) return undefined
    this.cursor = cursor
    this.settleReady()
    return cursor
  }

  private async receive(
    generation: number,
    change: DialogueChange,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      if (generation !== this.generation || signal.aborted) throw cancelled()
      await this.options.apply(change, signal)
      if (generation === this.generation && !signal.aborted)
        this.cursor = change.cursor
    } catch (error) {
      if (generation !== this.generation || signal.aborted) throw error
      if (error instanceof DialogueError && error.recovery === 'refresh')
        this.recoveryRequested = true
      throw error
    }
  }

  private finished(generation: number, error: unknown): void {
    if (generation !== this.generation || this.controller === undefined) return
    const refresh =
      this.recoveryRequested ||
      (error instanceof DialogueError && error.recovery === 'refresh')
    if (refresh && !this.recovered) {
      this.recoveryRequested = false
      this.recovered = true
      this.cursor = undefined
      this.lease?.dispose()
      this.lease = undefined
      this.open(++this.generation)
      return
    }
    this.error =
      error instanceof DialogueError
        ? error.message
        : 'Dialogue updates are unavailable.'
    this.controller.abort()
    this.lease?.dispose()
    this.lease = undefined
    this.controller = undefined
    this.settleReady(error)
    this.options.changed?.({ status: 'Stopped', error: this.error })
    this.options.failed?.(this.error)
  }

  private change(generation: number, state: SubscriptionState): void {
    if (generation !== this.generation || this.controller === undefined) return
    this.options.changed?.({ status: state.status, error: state.error })
  }

  private settleReady(error?: unknown): void {
    if (this.readySettled) return
    this.readySettled = true
    if (error === undefined) this.readyResolve()
    else this.readyReject(error)
  }
}

function cancelled(): DialogueError {
  return new DialogueError(
    'protocol',
    'Dialogue synchronization was cancelled.',
    'stop',
  )
}
