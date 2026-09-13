import { makeAutoObservable } from 'mobx'
import type {
  DialogueActions,
  DialogueCommands,
} from '../../../modules/dialogue-engine/index.js'
import type { AgentConfigurationsService } from '../../../modules/agent-configurations/index.js'
import { AgentSelectionModel } from '../../../entities/agent/index.js'
import { DialogueError } from '../../../modules/dialogue-engine/index.js'

const TITLE_LIMIT = 80

export class ComposeViewModel {
  public title = ''
  public prompt = ''
  public focus: 'prompt' | 'controls' = 'prompt'
  public busy = false
  public error = ''
  public createdId: string | undefined
  public uncertain = false
  public pendingCommandId: string | undefined
  public readonly selection: AgentSelectionModel
  private requestController: AbortController | undefined
  private generation = 0
  public constructor(
    service: AgentConfigurationsService,
    private readonly actions: DialogueActions,
    private readonly commands: DialogueCommands,
    private readonly onCreated: (id: string) => void,
  ) {
    this.selection = new AgentSelectionModel(service)
    makeAutoObservable(this, {}, { autoBind: true })
  }
  public mount(): void {
    this.requestController = new AbortController()
    this.selection.start()
  }
  public dispose(): void {
    this.generation += 1
    this.requestController?.abort()
    this.requestController = undefined
    this.selection.dispose()
  }
  public setTitle(value: string): void {
    this.title = value
  }
  public setPrompt(value: string): void {
    this.prompt = value
  }
  public handleControlKey(name: string): void {
    if (name === 'up') this.selection.selectNext(-1)
    if (name === 'down') this.selection.selectNext(1)
    if (name === 'left') this.selection.selectNextOption(-1)
    if (name === 'right') this.selection.selectNextOption(1)
    if (name === 'space') this.selection.cycleSelectedOption()
  }
  public reset(): void {
    this.title = ''
    this.prompt = ''
    this.error = ''
    this.createdId = undefined
    this.pendingCommandId = undefined
    this.uncertain = false
  }
  public async retrySend(): Promise<void> {
    if (
      this.busy ||
      this.pendingCommandId === undefined ||
      this.createdId === undefined
    )
      return
    this.busy = true
    try {
      await this.commands.retrySend(
        this.pendingCommandId,
        this.requestController?.signal,
      )
      this.onCreated(this.createdId)
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Unable to send prompt.'
    } finally {
      this.busy = false
    }
  }
  public async submit(): Promise<void> {
    if (
      this.busy ||
      this.prompt.trim() === '' ||
      this.createdId !== undefined ||
      this.uncertain
    )
      return
    this.error = ''
    this.busy = true
    const generation = this.generation
    const signal = this.requestController?.signal
    try {
      const agent = this.selection.selectedAgent
      if (!agent) throw new Error('Choose an agent configuration first.')
      const configuration = this.selection.configuration
      const resource = await this.actions.create(
        {
          title: this.title.trim() || this.prompt.trim().slice(0, TITLE_LIMIT),
          agentId: agent.id,
          agentVersion: agent.version,
          agentInstallationId: agent.installationId,
          agentConfiguration: configuration.selections,
        },
        signal,
      )
      if (generation !== this.generation || signal?.aborted) return
      this.createdId = resource.id
      try {
        await this.commands.send(resource.id, this.prompt, signal)
      } catch (error) {
        const pending = this.commands.pending.find(
          (command) =>
            command.kind === 'message' && command.dialogueId === resource.id,
        )
        if (pending?.kind === 'message')
          this.pendingCommandId = pending.commandId
        if (
          error instanceof DialogueError &&
          error.code === 'server' &&
          error.recovery === 'stop'
        )
          this.uncertain = true
        throw error
      }
      this.onCreated(resource.id)
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Unable to create dialogue.'
    } finally {
      this.busy = false
    }
  }
}
