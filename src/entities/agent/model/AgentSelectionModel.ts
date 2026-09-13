import { makeAutoObservable, reaction } from 'mobx'
import type {
  AgentConfigurationOption,
  AgentConfigurationsService,
  AgentLaunchConfiguration,
} from '../../../modules/agent-configurations/index.js'

export interface AgentSelectionOption {
  readonly option: AgentConfigurationOption
  readonly override?: string | boolean
}

export interface SelectableAgent {
  readonly id: string
  readonly version: string
  readonly installationId: string
  readonly name: string
  readonly description: string
  readonly identity: string
}

export class AgentSelectionModel {
  private selectedIdentity = ''
  private selectedRevision = ''
  private readonly selections = new Map<string, string | boolean>()
  private invalidationMessage = ''
  private optionIndex = 0
  private stopCatalogReaction: (() => void) | undefined

  public constructor(private readonly service: AgentConfigurationsService) {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  public get agents(): readonly SelectableAgent[] {
    return this.service.availableAgents.map((agent) => ({
      ...agent,
      identity: identityOf(agent.id, agent.version, agent.installationId),
    }))
  }

  public get selectedAgent(): SelectableAgent | undefined {
    return this.agents.find((agent) => agent.identity === this.selectedIdentity)
  }

  public get options(): readonly AgentSelectionOption[] {
    const agent = this.selectedAgent
    if (agent === undefined) return []
    const catalog = this.service.catalogFor(
      agent.id,
      agent.version,
      agent.installationId,
    )
    return (catalog?.options ?? []).map((option) => ({
      option,
      override: this.selections.get(option.id),
    }))
  }

  public get selectedOptionIndex(): number {
    return this.optionIndex
  }

  public get ready(): boolean {
    return (
      this.service.readiness === 'READY' && this.selectedAgent !== undefined
    )
  }

  public get loading(): boolean {
    return this.service.readiness === 'LOADING'
  }

  public get error(): string {
    return this.invalidationMessage || this.service.error
  }

  public get configuration(): AgentLaunchConfiguration {
    const agent = this.selectedAgent
    if (this.service.readiness !== 'READY' || this.selectedRevision === '') {
      throw new Error('Choose an available agent configuration first.')
    }
    if (agent === undefined) {
      throw new Error('The selected agent is no longer available.')
    }
    const catalog = this.service.catalogFor(
      agent.id,
      agent.version,
      agent.installationId,
    )
    if (catalog?.catalogRevision !== this.selectedRevision) {
      throw new Error(
        'The selected agent configuration changed. Select it again.',
      )
    }
    assertSelections(catalog.options, this.selections)
    return {
      catalogRevision: this.selectedRevision,
      selections: Object.fromEntries(this.selections),
    }
  }

  public start(): void {
    if (this.stopCatalogReaction !== undefined) return
    this.stopCatalogReaction = reaction(
      () => [this.service.readiness, this.service.catalogsSnapshot] as const,
      this.synchronizeSelection,
    )
    this.synchronizeSelection()
  }

  public selectAgent(identity: string): void {
    const agent = this.agents.find(
      (candidate) => candidate.identity === identity,
    )
    if (agent === undefined)
      throw new Error('The selected agent is unavailable.')
    const catalog = this.service.catalogFor(
      agent.id,
      agent.version,
      agent.installationId,
    )
    if (catalog === undefined)
      throw new Error('The selected agent catalog is unavailable.')

    if (
      this.selectedIdentity !== identity ||
      this.selectedRevision !== catalog.catalogRevision
    ) {
      this.selections.clear()
    }
    this.selectedIdentity = identity
    this.selectedRevision = catalog.catalogRevision
    this.optionIndex = 0
    this.invalidationMessage = ''
  }

  public selectNext(delta: number): void {
    const agents = this.agents
    if (!agents.length) return
    const index = agents.findIndex(
      (agent) => agent.identity === this.selectedIdentity,
    )
    const start = index < 0 ? -1 : index
    const next = agents[Math.min(agents.length - 1, Math.max(0, start + delta))]
    if (next !== undefined) this.selectAgent(next.identity)
  }

  public selectNextOption(delta: number): void {
    const options = this.options
    if (!options.length) return
    this.optionIndex = Math.min(
      options.length - 1,
      Math.max(0, this.optionIndex + delta),
    )
  }

  public cycleSelectedOption(): void {
    const current = this.options[this.optionIndex]
    if (current === undefined) return
    const values =
      current.option.kind === 'boolean'
        ? [false, true]
        : current.option.values.map((value) => value.value)
    const currentValue = current.override ?? current.option.currentValue
    const index = Math.max(
      0,
      values.findIndex((value) => value === currentValue),
    )
    const next = values[(index + 1) % values.length]
    if (next !== undefined) this.selectOption(current.option.id, next)
  }

  public selectOption(id: string, value: string | boolean): void {
    const selection = this.options.find(
      (candidate) => candidate.option.id === id,
    )
    if (selection === undefined)
      throw new Error('The selected option is unavailable.')
    assertOptionValue(selection.option, value)
    this.selections.set(id, value)
  }

  public dispose(): void {
    this.stopCatalogReaction?.()
    this.stopCatalogReaction = undefined
  }

  private synchronizeSelection(): void {
    if (this.selectedIdentity === '') return
    const selected = this.selectedAgent
    if (selected === undefined) {
      this.invalidate('The selected agent is no longer available.')
      return
    }
    const catalog = this.service.catalogFor(
      selected.id,
      selected.version,
      selected.installationId,
    )
    if (catalog?.catalogRevision !== this.selectedRevision) {
      this.invalidate(
        'The selected agent configuration changed. Select it again.',
      )
    }
  }

  private invalidate(message: string): void {
    this.selectedIdentity = ''
    this.selectedRevision = ''
    this.selections.clear()
    this.invalidationMessage = message
  }
}

function identityOf(
  id: string,
  version: string,
  installationId: string,
): string {
  return JSON.stringify([id, version, installationId])
}

function assertOptionValue(
  option: AgentConfigurationOption,
  value: string | boolean,
): void {
  if (option.kind === 'boolean') {
    if (typeof value !== 'boolean')
      throw new Error('Expected a boolean option value.')
    return
  }
  if (
    typeof value !== 'string' ||
    !option.values.some((candidate) => candidate.value === value)
  ) {
    throw new Error('The selected option value is unavailable.')
  }
}

function assertSelections(
  options: readonly AgentConfigurationOption[],
  selections: ReadonlyMap<string, string | boolean>,
): void {
  for (const [id, value] of selections) {
    const option = options.find((candidate) => candidate.id === id)
    if (option === undefined) {
      throw new Error(
        'The selected agent configuration changed. Select it again.',
      )
    }
    try {
      assertOptionValue(option, value)
    } catch {
      throw new Error(
        'The selected agent configuration changed. Select it again.',
      )
    }
  }
}
