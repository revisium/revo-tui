import { makeAutoObservable, observable } from 'mobx'
import type { DialogueItemView } from '../contracts/public.types.js'
import type { DialogueItem } from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import { readonlyValue } from '../resources/readonly-value.js'
import { compareSequence, sequenceValue } from './sequence.js'

export class DialogueItemModel {
  private data: DialogueItemView

  public constructor(item: DialogueItem) {
    validateItem(item)
    this.data = itemViewOf(item)
    makeAutoObservable<this, 'data'>(
      this,
      { data: observable.ref },
      { autoBind: true },
    )
  }

  public get id(): string {
    return this.data.id
  }

  public get sequence(): string {
    return this.data.sequence
  }

  public get version(): string {
    return this.data.version
  }

  public get snapshot(): DialogueItemView {
    return this.data
  }

  public upsert(item: DialogueItem): boolean {
    validateItem(item)
    this.validateIdentity(item)
    const next = itemViewOf(item)
    if (compareSequence(item.version, this.data.version) <= 0) return false
    this.data = next
    return true
  }

  public append(text: string, baseVersion: string, version: string): boolean {
    sequenceValue(baseVersion)
    sequenceValue(version)
    if (compareSequence(version, this.data.version) <= 0) return false
    if (
      baseVersion !== this.data.version ||
      compareSequence(version, baseVersion) <= 0
    ) {
      return false
    }
    this.data = Object.freeze({
      ...this.data,
      text: this.data.text + text,
      version,
    })
    return true
  }

  public validateIdentity(item: DialogueItem): void {
    if (
      item.id !== this.data.id ||
      item.dialogueId !== this.data.dialogueId ||
      item.sequence !== this.data.sequence
    ) {
      throw new DialogueError(
        'identity-mismatch',
        'Dialogue item identity cannot change.',
        'refresh',
      )
    }
  }
}

export function validateItem(item: DialogueItem): void {
  requireText(item.id, 'Dialogue item id is required.')
  requireText(item.dialogueId, 'Dialogue item parent is required.')
  sequenceValue(item.sequence)
  sequenceValue(item.version)
  if (item.payload !== undefined) readonlyValue(item.payload)
}

function itemViewOf(item: DialogueItem): DialogueItemView {
  return Object.freeze({
    ...item,
    payload:
      item.payload === undefined ? undefined : readonlyValue(item.payload),
  })
}

function requireText(value: string, message: string): void {
  if (value === '') {
    throw new DialogueError('invalid-change', message, 'refresh')
  }
}
