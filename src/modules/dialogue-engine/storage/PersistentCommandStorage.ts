import type { PendingDialogueCommand } from '../contracts/command-storage.types.js'
import type { JsonValue } from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'

const STORAGE_VERSION = 1

export class PersistentCommandStorage {
  private constructor(
    private readonly storedCommands: readonly PendingDialogueCommand[],
  ) {}

  public static empty(): PersistentCommandStorage {
    return new PersistentCommandStorage([])
  }

  public static parse(value: unknown): PersistentCommandStorage {
    if (
      !isRecord(value) ||
      value.version !== STORAGE_VERSION ||
      !Array.isArray(value.commands)
    ) {
      throw corruptError()
    }
    const commands = value.commands.map(commandOf)
    if (
      new Set(commands.map(({ commandId }) => commandId)).size !==
      commands.length
    ) {
      throw corruptError()
    }
    return new PersistentCommandStorage(commands)
  }

  public get commands(): readonly PendingDialogueCommand[] {
    return Object.freeze(this.storedCommands.map(commandOf))
  }

  public save(value: unknown): PersistentCommandStorage {
    const command = commandOf(value)
    const current = this.storedCommands.find(
      ({ commandId }) => commandId === command.commandId,
    )
    if (current !== undefined) {
      if (!sameCommand(current, command)) {
        throw corruptError('A pending command cannot change after it is saved.')
      }
      return this
    }
    return new PersistentCommandStorage([...this.storedCommands, command])
  }

  public remove(value: unknown): PersistentCommandStorage {
    const command = commandOf(value)
    return new PersistentCommandStorage(
      this.storedCommands.filter(
        (candidate) => !sameCommand(candidate, command),
      ),
    )
  }

  public serialize(): string {
    return JSON.stringify({
      version: STORAGE_VERSION,
      commands: this.storedCommands,
    })
  }
}

function commandOf(value: unknown): PendingDialogueCommand {
  if (!isRecord(value) || !text(value.commandId) || !text(value.dialogueId))
    throw corruptError()
  if (value.kind === 'message' && typeof value.prompt === 'string') {
    return Object.freeze({
      kind: value.kind,
      commandId: value.commandId,
      dialogueId: value.dialogueId,
      prompt: value.prompt,
    })
  }
  if (
    value.kind === 'response' &&
    text(value.interactionId) &&
    'response' in value
  ) {
    return Object.freeze({
      kind: value.kind,
      commandId: value.commandId,
      dialogueId: value.dialogueId,
      interactionId: value.interactionId,
      response: copyJson(value.response),
    })
  }
  throw corruptError()
}

function copyJson(value: unknown, parents = new Set<object>()): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value
    throw corruptError()
  }
  if (typeof value !== 'object' || parents.has(value)) throw corruptError()
  parents.add(value)
  try {
    if (Array.isArray(value))
      return Object.freeze(value.map((item) => copyJson(item, parents)))
    if (Object.getPrototypeOf(value) !== Object.prototype) throw corruptError()
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          copyJson(item, parents),
        ]),
      ),
    )
  } finally {
    parents.delete(value)
  }
}

function sameCommand(
  left: PendingDialogueCommand,
  right: PendingDialogueCommand,
): boolean {
  if (
    left.kind !== right.kind ||
    left.commandId !== right.commandId ||
    left.dialogueId !== right.dialogueId
  ) {
    return false
  }
  if (left.kind === 'message')
    return right.kind === 'message' && left.prompt === right.prompt
  return (
    right.kind === 'response' &&
    left.interactionId === right.interactionId &&
    jsonEquals(left.response, right.response)
  )
}

function jsonEquals(left: JsonValue, right: JsonValue): boolean {
  if (left === right) return true
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => jsonEquals(item, right[index] as JsonValue))
    )
  }
  if (!isRecord(left) || !isRecord(right)) return false
  const keys = Object.keys(left)
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) =>
        key in right &&
        jsonEquals(left[key] as JsonValue, right[key] as JsonValue),
    )
  )
}

function corruptError(message = 'Pending dialogue command data is malformed.') {
  return new DialogueError('storage-corrupt', message, 'stop')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}
