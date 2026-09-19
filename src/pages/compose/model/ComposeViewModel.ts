import { makeAutoObservable, runInAction } from 'mobx'
import { AgentSelectionModel } from '../../../entities/agent/index.js'
import type {
  AgentConfigurationsService,
  AgentLaunchConfiguration,
} from '../../../modules/agent-configurations/index.js'
import {
  DialogueError,
  type DialogueActions,
  type DialogueCommands,
} from '../../../modules/dialogue-engine/index.js'
import {
  ObservableRequest,
  RequestAbortError,
  errorMessageOf,
} from '../../../modules/observable-request/index.js'

const TITLE_LIMIT = 80

interface NewDialogueAttempt {
  readonly kind: 'create'
  readonly title: string
  readonly prompt: string
  readonly agentId: string
  readonly agentVersion: string
  readonly agentInstallationId: string
  readonly configuration: AgentLaunchConfiguration
}

interface RetrySendAttempt {
  readonly kind: 'send'
  readonly dialogueId: string
  readonly prompt: string
  readonly commandId?: string
}

type ComposeAttempt = NewDialogueAttempt | RetrySendAttempt

export class ComposeViewModel {
  public title = ''
  public prompt = ''
  public focus: 'prompt' | 'controls' = 'prompt'
  public createdId: string | undefined
  public pendingCommandId: string | undefined
  public readonly selection: AgentSelectionModel
  private readonly request: ObservableRequest<string, [ComposeAttempt, number]>
  private uncertainCreate = false
  private validationError = ''
  private showRequestError = false
  private generation = 0
  private active = false

  public constructor(
    service: AgentConfigurationsService,
    private readonly actions: DialogueActions,
    private readonly commands: DialogueCommands,
    private readonly onCreated: (id: string) => void,
  ) {
    this.selection = new AgentSelectionModel(service)
    this.request = ObservableRequest.of(
      ({ signal }, attempt, generation) =>
        this.perform(signal, attempt, generation),
      { skipResetting: true },
    )
    makeAutoObservable<this, 'actions' | 'commands' | 'onCreated' | 'request'>(
      this,
      {
        actions: false,
        commands: false,
        onCreated: false,
        request: false,
      },
      { autoBind: true },
    )
  }

  public get busy(): boolean {
    return this.request.isLoading
  }

  public get error(): string {
    if (this.validationError !== '') return this.validationError
    if (!this.showRequestError) return ''
    const error = this.request.error
    if (error == null) return ''
    return error instanceof DialogueError
      ? error.message
      : errorMessageOf(error)
  }

  public get uncertain(): boolean {
    return this.uncertainCreate || this.createdId !== undefined
  }

  public get statusMessage(): string {
    if (this.busy) return ''
    if (this.uncertainCreate)
      return 'Creation outcome is uncertain. Return to the list and refresh before starting another.'
    if (this.pendingCommandId !== undefined)
      return 'Prompt delivery is uncertain. Press y to retry the saved command.'
    if (this.createdId !== undefined)
      return 'Dialogue was created, but the prompt was not saved. Press y to send it.'
    return ''
  }

  public get canRetrySend(): boolean {
    return !this.busy && this.createdId !== undefined
  }

  public get canLeave(): boolean {
    return !this.busy && (this.createdId === undefined || this.uncertainCreate)
  }

  public mount(): void {
    if (this.active) return
    this.active = true
    this.generation += 1
    this.selection.start()
  }

  public dispose(): void {
    if (!this.active) return
    this.active = false
    this.generation += 1
    this.request.abort()
    this.selection.dispose()
  }

  public setTitle(value: string): void {
    if (!this.busy && this.createdId === undefined) this.title = value
  }

  public setPrompt(value: string): void {
    if (!this.busy && this.createdId === undefined) this.prompt = value
  }

  public handleControlKey(name: string): void {
    if (this.busy || this.createdId !== undefined) return
    if (name === 'up') this.selection.selectNext(-1)
    if (name === 'down') this.selection.selectNext(1)
    if (name === 'left') this.selection.selectNextOption(-1)
    if (name === 'right') this.selection.selectNextOption(1)
    if (name === 'space') this.selection.cycleSelectedOption()
  }

  public reset(): void {
    if (this.busy || this.createdId !== undefined) return
    this.title = ''
    this.prompt = ''
    this.focus = 'prompt'
    this.pendingCommandId = undefined
    this.uncertainCreate = false
    this.validationError = ''
    this.showRequestError = false
  }

  public async retrySend(): Promise<void> {
    if (!this.active || this.busy || this.createdId === undefined) return
    const attempt: RetrySendAttempt = Object.freeze({
      kind: 'send',
      dialogueId: this.createdId,
      prompt: this.prompt,
      ...(this.pendingCommandId === undefined
        ? {}
        : { commandId: this.pendingCommandId }),
    })
    await this.execute(attempt)
  }

  public async submit(): Promise<void> {
    if (
      this.busy ||
      !this.active ||
      this.prompt.trim() === '' ||
      this.createdId !== undefined ||
      this.uncertainCreate
    )
      return
    let attempt: NewDialogueAttempt
    try {
      const agent = this.selection.selectedAgent
      if (agent === undefined)
        throw new Error('Choose an agent configuration first.')
      const configuration = this.selection.configuration
      const prompt = this.prompt
      attempt = Object.freeze({
        kind: 'create',
        title: this.title.trim() || prompt.trim().slice(0, TITLE_LIMIT),
        prompt,
        agentId: agent.id,
        agentVersion: agent.version,
        agentInstallationId: agent.installationId,
        configuration: Object.freeze({
          catalogRevision: configuration.catalogRevision,
          selections: Object.freeze({ ...configuration.selections }),
        }),
      })
    } catch (error) {
      this.validationError = errorMessageOf(error)
      return
    }
    await this.execute(attempt)
  }

  private async execute(attempt: ComposeAttempt): Promise<void> {
    const generation = this.generation
    this.validationError = ''
    this.showRequestError = false
    const result = await this.request.fetch(attempt, generation)
    if (!this.isCurrent(generation)) return
    if (!result.isRight) {
      this.showRequestError = true
      throw result.error
    }
    this.onCreated(result.data)
  }

  private async perform(
    signal: AbortSignal,
    attempt: ComposeAttempt,
    generation: number,
  ): Promise<string> {
    const dialogueId =
      attempt.kind === 'create'
        ? await this.createDialogue(attempt, signal, generation)
        : attempt.dialogueId
    this.assertCurrent(generation, signal)
    await this.sendPrompt(dialogueId, attempt, signal, generation)
    this.assertCurrent(generation, signal)
    return dialogueId
  }

  private async createDialogue(
    attempt: NewDialogueAttempt,
    signal: AbortSignal,
    generation: number,
  ): Promise<string> {
    try {
      const resource = await this.actions.create(
        {
          title: attempt.title,
          agentId: attempt.agentId,
          agentVersion: attempt.agentVersion,
          agentInstallationId: attempt.agentInstallationId,
          agentConfiguration: {
            catalogRevision: attempt.configuration.catalogRevision,
            selections: attempt.configuration.selections,
          },
        },
        signal,
      )
      this.assertCurrent(generation, signal)
      runInAction(() => {
        this.createdId = resource.id
      })
      return resource.id
    } catch (error) {
      if (
        this.isCurrent(generation) &&
        error instanceof DialogueError &&
        error.code === 'server' &&
        error.recovery === 'stop'
      ) {
        runInAction(() => {
          this.uncertainCreate = true
        })
      }
      throw error
    }
  }

  private async sendPrompt(
    dialogueId: string,
    attempt: ComposeAttempt,
    signal: AbortSignal,
    generation: number,
  ): Promise<void> {
    try {
      if (attempt.kind === 'send' && attempt.commandId !== undefined) {
        await this.commands.retrySend(attempt.commandId, signal)
      } else {
        await this.commands.send(dialogueId, attempt.prompt, signal)
      }
      this.assertCurrent(generation, signal)
    } catch (error) {
      if (!this.isCurrent(generation)) throw error
      const pending = this.commands.pending.find(
        (command) =>
          command.kind === 'message' &&
          command.dialogueId === dialogueId &&
          command.prompt === attempt.prompt,
      )
      runInAction(() => {
        this.pendingCommandId = pending?.commandId
      })
      throw error
    }
  }

  private isCurrent(generation: number): boolean {
    return this.active && generation === this.generation
  }

  private assertCurrent(generation: number, signal: AbortSignal): void {
    if (!this.isCurrent(generation) || signal.aborted)
      throw new RequestAbortError()
  }
}
