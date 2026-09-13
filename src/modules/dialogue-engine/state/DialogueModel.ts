import { makeAutoObservable, observable } from 'mobx'
import type {
  DialogueItem,
  DialogueSummary,
} from '../contracts/dialogue.types.js'
import type {
  DialogueSummaryView,
  DialogueView,
} from '../contracts/public.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import { readonlyValue } from '../resources/readonly-value.js'
import { compareSequence, sequenceValue } from './sequence.js'
import { DialogueItemModel } from './DialogueItemModel.js'

export class DialogueModel {
  private summary: DialogueSummaryView
  private readonly items = observable.map<string, DialogueItemModel>()

  public constructor(summary: DialogueSummary) {
    validateSummary(summary)
    this.summary = summaryViewOf(summary)
    makeAutoObservable<this, 'summary' | 'items'>(this, {
      summary: observable.ref,
      items: false,
    })
  }

  public get id(): string {
    return this.summary.id
  }

  public get view(): DialogueView {
    return Object.freeze({
      summary: this.summary,
      items: Object.freeze(
        [...this.items.values()]
          .sort((left, right) => compareSequence(left.sequence, right.sequence))
          .map((item) => item.snapshot),
      ),
    })
  }

  public item(id: string): DialogueItemModel | undefined {
    return this.items.get(id)
  }

  public applySummary(summary: DialogueSummary): boolean {
    validateSummary(summary)
    if (summary.id !== this.id)
      throw identityMismatch('Dialogue identity cannot change.')
    const next = summaryViewOf(summary)
    if (compareSequence(summary.version, this.summary.version) <= 0)
      return false
    this.summary = next
    return true
  }

  public applyItem(item: DialogueItem): boolean {
    this.validateItemIdentity(item)
    const current = this.items.get(item.id)
    if (current !== undefined) return current.upsert(item)
    this.items.set(item.id, new DialogueItemModel(item))
    return true
  }

  public validateItemIdentity(item: DialogueItem): void {
    validateItemParent(item, this.id)
    const current = this.items.get(item.id)
    if (current !== undefined) {
      current.validateIdentity(item)
      return
    }
    const sequenceOwner = [...this.items.values()].find(
      (candidate) => candidate.sequence === item.sequence,
    )
    if (sequenceOwner !== undefined) {
      throw identityMismatch(
        'Dialogue item sequence belongs to a different item.',
      )
    }
  }
}

export function validateSummary(summary: DialogueSummary): void {
  if (summary.id === '')
    throw identityMismatch('Dialogue identity is required.')
  sequenceValue(summary.version)
  sequenceValue(summary.significantSequence)
  sequenceValue(summary.readSignificantSequence)
  readonlyValue(summary.agentConfiguration)
}

function validateItemParent(item: DialogueItem, dialogueId: string): void {
  if (item.dialogueId !== dialogueId) {
    throw identityMismatch('Dialogue item belongs to a different dialogue.')
  }
}

function summaryViewOf(summary: DialogueSummary): DialogueSummaryView {
  return Object.freeze({
    ...summary,
    agentConfiguration: readonlyValue(summary.agentConfiguration),
  })
}

function identityMismatch(message: string): DialogueError {
  return new DialogueError('identity-mismatch', message, 'refresh')
}
