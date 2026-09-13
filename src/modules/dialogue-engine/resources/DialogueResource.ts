import { makeAutoObservable, runInAction } from 'mobx'
import {
  ObservableRequest,
  errorMessageOf,
} from '../../observable-request/index.js'
import type { DialogueReadBackend } from '../contracts/backend.types.js'
import type { DialogueView } from '../contracts/public.types.js'
import type {
  DialogueInteraction,
  DialogueTurn,
} from '../contracts/dialogue.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import type { DialogueStore } from '../state/DialogueStore.js'
import { DialogueHistory } from './DialogueHistory.js'
import type { DialogueCommands } from '../commands/DialogueCommands.js'
import { DialogueInteractionSession } from './DialogueInteractionSession.js'

export class DialogueResource {
  public readonly history: DialogueHistory
  private readonly request: ObservableRequest<void, [number]>
  private generation = 0
  private detailsReady = false
  private interactionsReady = false
  private relatedGeneration = 0
  private owned = false
  private readonly sessions = new Map<string, DialogueInteractionSession>()

  public constructor(
    public readonly id: string,
    private readonly backend: DialogueReadBackend,
    private readonly store: DialogueStore,
    private readonly commands: DialogueCommands,
  ) {
    this.history = new DialogueHistory(id, backend, store)
    this.request = ObservableRequest.of(
      ({ signal }, generation) => this.fetchDetails(generation, signal),
      { skipResetting: true },
    )
    makeAutoObservable<
      this,
      'backend' | 'commands' | 'history' | 'request' | 'sessions' | 'store'
    >(
      this,
      {
        backend: false,
        history: false,
        request: false,
        store: false,
        commands: false,
        sessions: false,
      },
      { autoBind: true },
    )
  }

  public get snapshot(): DialogueView | undefined {
    return this.store.model(this.id)?.view
  }

  public get ready(): boolean {
    return this.detailsReady && this.history.ready
  }

  public get turns(): readonly DialogueTurn[] {
    return this.store.model(this.id)?.turns ?? []
  }

  public get interactions(): readonly DialogueInteraction[] {
    return this.store.model(this.id)?.interactions ?? []
  }

  public interaction(id: string): DialogueInteractionSession {
    let session = this.sessions.get(id)
    if (session === undefined) {
      session = new DialogueInteractionSession(this.id, id, this, this.commands)
      this.sessions.set(id, session)
    }
    if (this.interactionsReady) session.activate(true)
    return session
  }

  public get loading(): boolean {
    return this.request.isLoading || this.history.loading
  }

  public get error(): string {
    const error = this.request.error
    if (error instanceof DialogueError) return error.message
    if (error != null) return errorMessageOf(error)
    return this.history.error
  }

  public start(): Promise<void> {
    return this.refresh()
  }

  public async refresh(): Promise<void> {
    const generation = this.generation + 1
    this.generation = generation
    this.detailsReady = false
    this.beginRelatedRefresh()
    this.history.dispose()
    const details = await this.request.fetch(generation)
    if (!details.isRight) throw details.error
    if (generation !== this.generation) return
    await this.history.refresh()
  }

  public beginRelatedRefresh(): number {
    this.relatedGeneration += 1
    this.owned = true
    this.interactionsReady = false
    for (const session of this.sessions.values()) session.activate(false)
    return this.relatedGeneration
  }

  public completeRelatedRefresh(
    generation: number,
    turns: readonly DialogueTurn[],
    interactions: readonly DialogueInteraction[],
  ): void {
    if (!this.owned || generation !== this.relatedGeneration) return
    const model = this.store.require(this.id)
    runInAction(() => {
      if (!this.owned || generation !== this.relatedGeneration) return
      model.replaceRelated(turns, interactions)
      this.interactionsReady = true
      for (const session of this.sessions.values()) session.activate(true)
    })
  }

  public dispose(): void {
    this.generation += 1
    this.request.abort()
    this.history.dispose()
    for (const session of this.sessions.values()) session.deactivate()
    this.detailsReady = false
    this.interactionsReady = false
    this.relatedGeneration += 1
    this.owned = false
  }

  private async fetchDetails(
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    const summary = await this.backend.details(this.id, signal)
    if (signal.aborted || generation !== this.generation) return
    if (summary.id !== this.id) {
      throw new DialogueError(
        'identity-mismatch',
        'Dialogue details belong to a different dialogue.',
        'refresh',
      )
    }
    runInAction(() => {
      this.store.include(summary)
      this.detailsReady = true
    })
  }
}
