import { makeAutoObservable, observable, runInAction } from 'mobx'
import {
  ObservableRequest,
  errorMessageOf,
} from '../../observable-request/index.js'
import type {
  DialogueReadBackend,
  HistoryPage,
} from '../contracts/backend.types.js'
import type { DialogueItemView } from '../contracts/public.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { DialogueStore } from '../state/DialogueStore.js'
import { compareSequence, sequenceValue } from '../state/sequence.js'

type HistoryOperation = 'refresh' | 'more'

export class DialogueHistory {
  private readonly request: ObservableRequest<void, [HistoryOperation, number]>
  private itemIds: readonly string[] = []
  private cursor: string | undefined
  private snapshot: string | undefined
  private observedSequence: string | null = null
  private readonly seenCursors = new Set<string>()
  private generation = 0
  private activeMore: Promise<void> | undefined
  private activeRefresh: Promise<void> | undefined
  private readyValue = false

  public constructor(
    private readonly dialogueId: string,
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
      'backend' | 'dialogueId' | 'itemIds' | 'request' | 'seenCursors' | 'store'
    >(
      this,
      {
        backend: false,
        dialogueId: false,
        itemIds: observable.ref,
        request: false,
        seenCursors: false,
        store: false,
      },
      { autoBind: true },
    )
  }

  public get items(): readonly DialogueItemView[] {
    const model = this.store.model(this.dialogueId)
    if (model === undefined) return []
    return Object.freeze(
      this.itemIds
        .flatMap((id) => {
          const item = model.item(id)?.snapshot
          return item === undefined ? [] : [item]
        })
        .sort((left, right) => compareSequence(left.sequence, right.sequence)),
    )
  }

  public get hasMore(): boolean {
    return this.cursor !== undefined
  }

  public get loading(): boolean {
    return this.request.isLoading
  }

  public get error(): string {
    return requestError(this.request.error)
  }

  public get observed(): string | null {
    return this.observedSequence
  }

  public get ready(): boolean {
    return this.readyValue
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
    this.readyValue = false
  }

  private async fetchRefresh(generation: number): Promise<void> {
    const result = await this.request.fetch('refresh', generation)
    if (!result.isRight) throw result.error
  }

  private async fetchMore(generation: number): Promise<void> {
    if (generation !== this.generation || this.cursor === undefined) return
    const result = await this.request.fetch('more', generation)
    if (!result.isRight) throw result.error
  }

  private async fetchPage(
    operation: HistoryOperation,
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    const after = operation === 'more' ? this.cursor : undefined
    const page = await this.backend.history(this.dialogueId, after, signal)
    if (signal.aborted || generation !== this.generation) return
    this.validatePage(page, operation, after)
    const model = this.store.require(this.dialogueId)
    model.validateItems(page.items)
    if (signal.aborted || generation !== this.generation) return

    runInAction(() => {
      model.applyItems(page.items)
      const ids = page.items.map(({ id }) => id)
      this.itemIds =
        operation === 'refresh'
          ? unique(ids)
          : unique([...this.itemIds, ...ids])
      this.cursor = page.next
      this.snapshot = page.snapshot
      this.observedSequence = page.observed
      this.readyValue = true
      if (operation === 'refresh') this.seenCursors.clear()
      if (page.next !== undefined) this.seenCursors.add(page.next)
    })
  }

  private validatePage(
    page: HistoryPage,
    operation: HistoryOperation,
    after: string | undefined,
  ): void {
    if (page.observed !== null) sequenceValue(page.observed)
    if (
      operation === 'more' &&
      (page.snapshot !== this.snapshot ||
        (page.next !== undefined && this.seenCursors.has(page.next)))
    ) {
      throw protocolError('Dialogue history pagination changed unexpectedly.')
    }
    if (page.next !== undefined && (page.next === '' || page.next === after)) {
      throw protocolError(
        'Dialogue history pagination returned an invalid cursor.',
      )
    }
  }
}

function unique(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)]
}

function requestError(error: unknown): string {
  if (error == null) return ''
  return error instanceof DialogueError ? error.message : errorMessageOf(error)
}

function protocolError(message: string): DialogueError {
  return new DialogueError('protocol', message, 'refresh')
}
