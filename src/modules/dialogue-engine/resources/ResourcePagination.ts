import { ObservableRequest } from '../../observable-request/index.js'
import { DialogueError } from '../errors/DialogueError.js'

export type PaginationOperation = 'refresh' | 'more'

export interface PageLoadContext {
  readonly signal: AbortSignal
  isCurrent(): boolean
}

interface ResourcePaginationOptions {
  readonly canLoadMore: () => boolean
  readonly load: (
    operation: PaginationOperation,
    context: PageLoadContext,
  ) => Promise<void>
}

export class ResourcePagination {
  private readonly request: ObservableRequest<
    void,
    [PaginationOperation, number]
  >
  private generation = 0
  private activeMore: Promise<void> | undefined
  private activeRefresh: Promise<void> | undefined

  public constructor(private readonly options: ResourcePaginationOptions) {
    this.request = ObservableRequest.of(
      ({ signal }, operation, generation) =>
        this.load(operation, generation, signal),
      { skipResetting: true },
    )
  }

  public get loading(): boolean {
    return this.request.isLoading
  }

  public get error(): unknown {
    return this.request.error
  }

  public refresh(): Promise<void> {
    const generation = this.generation + 1
    this.generation = generation
    this.request.abort()
    this.activeMore = undefined
    const outcome = this.fetch('refresh', generation)
    const promise = outcome.finally(() => {
      if (this.activeRefresh === promise) this.activeRefresh = undefined
    })
    this.activeRefresh = promise
    promise.catch(() => undefined)
    return promise
  }

  public loadMore(): Promise<void> {
    if (this.activeMore !== undefined) return this.activeMore
    const generation = this.generation
    const outcome =
      this.activeRefresh === undefined
        ? this.fetchMore(generation)
        : this.activeRefresh.then(() => this.fetchMore(generation))
    const promise = outcome.finally(() => {
      if (this.activeMore === promise) this.activeMore = undefined
    })
    this.activeMore = promise
    promise.catch(() => undefined)
    return promise
  }

  public dispose(): void {
    this.generation += 1
    this.request.abort()
    this.activeMore = undefined
    this.activeRefresh = undefined
  }

  private async fetchMore(generation: number): Promise<void> {
    if (generation !== this.generation || !this.options.canLoadMore()) return
    await this.fetch('more', generation)
  }

  private async fetch(
    operation: PaginationOperation,
    generation: number,
  ): Promise<void> {
    const result = await this.request.fetch(operation, generation)
    if (!result.isRight) throw result.error
  }

  private load(
    operation: PaginationOperation,
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    if (generation !== this.generation) return Promise.resolve()
    return this.options.load(operation, {
      signal,
      isCurrent: () =>
        generation === this.generation && signal.aborted === false,
    })
  }
}

interface PaginationValidation {
  readonly operation: PaginationOperation
  readonly incomingSnapshot: string
  readonly currentSnapshot: string | undefined
  readonly after: string | undefined
  readonly next: string | undefined
  readonly seenCursors: ReadonlySet<string>
  readonly resource: string
}

export function validatePagination(options: PaginationValidation): void {
  if (
    options.operation === 'more' &&
    (options.incomingSnapshot !== options.currentSnapshot ||
      (options.next !== undefined && options.seenCursors.has(options.next)))
  ) {
    throw protocolError(`${options.resource} pagination changed unexpectedly.`)
  }
  if (
    options.next !== undefined &&
    (options.next === '' || options.next === options.after)
  ) {
    throw protocolError(
      `${options.resource} pagination returned an invalid cursor.`,
    )
  }
}

function protocolError(message: string): DialogueError {
  return new DialogueError('protocol', message, 'refresh')
}
