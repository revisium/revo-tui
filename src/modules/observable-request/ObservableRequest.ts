import { makeAutoObservable, runInAction } from 'mobx'
import type { Either } from './Either.js'

export interface RequestContext {
  readonly signal: AbortSignal
}

export interface ObservableRequestOptions {
  readonly skipResetting?: boolean
}

export type RequestFunction<T, Args extends unknown[]> = (
  context: RequestContext,
  ...args: Args
) => Promise<T>

export class RequestAbortError extends Error {
  public constructor() {
    super('The request was aborted.')
    this.name = 'RequestAbortError'
  }
}

export class ObservableRequest<T, Args extends unknown[] = []> {
  private dataValue: T | null = null
  private errorValue: unknown = null
  private loading = false
  private loaded = false
  private controller: AbortController | undefined
  private generation = 0

  public constructor(
    private readonly request: RequestFunction<T, Args>,
    private readonly options: ObservableRequestOptions = {},
  ) {
    makeAutoObservable(this)
  }

  public static of<T, Args extends unknown[] = []>(
    request: RequestFunction<T, Args>,
    options?: ObservableRequestOptions,
  ): ObservableRequest<T, Args> {
    return new ObservableRequest(request, options)
  }

  public get data(): T | null {
    return this.dataValue
  }

  public get error(): unknown {
    return this.errorValue
  }

  public get isLoading(): boolean {
    return this.loading
  }

  public get isLoaded(): boolean {
    return this.loaded
  }

  public async fetch(...args: Args): Promise<Either<unknown, T>> {
    const attempt = this.beginAttempt()

    try {
      const data = await this.request({ signal: attempt.signal }, ...args)

      if (!this.isCurrent(attempt)) {
        return this.aborted()
      }

      runInAction(() => {
        this.dataValue = data
        this.errorValue = null
      })
      return { isRight: true, data }
    } catch (error) {
      if (!this.isCurrent(attempt)) {
        return this.aborted()
      }

      runInAction(() => {
        this.errorValue = error
      })
      return { isRight: false, error }
    } finally {
      if (this.isCurrent(attempt)) {
        runInAction(() => {
          this.controller = undefined
          this.loading = false
          this.loaded = true
        })
      }
    }
  }

  public abort(): void {
    this.generation += 1
    this.controller?.abort()
    this.controller = undefined
    this.loading = false
    this.loaded = true
  }

  private beginAttempt(): RequestAttempt {
    this.controller?.abort()
    const controller = new AbortController()
    const generation = this.generation + 1
    this.generation = generation
    this.controller = controller

    if (!this.options.skipResetting) {
      this.dataValue = null
      this.errorValue = null
    }

    this.loading = true
    this.loaded = false
    return { generation, signal: controller.signal }
  }

  private isCurrent(attempt: RequestAttempt): boolean {
    return attempt.generation === this.generation && !attempt.signal.aborted
  }

  private aborted(): Either<RequestAbortError, never> {
    return { isRight: false, error: new RequestAbortError() }
  }
}

interface RequestAttempt {
  readonly generation: number
  readonly signal: AbortSignal
}
