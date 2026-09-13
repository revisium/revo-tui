import { runInAction } from 'mobx'
import type { DialogueChange } from '../contracts/dialogue.types.js'
import type { ProjectionResult } from '../contracts/public.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import { type DialogueModel, validateSummary } from '../state/DialogueModel.js'
import { validateItem } from '../state/DialogueItemModel.js'
import { DialogueStore } from '../state/DialogueStore.js'
import { compareSequence, sequenceValue } from '../state/sequence.js'

export class DialogueProjection {
  public constructor(private readonly store: DialogueStore) {}

  public apply(change: DialogueChange): ProjectionResult {
    validateDialogueChange(change)
    const current = this.store.model(change.dialogueId)
    if (
      current === undefined &&
      (change.summary === undefined || change.summary === null)
    ) {
      throw new DialogueError(
        'invalid-change',
        'Dialogue snapshot is required before applying this change.',
        'refresh',
      )
    }
    if (current !== undefined && change.item != null) {
      current.validateItemIdentity(change.item)
    }

    let summaryApplied = false
    let itemResult: ProjectionResult | undefined
    runInAction(() => {
      summaryApplied = this.applySummary(change)
      const model = this.store.require(change.dialogueId)
      if (change.item != null) {
        itemResult = resultOf(
          model.applyItem(change.item),
          change.dialogueId,
          change.item.id,
        )
      } else if (change.kind === 'HISTORY_TEXT_APPENDED') {
        itemResult = this.applyDelta(model, change)
      }
    })
    return combinedResult(summaryApplied, itemResult, change.dialogueId)
  }

  private applySummary(change: DialogueChange): boolean {
    const summary = change.summary
    if (summary === undefined || summary === null) return false
    if (summary.id !== change.dialogueId) {
      throw new DialogueError(
        'identity-mismatch',
        'Dialogue change contains a summary for a different dialogue.',
        'refresh',
      )
    }
    return this.store.include(summary).changed
  }

  private applyDelta(
    model: DialogueModel,
    change: DialogueChange,
  ): ProjectionResult {
    const itemId = change.itemId as string
    const baseVersion = change.baseItemVersion as string
    const itemVersion = change.itemVersion as string
    const textDelta = change.textDelta as string
    const item = model.item(itemId)
    if (item === undefined) return repair(change.dialogueId, itemId)
    if (compareSequence(item.version, itemVersion) >= 0) {
      return resultOf(false, change.dialogueId, itemId)
    }
    if (
      item.version !== baseVersion ||
      compareSequence(itemVersion, baseVersion) <= 0
    ) {
      return repair(change.dialogueId, itemId)
    }
    return resultOf(
      item.append(textDelta, baseVersion, itemVersion),
      change.dialogueId,
      itemId,
    )
  }
}

export function validateDialogueChange(change: DialogueChange): void {
  if (change.cursor === '') invalidChange('Dialogue change cursor is required.')
  if (change.dialogueId === '')
    invalidChange('Dialogue change identity is required.')
  validateSummaryChange(change)
  validateItemChange(change)
  if (change.kind === 'HISTORY_TEXT_APPENDED') validateDelta(change)
}

function validateSummaryChange(change: DialogueChange): void {
  const summary = change.summary
  if (summary === undefined || summary === null) return
  if (summary.id !== change.dialogueId) {
    throw new DialogueError(
      'identity-mismatch',
      'Dialogue change contains a summary for a different dialogue.',
      'refresh',
    )
  }
  validateSummary(summary)
}

function validateItemChange(change: DialogueChange): void {
  const item = change.item
  if (item === undefined || item === null) return
  validateItem(item)
  if (item.dialogueId !== change.dialogueId) {
    throw new DialogueError(
      'identity-mismatch',
      'Dialogue change contains an item for a different dialogue.',
      'refresh',
    )
  }
  if (change.itemId != null && change.itemId !== item.id) {
    throw new DialogueError(
      'identity-mismatch',
      'Dialogue change item identity does not match its payload.',
      'refresh',
    )
  }
  if (change.itemVersion != null && change.itemVersion !== item.version) {
    throw new DialogueError(
      'identity-mismatch',
      'Dialogue change item version does not match its payload.',
      'refresh',
    )
  }
}

function validateDelta(change: DialogueChange): void {
  if (
    typeof change.itemId !== 'string' ||
    change.itemId === '' ||
    typeof change.baseItemVersion !== 'string' ||
    typeof change.itemVersion !== 'string' ||
    typeof change.textDelta !== 'string'
  ) {
    invalidChange('Dialogue text delta is incomplete.')
  }
  sequenceValue(change.baseItemVersion)
  sequenceValue(change.itemVersion)
}

function resultOf(
  changed: boolean,
  dialogueId: string,
  itemId?: string,
): ProjectionResult {
  return { status: changed ? 'applied' : 'ignored', dialogueId, itemId }
}

function combinedResult(
  summaryApplied: boolean,
  itemResult: ProjectionResult | undefined,
  dialogueId: string,
): ProjectionResult {
  if (itemResult?.status === 'repair-required') return itemResult
  if (summaryApplied) return { status: 'applied', dialogueId }
  if (itemResult?.status === 'applied') return itemResult
  return itemResult ?? { status: 'ignored', dialogueId }
}

function repair(dialogueId: string, itemId: string): ProjectionResult {
  return { status: 'repair-required', dialogueId, itemId }
}

function invalidChange(message: string): never {
  throw new DialogueError('invalid-change', message, 'refresh')
}
