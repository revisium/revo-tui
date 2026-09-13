import type { DialogueBackend } from '../contracts/backend.types.js'
import type { CreateDialogueInput } from '../contracts/command.types.js'
import type { DialogueTurn } from '../contracts/dialogue.types.js'
import type { DialogueResourceView } from '../contracts/public.types.js'
import type { DialogueEngine } from '../engine/DialogueEngine.js'
import { DialogueError } from '../errors/DialogueError.js'

interface ActiveAction {
  readonly controller: AbortController
  readonly promise: Promise<unknown>
}

export class DialogueActions {
  private readonly active = new Set<ActiveAction>()
  private disposal: Promise<void> | undefined
  private disposed = false

  public constructor(
    private readonly backend: DialogueBackend,
    private readonly engine: DialogueEngine,
  ) {}

  public create(
    input: CreateDialogueInput,
    signal?: AbortSignal,
  ): Promise<DialogueResourceView> {
    return this.perform(
      (ownedSignal) => this.backend.create(input, ownedSignal),
      (summary) => this.engine.confirm(summary),
      signal,
      true,
    )
  }

  public cancel(
    dialogueId: string,
    turnId: string,
    signal?: AbortSignal,
  ): Promise<DialogueTurn> {
    return this.perform(
      (ownedSignal) => this.backend.cancel(dialogueId, turnId, ownedSignal),
      (turn) => {
        if (turn.dialogueId !== dialogueId || turn.id !== turnId) {
          throw new DialogueError(
            'identity-mismatch',
            'Dialogue service returned a mismatched cancellation acknowledgement.',
            'refresh',
          )
        }
        return turn
      },
      signal,
    )
  }

  public dispose(): Promise<void> {
    if (this.disposal !== undefined) return this.disposal
    this.disposed = true
    for (const action of this.active) action.controller.abort()
    const disposal = Promise.allSettled(
      [...this.active].map(({ promise }) => promise),
    ).then(() => undefined)
    this.disposal = disposal
    disposal.catch(() => undefined)
    return disposal
  }

  private perform<T, R>(
    invoke: (signal: AbortSignal) => Promise<T>,
    confirm: (value: T) => R,
    externalSignal?: AbortSignal,
    uncertainOnFailure = false,
  ): Promise<R> {
    if (this.disposed) return Promise.reject(unavailable())
    if (externalSignal?.aborted === true) {
      return Promise.reject(cancelled())
    }
    const controller = new AbortController()
    const signal =
      externalSignal === undefined
        ? controller.signal
        : AbortSignal.any([controller.signal, externalSignal])
    let invoked = false
    const outcome = Promise.resolve()
      .then(() => {
        this.assertLive(signal)
        invoked = true
        return invoke(signal)
      })
      .then((value) => {
        this.assertLive(signal)
        return confirm(value)
      })
      .catch((error: unknown) => {
        if (uncertainOnFailure && invoked) throw uncertainCreation()
        if (signal.aborted || this.disposed) throw cancelled()
        if (error instanceof DialogueError) throw error
        throw new DialogueError(
          'server',
          'Dialogue action delivery did not complete.',
          'retry',
        )
      })
    const promise = outcome.finally(() => this.remove(controller))
    const active = { controller, promise }
    this.active.add(active)
    promise.catch(() => undefined)
    return promise
  }

  private remove(controller: AbortController): void {
    for (const action of this.active) {
      if (action.controller === controller) this.active.delete(action)
    }
  }

  private assertLive(signal: AbortSignal): void {
    if (this.disposed || signal.aborted) throw cancelled()
  }
}

function unavailable(): DialogueError {
  return new DialogueError(
    'command-unavailable',
    'Dialogue actions are unavailable after shutdown.',
    'stop',
  )
}

function cancelled(): DialogueError {
  return new DialogueError(
    'command-unavailable',
    'Dialogue action was cancelled.',
    'stop',
  )
}

function uncertainCreation(): DialogueError {
  return new DialogueError(
    'server',
    'Dialogue creation may have completed; refresh before trying another action.',
    'stop',
  )
}
