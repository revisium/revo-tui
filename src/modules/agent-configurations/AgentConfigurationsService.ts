import { makeAutoObservable, runInAction } from 'mobx'
import {
  errorMessageOf,
  ObservableRequest,
  RequestAbortError,
} from '../observable-request/index.js'
import type { AgentConfigurationsTransport } from './contracts/transport.js'
import type {
  AgentConfigurationCatalog,
  AgentConfigurationsSnapshot,
  AgentConfigurationsStatus,
  AgentDefinition,
} from './contracts/types.js'

const INITIAL_STATUS: AgentConfigurationsStatus = 'NOT_INITIALIZED'

export class AgentConfigurationsService {
  private status: AgentConfigurationsStatus = INITIAL_STATUS
  private catalogs: readonly AgentConfigurationCatalog[] = []
  private definitions: readonly AgentDefinition[] = []
  private errorMessage = ''
  private lifetime: AbortController | undefined
  private lease:
    | ReturnType<AgentConfigurationsTransport['subscribe']>
    | undefined
  private pendingDefinitions:
    | {
        readonly generation: number
        readonly items: readonly AgentDefinition[]
      }
    | undefined
  private definitionsGeneration = 0
  private generation = 0
  private readonly definitionsRequest: ObservableRequest<
    readonly AgentDefinition[],
    [AbortSignal]
  >

  public constructor(private readonly transport: AgentConfigurationsTransport) {
    this.definitionsRequest = ObservableRequest.of(
      ({ signal }, subscriptionSignal: AbortSignal) =>
        this.loadDefinitions(AbortSignal.any([signal, subscriptionSignal])),
    )
    makeAutoObservable(this, {}, { autoBind: true })
  }

  public get readiness(): AgentConfigurationsStatus {
    return this.status
  }

  public get catalogsSnapshot(): readonly AgentConfigurationCatalog[] {
    return this.catalogs
  }

  public get availableAgents(): readonly AgentDefinition[] {
    return this.definitions.filter((definition) =>
      this.catalogFor(
        definition.id,
        definition.version,
        definition.installationId,
      ),
    )
  }

  public get error(): string {
    return this.errorMessage
  }

  public catalogFor(
    id: string,
    version: string,
    installationId: string,
  ): AgentConfigurationCatalog | undefined {
    return this.catalogs.find(
      (catalog) =>
        catalog.agent.id === id &&
        catalog.agent.version === version &&
        catalog.agent.installationId === installationId,
    )
  }

  public start(): void {
    if (this.lifetime !== undefined && !this.lifetime.signal.aborted) return

    const generation = this.generation + 1
    const lifetime = new AbortController()
    this.generation = generation
    this.lifetime = lifetime
    this.status = 'LOADING'
    this.errorMessage = ''
    let lease: ReturnType<AgentConfigurationsTransport['subscribe']>
    try {
      lease = this.transport.subscribe({
        signal: lifetime.signal,
        prepare: (signal) => this.prepare(generation, signal),
        next: (snapshot, signal) => this.receive(generation, snapshot, signal),
        changed: (state) => this.connectionChanged(generation, state),
      })
    } catch (error) {
      this.dispose()
      throw error
    }
    this.lease = lease
    lease.done.then(
      () =>
        this.failed(
          generation,
          lease,
          new Error('Agent configuration subscription ended.'),
        ),
      (error: unknown) => this.failed(generation, lease, error),
    )
  }

  public dispose(): void {
    this.generation += 1
    this.lifetime?.abort()
    this.lifetime = undefined
    this.lease?.dispose()
    this.lease = undefined
    this.definitionsRequest.abort()
    this.pendingDefinitions = undefined
    this.definitionsGeneration = 0
    this.status = INITIAL_STATUS
    this.catalogs = []
    this.definitions = []
    this.errorMessage = ''
  }

  private async prepare(
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    if (!this.isCurrent(generation, signal)) throw new RequestAbortError()
    const result = await this.definitionsRequest.fetch(signal)
    if (!this.isCurrent(generation, signal)) throw new RequestAbortError()
    if (!result.isRight) throw result.error

    runInAction(() => {
      this.status = 'LOADING'
      this.pendingDefinitions = { generation, items: result.data }
    })
  }

  private receive(
    generation: number,
    snapshot: AgentConfigurationsSnapshot,
    signal: AbortSignal,
  ): void {
    if (!this.isCurrent(generation, signal)) return
    const pending = this.pendingDefinitions
    if (
      pending?.generation !== generation &&
      this.definitionsGeneration !== generation
    ) {
      throw new Error('Agent definitions are unavailable for this snapshot.')
    }

    runInAction(() => {
      this.status = snapshot.status
      this.catalogs = [...snapshot.catalogs]
      if (pending?.generation === generation) {
        this.definitions = [...pending.items]
        this.definitionsGeneration = generation
        this.pendingDefinitions = undefined
      }
      this.errorMessage = ''
    })
  }

  private connectionChanged(
    generation: number,
    state: { readonly status: string; readonly error: string },
  ): void {
    if (generation !== this.generation) return
    if (state.error !== '') this.errorMessage = state.error
    if (
      state.status === 'Connecting' ||
      state.status === 'Reconnecting' ||
      state.status === 'Offline'
    ) {
      this.status = 'LOADING'
    }
  }

  private failed(
    generation: number,
    lease: ReturnType<AgentConfigurationsTransport['subscribe']>,
    error: unknown,
  ): void {
    if (generation !== this.generation || lease !== this.lease) return
    this.lifetime?.abort()
    this.definitionsRequest.abort()
    runInAction(() => {
      this.lifetime = undefined
      this.lease = undefined
      this.pendingDefinitions = undefined
      this.definitionsGeneration = 0
      this.status = INITIAL_STATUS
      this.errorMessage = errorMessageOf(error)
    })
  }

  private async loadDefinitions(
    signal: AbortSignal,
  ): Promise<readonly AgentDefinition[]> {
    const definitions: AgentDefinition[] = []
    const cursors = new Set<string>()
    let after: string | undefined

    do {
      signal.throwIfAborted()
      const page = await this.transport.definitions(signal, after)
      definitions.push(...page.items)
      after = page.next
      if (after !== undefined && cursors.has(after)) {
        throw new Error('Agent definition pagination returned a cursor cycle.')
      }
      if (after !== undefined) cursors.add(after)
    } while (after !== undefined)

    return definitions
  }

  private isCurrent(generation: number, signal: AbortSignal): boolean {
    return generation === this.generation && !signal.aborted
  }
}
