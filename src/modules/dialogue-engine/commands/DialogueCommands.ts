import { makeAutoObservable, observable, runInAction } from 'mobx'
import type { DialogueBackend } from '../contracts/backend.types.js'
import type {
  DialogueCommandStorage,
  PendingDialogueCommand,
  PendingDialogueMessage,
  PendingDialogueResponse,
} from '../contracts/command-storage.types.js'
import type {
  DialogueInteraction,
  DialogueTurn,
  JsonValue,
} from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import { PersistentCommandStorage } from '../storage/PersistentCommandStorage.js'

interface MessageDelivery {
  readonly command: PendingDialogueMessage
  readonly controller: AbortController
  readonly promise: Promise<DialogueTurn>
}

interface ResponseDelivery {
  readonly command: PendingDialogueResponse
  readonly controller: AbortController
  readonly promise: Promise<DialogueInteraction>
}

type LifecycleState = 'closed' | 'starting' | 'ready' | 'disposing'

export class DialogueCommands {
  private pendingCommands: readonly PendingDialogueCommand[] = []
  private readonly messageDeliveries = new Map<string, MessageDelivery>()
  private readonly responseDeliveries = new Map<string, ResponseDelivery>()
  private errorMessage = ''
  private generation = 0
  private lifecycle: LifecycleState = 'closed'
  private starting: Promise<void> | undefined
  private disposal: Promise<void> | undefined

  public constructor(
    private readonly backend: DialogueBackend,
    private readonly ownedStorage: DialogueCommandStorage,
  ) {
    makeAutoObservable<
      this,
      | 'disposal'
      | 'messageDeliveries'
      | 'pendingCommands'
      | 'responseDeliveries'
    >(
      this,
      {
        disposal: false,
        messageDeliveries: observable.shallow,
        pendingCommands: observable.ref,
        responseDeliveries: observable.shallow,
      },
      { autoBind: true },
    )
  }

  public get pending(): readonly PendingDialogueCommand[] {
    return detachedCommands(this.pendingCommands)
  }

  public get busy(): boolean {
    return this.messageDeliveries.size > 0 || this.responseDeliveries.size > 0
  }

  public get error(): string {
    return this.errorMessage
  }

  public responseState(
    dialogueId: string,
    interactionId: string,
  ): {
    readonly commandId?: string
    readonly pending: boolean
    readonly inFlight: boolean
  } {
    const command = this.pendingForResponse(dialogueId, interactionId)
    return Object.freeze({
      ...(command === undefined ? {} : { commandId: command.commandId }),
      pending: command !== undefined,
      inFlight: this.responseDeliveries.has(
        responseKey(dialogueId, interactionId),
      ),
    })
  }

  public async start(): Promise<void> {
    if (this.lifecycle === 'ready') return
    if (this.lifecycle === 'disposing') throw unavailableError()
    if (this.starting !== undefined) return this.starting
    if (this.lifecycle !== 'closed') throw unavailableError()

    const generation = this.generation + 1
    this.generation = generation
    this.lifecycle = 'starting'
    const starting = this.open(generation)
    this.starting = starting
    starting.catch(() => undefined)
    try {
      await starting
    } finally {
      if (this.starting === starting) this.starting = undefined
    }
  }

  public dispose(): Promise<void> {
    if (this.disposal !== undefined) return this.disposal
    if (this.lifecycle === 'closed') return Promise.resolve()
    this.generation += 1
    this.lifecycle = 'disposing'
    const deliveries = this.abortDeliveries()
    this.pendingCommands = []
    this.errorMessage = ''
    const disposal = this.close(this.starting, deliveries)
    this.disposal = disposal
    disposal.catch(() => undefined)
    return disposal
  }

  private async close(
    starting: Promise<void> | undefined,
    deliveries: readonly Promise<unknown>[],
  ): Promise<void> {
    try {
      await starting?.catch(() => undefined)
      await Promise.allSettled(deliveries)
      await this.ownedStorage.close()
    } finally {
      this.lifecycle = 'closed'
      this.starting = undefined
      this.disposal = undefined
    }
  }

  public send(
    dialogueId: string,
    prompt: string,
    signal?: AbortSignal,
  ): Promise<DialogueTurn> {
    this.assertReady()
    const current = this.messageDeliveries.get(dialogueId)
    if (current !== undefined) {
      if (current.command.prompt === prompt) return current.promise
      throw conflictError()
    }
    if (this.pendingForMessage(dialogueId) !== undefined) throw conflictError()

    const command = validatedCommand({
      kind: 'message',
      commandId: globalThis.crypto.randomUUID(),
      dialogueId,
      prompt,
    }) as PendingDialogueMessage
    return this.beginMessage(command, false, signal)
  }

  public retrySend(
    commandId: string,
    signal?: AbortSignal,
  ): Promise<DialogueTurn> {
    this.assertReady()
    const command = this.pendingCommands.find(
      (candidate): candidate is PendingDialogueMessage =>
        candidate.kind === 'message' && candidate.commandId === commandId,
    )
    if (command === undefined) throw unavailableError()
    const current = this.messageDeliveries.get(command.dialogueId)
    if (current !== undefined) {
      if (current.command.commandId === command.commandId)
        return current.promise
      throw conflictError()
    }
    return this.beginMessage(command, true, signal)
  }

  public respond(
    dialogueId: string,
    interactionId: string,
    response: JsonValue,
    signal?: AbortSignal,
  ): Promise<DialogueInteraction> {
    this.assertReady()
    const key = responseKey(dialogueId, interactionId)
    const command = validatedCommand({
      kind: 'response',
      commandId: globalThis.crypto.randomUUID(),
      dialogueId,
      interactionId,
      response,
    }) as PendingDialogueResponse
    const current = this.responseDeliveries.get(key)
    if (current !== undefined) {
      if (sameCommand(current.command, command, false)) return current.promise
      throw conflictError()
    }
    if (this.pendingForResponse(dialogueId, interactionId) !== undefined) {
      throw conflictError()
    }
    return this.beginResponse(command, false, signal)
  }

  public retryResponse(
    commandId: string,
    signal?: AbortSignal,
  ): Promise<DialogueInteraction> {
    this.assertReady()
    const command = this.pendingCommands.find(
      (candidate): candidate is PendingDialogueResponse =>
        candidate.kind === 'response' && candidate.commandId === commandId,
    )
    if (command === undefined) throw unavailableError()
    const key = responseKey(command.dialogueId, command.interactionId)
    const current = this.responseDeliveries.get(key)
    if (current !== undefined) {
      if (current.command.commandId === command.commandId)
        return current.promise
      throw conflictError()
    }
    return this.beginResponse(command, true, signal)
  }

  private async open(generation: number): Promise<void> {
    try {
      await this.ownedStorage.open()
      const commands = await this.ownedStorage.load()
      if (generation !== this.generation) throw unavailableError()
      runInAction(() => {
        this.pendingCommands = detachedCommands(commands)
        this.errorMessage = ''
        this.lifecycle = 'ready'
      })
    } catch (error) {
      if (generation === this.generation) {
        await this.ownedStorage.close().catch(() => undefined)
        this.lifecycle = 'closed'
      }
      throw error
    }
  }

  private beginMessage(
    command: PendingDialogueMessage,
    persisted: boolean,
    signal: AbortSignal | undefined,
  ): Promise<DialogueTurn> {
    const generation = this.generation
    const controller = new AbortController()
    const outcome = this.deliver(
      command,
      persisted,
      controller,
      signal,
      () =>
        this.backend.send(command, combinedSignal(controller.signal, signal)),
      (turn) => confirmMessage(command, turn),
    )
    const promise = outcome.finally(() =>
      this.finishMessage(command.dialogueId, generation, promise),
    )
    const delivery = { command, controller, promise }
    this.messageDeliveries.set(command.dialogueId, delivery)
    promise.catch(() => undefined)
    return promise
  }

  private beginResponse(
    command: PendingDialogueResponse,
    persisted: boolean,
    signal: AbortSignal | undefined,
  ): Promise<DialogueInteraction> {
    const generation = this.generation
    const controller = new AbortController()
    const outcome = this.deliver(
      command,
      persisted,
      controller,
      signal,
      () =>
        this.backend.respond(
          command,
          combinedSignal(controller.signal, signal),
        ),
      (interaction) => confirmResponse(command, interaction),
    )
    const key = responseKey(command.dialogueId, command.interactionId)
    const promise = outcome.finally(() =>
      this.finishResponse(key, generation, promise),
    )
    const delivery = { command, controller, promise }
    this.responseDeliveries.set(key, delivery)
    promise.catch(() => undefined)
    return promise
  }

  private async deliver<T>(
    command: PendingDialogueCommand,
    persisted: boolean,
    controller: AbortController,
    signal: AbortSignal | undefined,
    invoke: () => Promise<T>,
    confirm: (result: T) => void,
  ): Promise<T> {
    const generation = this.generation
    try {
      if (!persisted) {
        signal?.throwIfAborted()
        await this.ownedStorage.save(command)
        if (generation === this.generation) {
          runInAction(() => {
            this.pendingCommands = [...this.pendingCommands, command]
          })
        }
      }
      if (!this.isCurrent(generation, controller, signal)) {
        throw signal?.reason ?? unavailableError()
      }
      const result = await invoke()
      if (!this.isCurrent(generation, controller, signal)) {
        throw signal?.reason ?? unavailableError()
      }
      confirm(result)
      await this.ownedStorage.remove(command)
      if (!this.isCurrent(generation, controller, signal)) {
        throw signal?.reason ?? unavailableError()
      }
      runInAction(() => {
        this.pendingCommands = this.pendingCommands.filter(
          ({ commandId }) => commandId !== command.commandId,
        )
        this.errorMessage = ''
      })
      return result
    } catch (error) {
      if (generation === this.generation) {
        runInAction(() => {
          this.errorMessage = safeMessage(error)
        })
      }
      throw error
    }
  }

  private finishMessage(
    dialogueId: string,
    generation: number,
    promise: Promise<DialogueTurn>,
  ): void {
    const current = this.messageDeliveries.get(dialogueId)
    if (generation === this.generation && current?.promise === promise) {
      this.messageDeliveries.delete(dialogueId)
    }
  }

  private finishResponse(
    key: string,
    generation: number,
    promise: Promise<DialogueInteraction>,
  ): void {
    const current = this.responseDeliveries.get(key)
    if (generation === this.generation && current?.promise === promise) {
      this.responseDeliveries.delete(key)
    }
  }

  private pendingForMessage(
    dialogueId: string,
  ): PendingDialogueMessage | undefined {
    return this.pendingCommands.find(
      (command): command is PendingDialogueMessage =>
        command.kind === 'message' && command.dialogueId === dialogueId,
    )
  }

  private pendingForResponse(
    dialogueId: string,
    interactionId: string,
  ): PendingDialogueResponse | undefined {
    return this.pendingCommands.find(
      (command): command is PendingDialogueResponse =>
        command.kind === 'response' &&
        command.dialogueId === dialogueId &&
        command.interactionId === interactionId,
    )
  }

  private abortDeliveries(): readonly Promise<unknown>[] {
    const promises = [
      ...[...this.messageDeliveries.values()].map(({ promise }) => promise),
      ...[...this.responseDeliveries.values()].map(({ promise }) => promise),
    ]
    for (const delivery of this.messageDeliveries.values())
      delivery.controller.abort()
    for (const delivery of this.responseDeliveries.values())
      delivery.controller.abort()
    this.messageDeliveries.clear()
    this.responseDeliveries.clear()
    return promises
  }

  private isCurrent(
    generation: number,
    controller: AbortController,
    signal: AbortSignal | undefined,
  ): boolean {
    return (
      generation === this.generation &&
      !controller.signal.aborted &&
      signal?.aborted !== true
    )
  }

  private assertReady(): void {
    if (this.lifecycle !== 'ready') throw unavailableError()
  }
}

function validatedCommand(
  command: PendingDialogueCommand,
): PendingDialogueCommand {
  const [copy] = PersistentCommandStorage.empty().save(command).commands
  if (copy === undefined) throw unavailableError()
  return copy
}

function detachedCommands(commands: readonly PendingDialogueCommand[]) {
  let storage = PersistentCommandStorage.empty()
  for (const command of commands) storage = storage.save(command)
  return storage.commands
}

function sameCommand(
  left: PendingDialogueCommand,
  right: PendingDialogueCommand,
  includeId = true,
): boolean {
  const storage = PersistentCommandStorage.empty().save(left)
  const candidate = includeId ? right : { ...right, commandId: left.commandId }
  try {
    return storage.save(candidate) === storage
  } catch {
    return false
  }
}

function combinedSignal(owned: AbortSignal, signal: AbortSignal | undefined) {
  return signal === undefined ? owned : AbortSignal.any([owned, signal])
}

function responseKey(dialogueId: string, interactionId: string): string {
  return JSON.stringify([dialogueId, interactionId])
}

function confirmMessage(
  command: PendingDialogueMessage,
  turn: DialogueTurn,
): void {
  if (
    turn.commandId !== command.commandId ||
    turn.dialogueId !== command.dialogueId
  ) {
    throw acknowledgementError()
  }
}

function confirmResponse(
  command: PendingDialogueResponse,
  interaction: DialogueInteraction,
): void {
  if (
    interaction.id !== command.interactionId ||
    interaction.dialogueId !== command.dialogueId ||
    interaction.responseCommandId !== command.commandId
  ) {
    throw acknowledgementError()
  }
}

function acknowledgementError(): DialogueError {
  return new DialogueError(
    'protocol',
    'Dialogue service returned a mismatched command acknowledgement.',
    'refresh',
  )
}

function conflictError(): DialogueError {
  return new DialogueError(
    'command-conflict',
    'A pending dialogue command requires an explicit retry.',
    'retry',
  )
}

function unavailableError(): DialogueError {
  return new DialogueError(
    'command-unavailable',
    'Dialogue commands are not available in the current lifecycle state.',
    'stop',
  )
}

function safeMessage(error: unknown): string {
  return error instanceof DialogueError
    ? error.message
    : 'Dialogue command delivery did not complete.'
}
