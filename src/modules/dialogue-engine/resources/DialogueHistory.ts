import { makeAutoObservable, observable, runInAction } from 'mobx'
import { errorMessageOf } from '../../observable-request/index.js'
import type {
  DialogueReadBackend,
  HistoryPage,
} from '../contracts/backend.types.js'
import type { DialogueItemView } from '../contracts/public.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { DialogueStore } from '../state/DialogueStore.js'
import { compareSequence, sequenceValue } from '../state/sequence.js'
import {
  ResourcePagination,
  validatePagination,
  type PageLoadContext,
  type PaginationOperation,
} from './ResourcePagination.js'

export class DialogueHistory {
  private readonly pagination: ResourcePagination
  private itemIds: readonly string[] = []
  private cursor: string | undefined
  private snapshot: string | undefined
  private observedSequence: string | null = null
  private readonly seenCursors = new Set<string>()
  private readyValue = false

  public constructor(
    private readonly dialogueId: string,
    private readonly backend: DialogueReadBackend,
    private readonly store: DialogueStore,
  ) {
    this.pagination = new ResourcePagination({
      canLoadMore: () => this.cursor !== undefined,
      load: (operation, context) => this.fetchPage(operation, context),
    })
    makeAutoObservable<
      this,
      | 'backend'
      | 'dialogueId'
      | 'itemIds'
      | 'pagination'
      | 'seenCursors'
      | 'store'
    >(
      this,
      {
        backend: false,
        dialogueId: false,
        itemIds: observable.ref,
        pagination: false,
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
    return this.pagination.loading
  }

  public get error(): string {
    const error = this.pagination.error
    if (error == null) return ''
    return error instanceof DialogueError
      ? error.message
      : errorMessageOf(error)
  }

  public get observed(): string | null {
    return this.observedSequence
  }

  public get ready(): boolean {
    return this.readyValue
  }

  public refresh(): Promise<void> {
    return this.pagination.refresh()
  }

  public loadMore(): Promise<void> {
    return this.pagination.loadMore()
  }

  public dispose(): void {
    this.pagination.dispose()
    this.readyValue = false
  }

  private async fetchPage(
    operation: PaginationOperation,
    context: PageLoadContext,
  ): Promise<void> {
    const after = operation === 'more' ? this.cursor : undefined
    const page = await this.backend.history(
      this.dialogueId,
      after,
      context.signal,
    )
    if (!context.isCurrent()) return
    this.validatePage(page, operation, after)
    const model = this.store.require(this.dialogueId)
    model.validateItems(page.items)
    if (!context.isCurrent()) return

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
    operation: PaginationOperation,
    after: string | undefined,
  ): void {
    if (page.observed !== null) sequenceValue(page.observed)
    validatePagination({
      operation,
      incomingSnapshot: page.snapshot,
      currentSnapshot: this.snapshot,
      after,
      next: page.next,
      seenCursors: this.seenCursors,
      resource: 'Dialogue history',
    })
  }
}

function unique(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)]
}
