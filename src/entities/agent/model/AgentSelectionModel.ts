import { makeAutoObservable, reaction } from 'mobx'
import { agentLabelOf } from './agent-label.js'
import type {
  AgentConfigurationCatalog,
  AgentConfigurationOption,
  AgentConfigurationsService,
  AgentLaunchConfiguration,
} from '../../../modules/agent-configurations/index.js'

export interface AgentSelectionOption {
  readonly option: AgentConfigurationOption
  readonly override?: string | boolean
}

const SUFFIX_LENGTH = 6

export class AgentSelectionError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'AgentSelectionError'
  }
}

export interface SelectableAgent {
  readonly id: string
  readonly version: string
  readonly installationId: string
  readonly name: string
  readonly description: string
  readonly identity: string
  readonly label: string
}

export class AgentSelectionModel {
  private selectedIdentity = ''
  private selectedRevision = ''
  private readonly selections = new Map<string, string | boolean>()
  private noticeMessage = ''
  private chosenByUser = false
  private selectedLabel = ''
  private optionIndex = 0
  private stopCatalogReaction: (() => void) | undefined

  public constructor(private readonly service: AgentConfigurationsService) {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  public get agents(): readonly SelectableAgent[] {
    const agents = this.service.availableAgents.map((agent) => ({
      ...agent,
      identity: identityOf(agent.id, agent.version, agent.installationId),
      label: agentLabelOf(
        agent.name,
        this.service.catalogFor(agent.id, agent.version, agent.installationId)
          ?.launch.reportedVersion,
      ),
    }))
    return disambiguateLabels(agents)
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
    return this.service.error
  }

  public get notice(): string {
    return this.noticeMessage
  }

  public get configuration(): AgentLaunchConfiguration {
    if (this.service.readiness !== 'READY' || this.selectedRevision === '') {
      throw new AgentSelectionError(
        'Choose an available agent configuration first.',
      )
    }
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
    this.chosenByUser = true
    this.applyAgent(identity)
  }

  public dismissNotice(): void {
    this.noticeMessage = ''
  }

  private applyAgent(identity: string): void {
    const agent = this.agents.find(
      (candidate) => candidate.identity === identity,
    )
    if (agent === undefined)
      throw new AgentSelectionError('The selected agent is unavailable.')
    const catalog = this.service.catalogFor(
      agent.id,
      agent.version,
      agent.installationId,
    )
    if (catalog === undefined)
      throw new AgentSelectionError(
        'The selected agent catalog is unavailable.',
      )

    if (
      this.selectedIdentity !== identity ||
      this.selectedRevision !== catalog.catalogRevision
    ) {
      this.selections.clear()
    }
    this.selectedIdentity = identity
    this.selectedLabel = agent.label
    this.selectedRevision = catalog.catalogRevision
    this.optionIndex = 0
    this.noticeMessage = ''
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
    const values: readonly (string | boolean)[] =
      current.option.kind === 'boolean'
        ? [false, true]
        : current.option.values.map((value) => value.value)
    const currentValue = current.override ?? current.option.currentValue
    const index = Math.max(0, values.indexOf(currentValue))
    const next = values[(index + 1) % values.length]
    if (next !== undefined) this.selectOption(current.option.id, next)
  }

  public selectOption(id: string, value: string | boolean): void {
    const selection = this.options.find(
      (candidate) => candidate.option.id === id,
    )
    if (selection === undefined)
      throw new AgentSelectionError('The selected option is unavailable.')
    assertOptionValue(selection.option, value)
    this.selections.set(id, value)
  }

  public dispose(): void {
    this.stopCatalogReaction?.()
    this.stopCatalogReaction = undefined
  }

  private synchronizeSelection(): void {
    if (this.service.readiness !== 'READY') return
    if (this.selectedIdentity !== '') this.validateSelection()
    if (this.selectedIdentity === '') this.selectFirstAgent()
  }

  private selectFirstAgent(): void {
    const first = this.agents[0]
    if (first !== undefined) this.applyAgent(first.identity)
  }

  private validateSelection(): void {
    const selected = this.selectedAgent
    if (selected === undefined) {
      this.replaceUnavailableAgent()
      return
    }
    const catalog = this.service.catalogFor(
      selected.id,
      selected.version,
      selected.installationId,
    )
    if (
      catalog !== undefined &&
      catalog.catalogRevision !== this.selectedRevision
    ) {
      this.carryOverSelections(catalog)
    }
  }

  private replaceUnavailableAgent(): void {
    const wasChosen = this.chosenByUser
    const previous = this.selectedLabel
    this.selectedIdentity = ''
    this.selectedRevision = ''
    this.selections.clear()
    this.chosenByUser = false
    this.selectFirstAgent()
    if (!wasChosen) return
    const next = this.selectedAgent
    this.noticeMessage =
      next === undefined
        ? `${previous} is no longer available.`
        : `${previous} is no longer available; switched to ${next.label}.`
  }

  private carryOverSelections(catalog: AgentConfigurationCatalog): void {
    const dropped: string[] = []
    for (const [id, value] of [...this.selections]) {
      const option = catalog.options.find((candidate) => candidate.id === id)
      if (option === undefined || !isOfferedValue(option, value)) {
        this.selections.delete(id)
        dropped.push(option?.name ?? id)
      }
    }
    this.selectedRevision = catalog.catalogRevision
    this.optionIndex = Math.min(
      this.optionIndex,
      Math.max(0, catalog.options.length - 1),
    )
    this.noticeMessage = dropped.length
      ? `Agent configuration changed; ${dropped.join(', ')} reset to default.`
      : this.noticeMessage
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
      throw new AgentSelectionError('Expected a boolean option value.')
    return
  }
  if (
    typeof value !== 'string' ||
    !option.values.some((candidate) => candidate.value === value)
  ) {
    throw new AgentSelectionError('The selected option value is unavailable.')
  }
}

function isOfferedValue(
  option: AgentConfigurationOption,
  value: string | boolean,
): boolean {
  try {
    assertOptionValue(option, value)
    return true
  } catch {
    return false
  }
}

function disambiguateLabels(
  agents: readonly SelectableAgent[],
): readonly SelectableAgent[] {
  return agents.map((agent) => {
    const same = agents.filter((other) => other.label === agent.label)
    if (same.length === 1) return agent
    const versionsDiffer = new Set(same.map((other) => other.version)).size > 1
    const suffix = versionsDiffer
      ? agent.version
      : agent.installationId.slice(-SUFFIX_LENGTH)
    return { ...agent, label: `${agent.label} (${suffix})` }
  })
}
