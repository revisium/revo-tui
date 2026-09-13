import { makeAutoObservable } from 'mobx'
import type { DialogueActions, DialogueCommands } from '../../../modules/dialogue-engine/index.js'
import type { AgentConfigurationsService } from '../../../modules/agent-configurations/index.js'
import { AgentSelectionModel } from '../../../entities/agent/index.js'

export class ComposeViewModel {
  public title = ''
  public prompt = ''
  public focus: 'title' | 'prompt' | 'agent' | 'options' = 'title'
  public busy = false
  public error = ''
  public createdId: string | undefined
  public readonly selection: AgentSelectionModel
  public constructor(
    service: AgentConfigurationsService,
    private readonly actions: DialogueActions,
    private readonly commands: DialogueCommands,
    private readonly onCreated: (id: string) => void,
  ) {
    this.selection = new AgentSelectionModel(service)
    makeAutoObservable(this, {}, { autoBind: true })
  }
  public mount(): void { this.selection.start() }
  public dispose(): void { this.selection.dispose() }
  public setTitle(value: string): void { this.title = value }
  public setPrompt(value: string): void { this.prompt = value }
  public async submit(): Promise<void> {
    if (this.busy || this.prompt.trim() === '' || this.createdId !== undefined) return
    this.error = ''
    this.busy = true
    try {
      const agent = this.selection.selectedAgent
      if (!agent) throw new Error('Choose an agent configuration first.')
      const configuration = this.selection.configuration
      const resource = await this.actions.create({
        title: this.title.trim() || this.prompt.trim().slice(0, 80),
        agentId: agent.id, agentVersion: agent.version,
        agentInstallationId: agent.installationId,
        agentConfiguration: configuration.selections,
      })
      this.createdId = resource.id
      try {
        await this.commands.send(resource.id, this.prompt)
      } catch (error) {
        const pending = this.commands.pending.find((command) => command.kind === 'message' && command.dialogueId === resource.id)
        if (pending?.kind === 'message') await this.commands.retrySend(pending.commandId)
        else throw error
      }
      this.onCreated(resource.id)
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unable to create dialogue.'
    } finally { this.busy = false }
  }
}
