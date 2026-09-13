import { print, type DocumentNode } from 'graphql'
import {
  SubscriptionError,
  SubscriptionOverflowError,
} from './SubscriptionError.js'
import type { SseConnection } from './SseConnection.js'
import type {
  SubscriptionLease,
  SubscriptionOptions,
  SubscriptionState,
  SubscriptionVariables,
} from './subscription.types.js'

const DEFAULT_QUEUE_LIMIT = 128

export class SubscriptionOperation<
  T,
  V extends SubscriptionVariables,
> implements SubscriptionLease {
  public readonly done: Promise<void>
  private readonly query: string
  private readonly queue: T[] = []
  private resolveDone: () => void = () => undefined
  private rejectDone: (error: unknown) => void = () => undefined
  private controller = new AbortController()
  private transport: { dispose(): void } | undefined
  private work: Promise<void> = Promise.resolve()
  private generation = 0
  private processing = false
  private serverCompleted = false
  private finished = false
  private released = false

  public constructor(
    document: DocumentNode,
    private readonly options: SubscriptionOptions<T, V>,
    private readonly release: () => void,
  ) {
    this.query = print(document)
    this.done = new Promise((resolve, reject) => {
      this.resolveDone = resolve
      this.rejectDone = reject
    })
    this.done.catch(() => undefined)

    if (!options.signal.aborted) {
      options.signal.addEventListener('abort', this.dispose, { once: true })
    }
  }

  public start(connection: SseConnection): void {
    const previousWork = this.suspendGeneration()
    const generation = this.generation
    const signal = this.controller.signal
    this.work = previousWork
      .catch(() => undefined)
      .then(async () => {
        if (!this.isActive(generation)) return
        const variables = await this.options.prepare(signal)
        if (!this.isActive(generation)) return

        this.transport = connection.subscribe<T>(this.query, variables, {
          next: (data) => this.receive(generation, data),
          error: (error) => queueMicrotask(() => this.requestFinish(error)),
          complete: () => this.serverComplete(generation),
        })
      })
      .catch(() => {
        if (this.isActive(generation)) {
          this.requestFinish(
            new SubscriptionError(
              'protocol',
              'The subscription could not be prepared.',
            ),
          )
        }
      })
  }

  public change(state: SubscriptionState): void {
    if (this.finished) return

    try {
      this.options.changed?.(state)
    } catch {
      this.requestFinish(
        new SubscriptionError(
          'protocol',
          'The subscription state callback failed.',
        ),
      )
    }
  }

  public dispose = (): void => {
    this.requestFinish()
  }

  public fail(error: SubscriptionError): void {
    this.requestFinish(error)
  }

  private receive(generation: number, data: T): void {
    if (!this.isActive(generation)) return

    if (this.processing) {
      if (this.queue.length >= DEFAULT_QUEUE_LIMIT) {
        this.requestFinish(new SubscriptionOverflowError())
      } else {
        this.queue.push(data)
      }
      return
    }

    this.processing = true
    this.work = Promise.resolve().then(() => this.consume(generation, data))
  }

  private async consume(generation: number, first: T): Promise<void> {
    let current = first

    try {
      while (this.isActive(generation)) {
        await this.options.next(current, this.controller.signal)
        if (this.queue.length === 0) break
        current = this.queue.shift() as T
      }

      this.processing = false
      if (this.isActive(generation) && this.serverCompleted) {
        this.requestFinish()
      }
    } catch {
      this.processing = false
      if (this.isActive(generation)) {
        this.requestFinish(
          new SubscriptionError(
            'protocol',
            'The subscription consumer failed to process an event.',
          ),
        )
      }
    }
  }

  private serverComplete(generation: number): void {
    if (!this.isActive(generation)) return
    this.serverCompleted = true

    if (!this.processing && this.queue.length === 0) {
      this.requestFinish()
    }
  }

  private suspendGeneration(): Promise<void> {
    const previousWork = this.work
    this.generation += 1
    this.controller.abort()
    this.controller = new AbortController()
    this.transport?.dispose()
    this.transport = undefined
    this.queue.length = 0
    this.processing = false
    this.serverCompleted = false
    return previousWork
  }

  private requestFinish(error?: SubscriptionError): void {
    if (this.finished) return
    this.finished = true
    const pendingWork = this.suspendGeneration()
    this.options.signal.removeEventListener('abort', this.dispose)
    this.releaseOnce()

    const settle = (): void => {
      if (error === undefined) this.resolveDone()
      else this.rejectDone(error)
    }
    pendingWork.then(settle, settle).catch(() => undefined)
  }

  private releaseOnce(): void {
    if (this.released) return
    this.released = true
    this.release()
  }

  private isActive(generation: number): boolean {
    return !this.finished && generation === this.generation
  }
}
