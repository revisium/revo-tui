import { makeAutoObservable } from 'mobx'
import type { DialogueCommands } from '../commands/DialogueCommands.js'
import type { JsonValue } from '../contracts/dialogue.types.js'
import type { DialogueInputValues } from '../contracts/interaction.types.js'
import type { DialogueInteractionSessionView } from '../contracts/public.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { DialogueResource } from './DialogueResource.js'
import {
  detachedInput,
  interactionDefinition,
  validInput,
} from './interaction-definition.js'

export class DialogueInteractionSession implements DialogueInteractionSessionView {
  private errorMessage = ''
  private generation = 0
  private owned = false
  private fresh = false

  public constructor(
    public readonly dialogueId: string,
    public readonly id: string,
    private readonly resource: DialogueResource,
    private readonly commands: DialogueCommands,
  ) {
    makeAutoObservable<this, 'commands' | 'resource'>(
      this,
      { commands: false, resource: false },
      { autoBind: true },
    )
  }

  public get definition() {
    const interaction = this.interaction
    return interaction === undefined
      ? undefined
      : interactionDefinition(interaction.request)
  }

  public get active(): boolean {
    const status = this.interaction?.status
    return status === 'PENDING' || status === 'RESPONDING'
  }

  public get pending(): boolean {
    return this.delivery.pending
  }

  public get busy(): boolean {
    return this.delivery.inFlight
  }

  public get canRetry(): boolean {
    return this.owned && this.pending && !this.busy
  }

  public get canRespond(): boolean {
    return (
      this.owned &&
      this.fresh &&
      this.interaction?.status === 'PENDING' &&
      this.definition !== undefined &&
      !this.pending &&
      !this.busy
    )
  }

  public get error(): string {
    return this.errorMessage
  }

  public choose(optionId: string): Promise<void> {
    const definition = this.definition
    if (definition?.kind !== 'permission') return Promise.reject(unavailable())
    if (!definition.options.some(({ value }) => value === optionId)) {
      return Promise.reject(
        invalidResponse('Permission option is unavailable.'),
      )
    }
    return this.answer({ kind: 'permission', outcome: 'selected', optionId })
  }

  public submit(values: DialogueInputValues): Promise<void> {
    const definition = this.definition
    if (definition?.kind !== 'input') return Promise.reject(unavailable())
    if (!validInput(definition.questions, values)) {
      return Promise.reject(invalidResponse('Interaction input is invalid.'))
    }
    return this.answer({
      kind: 'input',
      outcome: 'submitted',
      values: detachedInput(values),
    })
  }

  public decline(): Promise<void> {
    const definition = this.definition
    if (definition === undefined) return Promise.reject(unavailable())
    return this.answer({
      kind: definition.kind,
      outcome: definition.kind === 'input' ? 'declined' : 'denied',
    })
  }

  public retry(): Promise<void> {
    const commandId = this.delivery.commandId
    if (!this.canRetry || commandId === undefined)
      return Promise.reject(unavailable())
    return this.observe(this.commands.retryResponse(commandId))
  }

  public activate(fresh: boolean): void {
    this.owned = true
    this.fresh = fresh
  }

  public deactivate(): void {
    this.generation += 1
    this.owned = false
    this.fresh = false
    this.errorMessage = ''
  }

  private answer(response: JsonValue): Promise<void> {
    if (!this.canRespond) return Promise.reject(unavailable())
    return this.observe(
      this.commands.respond(this.dialogueId, this.id, response),
    )
  }

  private async observe(work: Promise<unknown>): Promise<void> {
    const generation = this.generation
    try {
      await work
      if (generation === this.generation) this.errorMessage = ''
    } catch (error) {
      if (generation === this.generation) {
        this.errorMessage =
          error instanceof DialogueError
            ? error.message
            : 'Dialogue response delivery did not complete.'
      }
      throw error
    }
  }

  private get interaction() {
    return this.resource.interactions.find(({ id }) => id === this.id)
  }

  private get delivery() {
    return this.commands.responseState(this.dialogueId, this.id)
  }
}

function unavailable(): DialogueError {
  return new DialogueError(
    'command-unavailable',
    'This interaction cannot accept a response.',
    'stop',
  )
}

function invalidResponse(message: string): DialogueError {
  return new DialogueError('protocol', message, 'stop')
}
