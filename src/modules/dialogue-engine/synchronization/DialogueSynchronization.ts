import type { DialogueBackend } from '../contracts/backend.types.js'
import type {
  DialogueChange,
  DialogueInteraction,
  DialogueItem,
  DialogueTurn,
} from '../contracts/dialogue.types.js'
import type { SnapshotPage } from '../contracts/page.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import {
  DialogueProjection,
  validateDialogueChange,
} from '../projection/DialogueProjection.js'
import type { DialogueList } from '../resources/DialogueList.js'
import type { DialogueResource } from '../resources/DialogueResource.js'
import type { DialogueStore } from '../state/DialogueStore.js'
import { validateSummary } from '../state/DialogueModel.js'
import { compareSequence } from '../state/sequence.js'
import { runInAction } from 'mobx'
import { ChangeFeed } from './ChangeFeed.js'

export class DialogueSynchronization {
  private readonly projection: DialogueProjection
  private readonly relatedGenerations = new Map<string, number>()

  public constructor(
    private readonly backend: DialogueBackend,
    private readonly store: DialogueStore,
    private readonly list: DialogueList,
  ) {
    this.projection = new DialogueProjection(store)
  }

  public summaryFeed(): ChangeFeed {
    return new ChangeFeed({
      watch: (options) => this.backend.watch(undefined, options),
      snapshot: (signal) => this.summarySnapshot(signal),
      apply: (change) => {
        validateDialogueChange(change)
        if (change.summary != null) {
          validateSummary(change.summary)
          if (change.summary.id !== change.dialogueId) {
            throw new DialogueError(
              'identity-mismatch',
              'Dialogue summary belongs to a different dialogue.',
              'refresh',
            )
          }
          this.list.include(change.summary)
        }
        return Promise.resolve()
      },
      failed: this.list.setConnectionError,
    })
  }

  public dialogueFeed(resource: DialogueResource): ChangeFeed {
    return new ChangeFeed({
      watch: (options) => this.backend.watch(resource.id, options),
      snapshot: (signal) => this.dialogueSnapshot(resource, signal),
      apply: (change, signal) => this.apply(resource, change, signal),
      failed: resource.history.setConnectionError,
    })
  }

  public cancel(dialogueId: string): void {
    this.relatedGenerations.set(
      dialogueId,
      this.relatedGeneration(dialogueId) + 1,
    )
  }

  private async summarySnapshot(signal: AbortSignal): Promise<string> {
    this.list.setConnectionError('')
    await linked(this.list.refresh, signal, this.list.cancelLoading)
    if (signal.aborted) throw aborted()
    return requiredCursor(this.list.snapshotCursor)
  }

  private async dialogueSnapshot(
    resource: DialogueResource,
    signal: AbortSignal,
  ): Promise<string> {
    resource.history.setConnectionError('')
    await linked(resource.refresh, signal, resource.dispose)
    if (signal.aborted) throw aborted()
    await this.refreshRelated(resource.id, signal)
    return requiredCursor(resource.history.snapshotCursor)
  }

  private async apply(
    resource: DialogueResource,
    change: DialogueChange,
    signal: AbortSignal,
  ): Promise<void> {
    if (change.dialogueId !== resource.id) {
      throw new DialogueError(
        'identity-mismatch',
        'Dialogue update belongs to a different dialogue.',
        'refresh',
      )
    }
    validateDialogueChange(change)
    let effectiveChange = change
    if (needsRepair(this.store, change)) {
      const itemId = change.itemId as string
      const item = await this.backend.item(change.dialogueId, itemId, signal)
      if (signal.aborted) throw aborted()
      validateItemIdentity(item, change.dialogueId, itemId)
      effectiveChange = {
        cursor: change.cursor,
        dialogueId: change.dialogueId,
        kind: 'HISTORY_ITEM_REPAIRED',
        summary: change.summary,
        item,
      }
    }
    runInAction(() => {
      const result = this.projection.apply(effectiveChange)
      if (result.status === 'repair-required')
        throw protocol('Dialogue item repair was incomplete.')
      if (effectiveChange.summary != null)
        this.list.include(effectiveChange.summary)
      if (effectiveChange.item != null)
        resource.history.include(effectiveChange.item)
    })
    if (relatedChanged(change))
      await this.refreshRelated(change.dialogueId, signal)
  }

  private async refreshRelated(
    dialogueId: string,
    signal: AbortSignal,
  ): Promise<void> {
    const generation = this.relatedGeneration(dialogueId) + 1
    this.relatedGenerations.set(dialogueId, generation)
    const [turns, interactions] = await Promise.all([
      collect(
        (after) => this.backend.turns(dialogueId, after, signal),
        'turns',
        signal,
      ),
      collect(
        (after) => this.backend.interactions(dialogueId, after, signal),
        'interactions',
        signal,
      ),
    ])
    if (signal.aborted || generation !== this.relatedGeneration(dialogueId))
      return
    this.store.require(dialogueId).replaceRelated(turns, interactions)
  }

  private relatedGeneration(dialogueId: string): number {
    return this.relatedGenerations.get(dialogueId) ?? 0
  }
}

function needsRepair(store: DialogueStore, change: DialogueChange): boolean {
  if (
    change.kind !== 'HISTORY_TEXT_APPENDED' ||
    change.itemId == null ||
    change.itemVersion == null ||
    change.baseItemVersion == null
  )
    return false
  const item = store.model(change.dialogueId)?.item(change.itemId)
  if (item === undefined) return true
  return (
    compareSequence(item.version, change.itemVersion) < 0 &&
    item.version !== change.baseItemVersion
  )
}

async function linked<T>(
  start: () => Promise<T>,
  signal: AbortSignal,
  cancel: () => void,
): Promise<T> {
  if (signal.aborted) {
    cancel()
    throw aborted()
  }
  const abort = (): void => cancel()
  signal.addEventListener('abort', abort, { once: true })
  try {
    return await start()
  } finally {
    signal.removeEventListener('abort', abort)
  }
}

async function collect<T>(
  load: (after?: string) => Promise<SnapshotPage<T>>,
  resource: string,
  signal: AbortSignal,
): Promise<readonly T[]> {
  const items: T[] = []
  const cursors = new Set<string>()
  let snapshot: string | undefined
  let after: string | undefined
  do {
    if (signal.aborted) throw aborted()
    const page = await load(after)
    if (signal.aborted) throw aborted()
    if (snapshot !== undefined && page.snapshot !== snapshot)
      throw protocol(`Dialogue ${resource} snapshot changed during pagination.`)
    snapshot = page.snapshot
    items.push(...page.items)
    if (
      page.next !== undefined &&
      (page.next === after || cursors.has(page.next))
    ) {
      throw protocol(`Dialogue ${resource} pagination cursor repeated.`)
    }
    if (page.next !== undefined) cursors.add(page.next)
    after = page.next
  } while (after !== undefined)
  return items
}

function relatedChanged(change: DialogueChange): boolean {
  return (
    change.summary != null ||
    change.item?.kind === 'INTERACTION' ||
    change.item?.kind === 'RESULT'
  )
}

function validateItemIdentity(
  item: DialogueItem,
  dialogueId: string,
  itemId: string,
): void {
  if (item.dialogueId !== dialogueId || item.id !== itemId)
    throw protocol('Dialogue item repair returned a different item.')
}

function requiredCursor(cursor: string | undefined): string {
  if (cursor === undefined || cursor === '')
    throw protocol('Dialogue snapshot cursor is unavailable.')
  return cursor
}

function aborted(): DialogueError {
  return new DialogueError(
    'protocol',
    'Dialogue synchronization was cancelled.',
    'stop',
  )
}

function protocol(message: string): DialogueError {
  return new DialogueError('protocol', message, 'refresh')
}

export type RelatedSnapshot = {
  readonly turns: readonly DialogueTurn[]
  readonly interactions: readonly DialogueInteraction[]
}
