import { makeAutoObservable, observable, runInAction } from 'mobx'
import { errorMessageOf } from '../../observable-request/index.js'
import type { DialogueReadBackend } from '../contracts/backend.types.js'
import type { SnapshotPage } from '../contracts/page.types.js'
import type { DialogueSummary } from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { DialogueStore } from '../state/DialogueStore.js'
import { DialogueResource } from './DialogueResource.js'
import {
  ResourcePagination,
  validatePagination,
  type PageLoadContext,
  type PaginationOperation,
} from './ResourcePagination.js'

export class DialogueList {
  private readonly pagination: ResourcePagination
  private readonly resources = new Map<string, DialogueResource>()
  private readonly seenCursors = new Set<string>()
  private itemIds: readonly string[] = []
  private cursor: string | undefined
  private snapshot: string | undefined
  private connectionError = ''

  public constructor(
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
      | 'itemIds'
      | 'pagination'
      | 'resources'
      | 'seenCursors'
      | 'store'
    >(
      this,
      {
        backend: false,
        itemIds: observable.ref,
        pagination: false,
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
    return this.pagination.loading
  }

  public get snapshotCursor(): string | undefined {
    return this.snapshot
  }

  public get error(): string {
    const error = this.pagination.error
    if (error == null) return this.connectionError
    return error instanceof DialogueError
      ? error.message
      : errorMessageOf(error)
  }

  public include(summary: DialogueSummary): void {
    runInAction(() => {
      this.store.include(summary)
      if (!this.itemIds.includes(summary.id))
        this.itemIds = Object.freeze([...this.itemIds, summary.id])
    })
  }

  public setConnectionError(error: string): void {
    this.connectionError = error
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
    return this.pagination.refresh()
  }

  public loadMore(): Promise<void> {
    return this.pagination.loadMore()
  }

  public dispose(): void {
    this.pagination.dispose()
    for (const resource of this.resources.values()) resource.dispose()
  }

  public cancelLoading(): void {
    this.pagination.dispose()
  }

  private async fetchPage(
    operation: PaginationOperation,
    context: PageLoadContext,
  ): Promise<void> {
    const after = operation === 'more' ? this.cursor : undefined
    const page = await this.backend.list(after, context.signal)
    if (!context.isCurrent()) return
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
    operation: PaginationOperation,
    after: string | undefined,
  ): void {
    validatePagination({
      operation,
      incomingSnapshot: page.snapshot,
      currentSnapshot: this.snapshot,
      after,
      next: page.next,
      seenCursors: this.seenCursors,
      resource: 'Dialogue list',
    })
  }
}

function unique(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)]
}
