import { makeAutoObservable, observable, runInAction } from 'mobx'
import {
  ObservableRequest,
  errorMessageOf,
} from '../../observable-request/index.js'
import type { DialogueReadBackend } from '../contracts/backend.types.js'
import type { SnapshotPage } from '../contracts/page.types.js'
import type { DialogueSummary } from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { DialogueStore } from '../state/DialogueStore.js'
import { DialogueResource } from './DialogueResource.js'

type ListOperation = 'refresh' | 'more'

export class DialogueList {
  private readonly request: ObservableRequest<void, [ListOperation, number]>
  private readonly resources = new Map<string, DialogueResource>()
  private readonly seenCursors = new Set<string>()
  private itemIds: readonly string[] = []
  private cursor: string | undefined
  private snapshot: string | undefined
  private generation = 0
  private activeMore: Promise<void> | undefined
  private activeRefresh: Promise<void> | undefined

  public constructor(
    private readonly backend: DialogueReadBackend,
    private readonly store: DialogueStore,
  ) {
    this.request = ObservableRequest.of(
      ({ signal }, operation, generation) =>
        this.fetchPage(operation, generation, signal),
      { skipResetting: true },
    )
    makeAutoObservable<
      this,
      'backend' | 'itemIds' | 'request' | 'resources' | 'seenCursors' | 'store'
    >(
      this,
      {
        backend: false,
        itemIds: observable.ref,
        request: false,
        resources: false,
        seenCursors: false,
        store: false,
      },
      { autoBind: true },
    )
  }

  public get items(): readonly DialogueResource[] {
    return Object.freeze(this.itemIds.map((id) => this.resource(id)))
  }

  public get hasMore(): boolean {
    return this.cursor !== undefined
  }

  public get loading(): boolean {
    return this.request.isLoading
  }

  public get error(): string {
    const error = this.request.error
    if (error == null) return ''
    return error instanceof DialogueError
      ? error.message
      : errorMessageOf(error)
  }

  public resource(id: string): DialogueResource {
    let resource = this.resources.get(id)
    if (resource === undefined) {
      resource = new DialogueResource(id, this.backend, this.store)
      this.resources.set(id, resource)
    }
    return resource
  }

  public refresh(): Promise<void> {
    const generation = this.generation + 1
    this.generation = generation
    this.request.abort()
    this.activeMore = undefined
    const outcome = this.fetchRefresh(generation)
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
    for (const resource of this.resources.values()) resource.dispose()
  }

  private async fetchMore(generation: number): Promise<void> {
    if (generation !== this.generation || this.cursor === undefined) return
    const result = await this.request.fetch('more', generation)
    if (!result.isRight) throw result.error
  }

  private async fetchRefresh(generation: number): Promise<void> {
    const result = await this.request.fetch('refresh', generation)
    if (!result.isRight) throw result.error
  }

  private async fetchPage(
    operation: ListOperation,
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    const after = operation === 'more' ? this.cursor : undefined
    const page = await this.backend.list(after, signal)
    if (signal.aborted || generation !== this.generation) return
    this.validatePage(page, operation, after)

    runInAction(() => {
      this.store.includeAll(page.items)
      const ids = page.items.map(({ id }) => id)
      this.itemIds =
        operation === 'refresh'
          ? unique(ids)
          : unique([...this.itemIds, ...ids])
      this.cursor = page.next
      this.snapshot = page.snapshot
      if (operation === 'refresh') this.seenCursors.clear()
      if (page.next !== undefined) this.seenCursors.add(page.next)
    })
  }

  private validatePage(
    page: SnapshotPage<DialogueSummary>,
    operation: ListOperation,
    after: string | undefined,
  ): void {
    if (
      operation === 'more' &&
      (page.snapshot !== this.snapshot ||
        (page.next !== undefined && this.seenCursors.has(page.next)))
    ) {
      throw protocolError('Dialogue list pagination changed unexpectedly.')
    }
    if (page.next !== undefined && (page.next === '' || page.next === after)) {
      throw protocolError(
        'Dialogue list pagination returned an invalid cursor.',
      )
    }
  }
}

function unique(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)]
}

function protocolError(message: string): DialogueError {
  return new DialogueError('protocol', message, 'refresh')
}
